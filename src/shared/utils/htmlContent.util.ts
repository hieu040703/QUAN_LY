import { config } from "@/config/env";
import dayjs from "dayjs";

export const htmlContent = (otp: string) => {
  const formattedOtp = otp.split("").join(" ");

  return `
  <!DOCTYPE html>
  <html lang="vi">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Xác thực tài khoản</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background-color: #f9f9f9;
      }
      .header {
        text-align: center;
        font-size: 24px;
        font-weight: bold;
        margin-bottom: 20px;
        color: #333;
      }
      .content {
        text-align: center;
        margin-bottom: 20px;
      }
      .otp-box {
        display: flex;
        justify-content: center;
        align-items: center;
        background-color: #007bff;
        color: #fff;
        font-size: 36px;
        font-weight: bold;
        padding: 10px 20px;
        border-radius: 8px;
        margin: 20px 0;
        gap: 10px; /* Khoảng cách giữa các ký tự */
        width: fit-content;
        margin-left: auto;
        margin-right: auto;
      }
      .footer {
        text-align: center;
        font-size: 14px;
        color: #555;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">Chào mừng bạn đến với Thực phẩm sạch!</div>
      <div class="content">
        <p>Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã bên dưới để xác thực tài khoản của bạn.</p>
        <div class="otp-box">${formattedOtp}</div>
        <p>Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.</p>
      </div>
      <div class="footer">
        <p>Trân trọng,<br>Thực phẩm sạch</p>
      </div>
    </div>
  </body>
  </html>
  `;
};
