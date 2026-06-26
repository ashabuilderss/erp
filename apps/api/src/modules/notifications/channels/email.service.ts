import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
      this.logger.log('Email service initialized');
    } else {
      this.logger.warn('SMTP not configured — email sending disabled');
    }
  }

  async send(params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`Email not sent (no SMTP): ${params.subject} -> ${params.to}`);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@ashabuilders.com',
        to: params.to,
        subject: params.subject,
        html: params.html,
      });
      this.logger.log(`Email sent: ${params.subject} -> ${params.to}`);
      return true;
    } catch (err) {
      this.logger.error(`Email failed: ${params.subject} -> ${params.to}`, err);
      return false;
    }
  }
}
