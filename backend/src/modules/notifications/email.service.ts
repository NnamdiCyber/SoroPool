import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendEmail(to: string, subject: string, body: string) {
    const _ = { to, subject, body };
    return { sent: true };
  }
}
