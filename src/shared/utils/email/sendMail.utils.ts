import { config } from "@/config/env";
import nodemailer from "nodemailer";

// Tạo transporter
const transporter = nodemailer.createTransport({
  host: config.MAIL_HOST || "smtp.gmail.com",
  port: config.MAIL_PORT, // Cổng SMTP
  secure: true, // true cho SSL
  auth: {
    user: config.MAIL_USERNAME,
    pass: config.MAIL_PASSWORD,
  },
});

// convert to class EmailUtils
export class EmailUtils {
  static async sendEmail(email: string, subject: string, htmlContent: string) {
    try {
      const info = await transporter.sendMail({
        from: `"iTomo" <SYSTEM>`, // Tên người gửi và email
        to: email,
        subject: subject,
        html: htmlContent,
      });

      console.log(`Email sent to ${email}: ${info.messageId}`);
    } catch (error) {
      console.error("Error sending email: ", error);
    }
  }
}
