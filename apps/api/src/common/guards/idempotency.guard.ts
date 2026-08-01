import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IdempotencyService } from '../services/idempotency.service';
import { IDEMPOTENCY_KEY } from '../decorators/idempotency.decorator';
import type { Request, Response } from 'express';

/**
 * Guard that enforces HTTP-level idempotency for POST endpoints
 * decorated with @UseIdempotency().
 *
 * Flow:
 *  1. Read `Idempotency-Key` header (case-insensitive).
 *  2. If missing, generate a key and set it on the response header.
 *  3. If the key has already been processed successfully, return the
 *     cached response body + status code without calling the handler.
 *  4. If the key is currently in-flight, return 409 Conflict.
 *  5. Otherwise, mark the key as in_progress, call the handler,
 *     cache the result, and return it.
 */
@Injectable()
export class IdempotencyGuard implements CanActivate {
  private readonly logger = new Logger(IdempotencyGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const needsIdempotency = this.reflector.getAllAndOverride<boolean>(
      IDEMPOTENCY_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!needsIdempotency) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Extract company id from the authenticated user (set by JWT strategy)
    const user = (request as any).user;
    const companyId: string = user?.companyId ?? 'unknown';

    // Read or generate idempotency key
    let idempotencyKey =
      (request.headers['idempotency-key'] as string) ||
      (request.headers['x-idempotency-key'] as string) ||
      '';

    let generatedKey = false;
    if (!idempotencyKey) {
      idempotencyKey = this.idempotencyService.generateKey();
      generatedKey = true;
    }

    // Set the key on the response so the client knows what was used
    response.setHeader('Idempotency-Key', idempotencyKey);

    // Check existing state
    const result = await this.idempotencyService.check(
      idempotencyKey,
      companyId,
    );

    switch (result.status) {
      case 'completed': {
        // Replay: return the cached response
        response.setHeader('X-Idempotent-Replayed', 'true');
        response.status(result.statusCode).json(result.body);
        return false; // prevent handler execution
      }

      case 'error': {
        // Replay the cached error
        response.setHeader('X-Idempotent-Replayed', 'true');
        response.status(result.statusCode).json(result.body);
        return false;
      }

      case 'in_progress': {
        // Another request is processing this key
        response
          .status(409)
          .json({
            statusCode: 409,
            message:
              'A request with this idempotency key is already being processed. Retry after a short delay.',
            error: 'Conflict',
          });
        return false;
      }

      case 'new': {
        // Mark as in_progress and allow handler to run
        await this.idempotencyService.markInProgress(
          idempotencyKey,
          companyId,
        );

        // Intercept the response to cache the result
        this.interceptResponse(response, idempotencyKey, companyId);

        // Attach metadata to the request so handlers can use it if needed
        (request as any)._idempotencyKey = idempotencyKey;
        (request as any)._idempotencyGenerated = generatedKey;

        return true;
      }
    }
  }

  /**
   * Monkey-patch res.json() and res.status() to capture the final
   * response and cache it for idempotency.
   */
  private interceptResponse(
    response: Response,
    idempotencyKey: string,
    companyId: string,
  ): void {
    const originalJson = response.json.bind(response);
    let captured = false;

    (
      response as any
    ).json = (body: unknown) => {
      if (!captured) {
        captured = true;
        const statusCode = response.statusCode || 200;

        // Fire-and-forget: cache the result
        if (statusCode >= 200 && statusCode < 300) {
          this.idempotencyService
            .markCompleted(idempotencyKey, companyId, body, statusCode)
            .catch((err) =>
              this.logger.warn('Failed to cache idempotent response', err),
            );
        } else {
          this.idempotencyService
            .markError(idempotencyKey, companyId, body, statusCode)
            .catch((err) =>
              this.logger.warn('Failed to cache idempotent error', err),
            );
        }
      }
      return originalJson(body);
    };
  }
}
