import { ContainerModule } from "inversify";
import { VERIFY_OTP_TYPES } from "./verifyOtp.types";
import { VerifyOtpRepository } from "./verifyOtp.repository";

export const verifyOtpModule = new ContainerModule((bind) => {
  bind(VERIFY_OTP_TYPES.VerifyOtpRepository).to(VerifyOtpRepository);
});
