import { Injectable, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private sesClient: SESClient | null = null;
  private readonly defaultFrom: string;

  constructor() {
    this.defaultFrom = process.env.SES_FROM_EMAIL || process.env.SMTP_FROM || 'noreply@ashabuilders.com';
    
    const region = process.env.AWS_REGION || process.env.S3_REGION || 'ap-south-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.S3_SECRET_ACCESS_KEY;

    if (accessKeyId && secretAccessKey) {
      this.sesClient = new SESClient({
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log('AWS SES Email service initialized');
    } else {
      this.logger.warn('AWS SES credentials not configured — email sending disabled');
    }
  }

  async send(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    if (!this.sesClient) {
      this.logger.warn(`Email not sent (SES disabled): ${params.subject} -> ${params.to}`);
      return false;
    }

    try {
      const command = new SendEmailCommand({
        Source: this.defaultFrom,
        Destination: {
          ToAddresses: [params.to],
        },
        Message: {
          Subject: { Data: params.subject, Charset: 'UTF-8' },
          Body: {
            Html: { Data: params.html, Charset: 'UTF-8' },
          },
        },
      });

      await this.sesClient.send(command);
      this.logger.log(`Email sent via SES: ${params.subject} -> ${params.to}`);
      return true;
    } catch (err) {
      this.logger.error(`Email failed (SES): ${params.subject} -> ${params.to}`, err);
      return false;
    }
  }
}
