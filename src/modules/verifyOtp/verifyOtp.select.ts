import { VerifyOtp } from "@/database/models/VerifyOtp";
import { BaseSelect } from "@/shared/base/BaseSelect";
import { FindOptionsSelect, FindOptionsRelations } from "typeorm";

export const VerifyOtpSelectBasic: FindOptionsSelect<VerifyOtp> = {
  ...BaseSelect,
  userId: true,
  otp: true,
  isUsed: true,
  type: true,
  expiresAt: true,
  email: true,
  phone: true,
};

export const VerifyOtpSelectFull: FindOptionsSelect<VerifyOtp> = {
  ...VerifyOtpSelectBasic,
};

export const VerifyOtpRelations: FindOptionsRelations<VerifyOtp> = {};
