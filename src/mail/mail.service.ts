import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  private getEmailFrom(): string {
    return process.env.EMAIL_FROM || 'NervIS <noreply@nervis.dev>';
  }

  private getFrontendUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:3001';
  }

  /**
   * Send magic link for email verification
   */
  async sendVerificationEmail(to: string, name: string, token: string): Promise<boolean> {
    const verifyUrl = `${this.getFrontendUrl()}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px; }
            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .logo { text-align: center; margin-bottom: 30px; }
            .logo span { font-size: 28px; font-weight: bold; background: linear-gradient(to right, #06b6d4, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            h1 { color: #1e293b; font-size: 20px; margin: 0 0 16px; }
            p { color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
            .button { display: inline-block; background: #06b6d4; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 14px; }
            .button:hover { background: #0891b2; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; }
            .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo"><span>NervIS</span></div>
            <h1>Xác thực email của bạn</h1>
            <p>Xin chào ${name || 'bạn'},</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản NervIS. Vui lòng nhấn nút bên dưới để xác thực email:</p>
            <p style="text-align: center;">
              <a href="${verifyUrl}" class="button">Xác thực email</a>
            </p>
            <p style="font-size: 12px; color: #94a3b8;">Liên kết này sẽ hết hạn sau 24 giờ.</p>
            <div class="footer">
              <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await this.resend.emails.send({
        from: this.getEmailFrom(),
        to,
        subject: 'Xác thực tài khoản NervIS',
        html,
      });
      this.logger.log(`Verification email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${to}`, error);
      return false;
    }
  }

  /**
   * Send booking confirmation to interviewee
   */
  async sendBookingConfirmedEmail(
    to: string,
    intervieweeName: string,
    interviewerName: string,
    date: string,
    time: string,
    meetingLink?: string,
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px; }
            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .logo { text-align: center; margin-bottom: 30px; }
            .logo span { font-size: 28px; font-weight: bold; background: linear-gradient(to right, #06b6d4, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            h1 { color: #1e293b; font-size: 20px; margin: 0 0 16px; }
            p { color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
            .info-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .info-label { color: #64748b; font-size: 13px; }
            .info-value { color: #0f172a; font-size: 14px; font-weight: 600; }
            .button { display: inline-block; background: #06b6d4; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 14px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; }
            .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo"><span>NervIS</span></div>
            <h1>🎉 Lịch phỏng vấn đã được xác nhận!</h1>
            <p>Xin chào ${intervieweeName},</p>
            <p>Mentor <strong>${interviewerName}</strong> đã xác nhận lịch phỏng vấn của bạn.</p>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">Mentor:</span>
                <span class="info-value">${interviewerName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Ngày:</span>
                <span class="info-value">${date}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Giờ:</span>
                <span class="info-value">${time}</span>
              </div>
            </div>
            ${meetingLink ? `
              <p style="text-align: center;">
                <a href="${meetingLink}" class="button">Vào phòng họp</a>
              </p>
            ` : ''}
            <div class="footer">
              <p>Hãy chuẩn bị tốt cho buổi phỏng vấn nhé!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await this.resend.emails.send({
        from: this.getEmailFrom(),
        to,
        subject: '🎉 Lịch phỏng vấn đã được xác nhận - NervIS',
        html,
      });
      this.logger.log(`Booking confirmed email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send booking confirmed email to ${to}`, error);
      return false;
    }
  }

  /**
   * Send interview reminder (1 hour before)
   */
  async sendInterviewReminderEmail(
    to: string,
    name: string,
    partnerName: string,
    time: string,
    meetingLink?: string,
    isInterviewer: boolean = false,
  ): Promise<boolean> {
    const roleLabel = isInterviewer ? 'Ứng viên' : 'Mentor';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px; }
            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .logo { text-align: center; margin-bottom: 30px; }
            .logo span { font-size: 28px; font-weight: bold; background: linear-gradient(to right, #06b6d4, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            h1 { color: #1e293b; font-size: 20px; margin: 0 0 16px; }
            p { color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 16px; }
            .alert-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center; }
            .alert-box p { color: #92400e; margin: 0; font-weight: 600; }
            .info-box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .info-label { color: #64748b; font-size: 13px; }
            .info-value { color: #0f172a; font-size: 14px; font-weight: 600; }
            .button { display: inline-block; background: #06b6d4; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 14px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; }
            .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo"><span>NervIS</span></div>
            <div class="alert-box">
              <p>⏰ Buổi phỏng vấn bắt đầu sau 1 tiếng!</p>
            </div>
            <p>Xin chào ${name},</p>
            <p>Đây là nhắc nhở cho buổi phỏng vấn sắp tới của bạn.</p>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">${roleLabel}:</span>
                <span class="info-value">${partnerName}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Thời gian:</span>
                <span class="info-value">${time}</span>
              </div>
            </div>
            ${meetingLink ? `
              <p style="text-align: center;">
                <a href="${meetingLink}" class="button">Vào phòng họp</a>
              </p>
            ` : ''}
            <div class="footer">
              <p>Chúc bạn có buổi phỏng vấn thành công!</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await this.resend.emails.send({
        from: this.getEmailFrom(),
        to,
        subject: '⏰ Nhắc nhở: Phỏng vấn bắt đầu sau 1 tiếng - NervIS',
        html,
      });
      this.logger.log(`Interview reminder email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send interview reminder email to ${to}`, error);
      return false;
    }
  }

  /**
   * Send password reset magic link
   */
  async sendPasswordResetEmail(to: string, name: string, resetLink: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; margin: 0; padding: 40px 20px; }
            .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 8px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .logo { text-align: center; margin-bottom: 30px; }
            .logo span { font-size: 28px; font-weight: bold; background: linear-gradient(to right, #06b6d4, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            h1 { color: #1e293b; font-size: 20px; margin: 0 0 16px; }
            p { color: #64748b; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
            .button { display: inline-block; background: #06b6d4; color: white; text-decoration: none; padding: 12px 32px; border-radius: 6px; font-weight: 600; font-size: 14px; }
            .button:hover { background: #0891b2; }
            .alert-box { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0; }
            .alert-box p { color: #92400e; margin: 0; font-size: 13px; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; }
            .footer p { color: #94a3b8; font-size: 12px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo"><span>NervIS</span></div>
            <h1>Đặt lại mật khẩu</h1>
            <p>Xin chào ${name || 'bạn'},</p>
            <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn nút bên dưới để tạo mật khẩu mới:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Đặt lại mật khẩu</a>
            </p>
            <div class="alert-box">
              <p>⏰ Liên kết này sẽ hết hạn sau 1 giờ.</p>
            </div>
            <div class="footer">
              <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
              <p>Mật khẩu hiện tại của bạn sẽ không thay đổi.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    try {
      await this.resend.emails.send({
        from: this.getEmailFrom(),
        to,
        subject: '🔐 Đặt lại mật khẩu - NervIS',
        html,
      });
      this.logger.log(`Password reset email sent to ${to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
      return false;
    }
  }
}
