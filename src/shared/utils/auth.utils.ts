import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "@/config/env";
import { AuthTokens, JwtPayload } from "@/shared/types/interfaces";
import { Response } from "express";

export class AuthUtils {
  static generateOTP(length: number = 6): string {
    let otp = "";
    for (let i = 0; i < length; i++) {
      otp += Math.floor(Math.random() * 10).toString();
    }
    return otp;
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateTokens(payload: JwtPayload): AuthTokens {
    const accessTokenOptions = { expiresIn: config.JWT_ACCESS_EXPIRES_IN };
    const refreshTokenOptions = { expiresIn: config.JWT_REFRESH_EXPIRES_IN };

    const accessToken = jwt.sign(
      payload as any,
      config.JWT_ACCESS_SECRET as any,
      accessTokenOptions as any,
    ) as string;
    const refreshToken = jwt.sign(
      payload as any,
      config.JWT_REFRESH_SECRET as any,
      refreshTokenOptions as any,
    ) as string;

    return { accessToken, refreshToken };
  }

  static generateAccessToken(payload: JwtPayload): string {
    const accessTokenOptions = { expiresIn: config.JWT_ACCESS_EXPIRES_IN };
    return jwt.sign(
      payload as any,
      config.JWT_ACCESS_SECRET as any,
      accessTokenOptions as any,
    ) as string;
  }

  static verifyAccessToken(token: string): JwtPayload {
    return jwt.verify(token, config.JWT_ACCESS_SECRET) as JwtPayload;
  }

  static verifyRefreshToken(token: string): JwtPayload {
    return jwt.verify(token, config.JWT_REFRESH_SECRET) as JwtPayload;
  }

  static setTokenCookies(res: Response, tokens: AuthTokens): void {
    const isProduction = config.NODE_ENV === "production";

    // Access token - short lived
    res.cookie("accessToken", tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 12 * 60 * 60 * 1000, // 12 hours
      path: "/",
    });

    // Refresh token - long lived
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });
  }

  static setTokenVerifyOtpCookies(res: Response, tokens: string): void {
    const isProduction = config.NODE_ENV === "production";

    res.cookie("verifyOtpToken", tokens, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: config.OTP_EXPIRES_MINUTES * 60 * 1000,
      path: "/",
    });
  }

  static clearTokenCookies(res: any): void {
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
  }
}
