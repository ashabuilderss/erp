import { Injectable, Logger } from '@nestjs/common';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private initialized = false;

  constructor() {
    const credentialsPath = process.env.FCM_CREDENTIALS_PATH;
    const serverKey = process.env.FCM_SERVER_KEY;

    try {
      if (credentialsPath) {
        const serviceAccount = require(credentialsPath);
        initializeApp({ credential: cert(serviceAccount) });
        this.initialized = true;
        this.logger.log('FCM initialized via service account');
      } else if (serverKey) {
        initializeApp({ credential: applicationDefault() });
        this.initialized = true;
        this.logger.log('FCM initialized via application default');
      } else {
        this.logger.warn('FCM not configured — push notifications disabled');
      }
    } catch (err) {
      this.logger.warn('FCM init failed', err);
    }
  }

  async send(params: {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<boolean> {
    if (!this.initialized) {
      this.logger.warn(`Push not sent (no FCM): ${params.title}`);
      return false;
    }

    try {
      await getMessaging().send({
        token: params.token,
        notification: { title: params.title, body: params.body },
        data: params.data,
      });
      this.logger.log(`Push sent: ${params.title}`);
      return true;
    } catch (err) {
      this.logger.error(`Push failed: ${params.title}`, err);
      return false;
    }
  }
}
