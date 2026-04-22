import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.logger.log(`Initializing MailService for Gmail (Manual Config) with user: ${user}`);

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false
      }
    });

    // Verify connection on startup
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error('SMTP Connection Error', error.stack);
      } else {
        this.logger.log('SMTP Server is ready to take our messages');
      }
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    const from = `TillCloud POS <${this.configService.get<string>('SMTP_FROM')}>`;

    try {
      this.logger.debug(`Attempting to send email to ${to} from ${from}`);
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });

      this.logger.log(`Email successfully sent to ${to}. MessageId: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Critical Email Failure for ${to}:`, error.stack);
      // Log more SMTP details if available
      if (error.response) {
        this.logger.error(`SMTP Response: ${error.response}`);
      }
      if (error.code) {
        this.logger.error(`SMTP Error Code: ${error.code}`);
      }
      throw error;
    }
  }

  async sendOtpEmail(to: string, otp: string) {
    const subject = 'Your TillCloud POS Verification Code';
    const text = `Your verification code is: ${otp}. This code will expire in 5 minutes.`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0c1424; margin-bottom: 24px;">Verify your email</h2>
        <p style="font-size: 16px; color: #4a5568; line-height: 1.6;">Welcome to TillCloud POS! Use the verification code below to complete your setup.</p>
        <div style="margin: 32px 0; padding: 20px; background-color: #f8fafc; border-radius: 12px; text-align: center;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0c1424;">${otp}</span>
        </div>
        <p style="font-size: 14px; color: #718096;">This code will expire in 5 minutes. If you did not request this code, please ignore this email.</p>
        <hr style="margin: 32px 0; border: 0; border-top: 1px solid #e2e8f0;" />
        <p style="font-size: 12px; color: #a0aec0; text-align: center;">&copy; 2026 TillCloud POS. All rights reserved.</p>
      </div>
    `;

    return this.sendMail(to, subject, text, html);
  }
}
