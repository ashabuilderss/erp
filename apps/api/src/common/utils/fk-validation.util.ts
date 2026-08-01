import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';

/**
 * Generic foreign-key / existence validation.
 *
 * Replaces repetitive `findFirst` + `if (!entity) throw` patterns
 * across services.  Uses `findFirst` under the hood so you can pass
 * compound `where` clauses (e.g. `{ id, companyId }`).
 *
 * @param prisma  - The PrismaService instance
 * @param model   - Prisma model name (e.g. `'property'`, `'employee'`)
 * @param where   - Prisma `where` clause — at minimum `{ id: string }`
 * @param label   - Human-readable label for the error message
 *
 * @example
 * ```ts
 * await validateForeignKey(this.prisma, 'property', { id: dto.propertyId, companyId }, 'Property');
 * ```
 */
export async function validateForeignKey(
  prisma: PrismaService,
  model: string,
  where: Record<string, unknown>,
  label: string,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const exists = await (prisma as any)[model].findFirst({ where });
  if (!exists) {
    throw new NotFoundException(`${label} not found`);
  }
}
