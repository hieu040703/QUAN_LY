import { VerifyOtpSelectFull, VerifyOtpRelations } from "./verifyOtp.select";
import { VerifyOtp } from "@/database/models/VerifyOtp";
import { BaseRepository } from "@/shared/base/BaseRepository";

export class VerifyOtpRepository extends BaseRepository<VerifyOtp> {
  protected entityClass = VerifyOtp;
  protected selectedFields = VerifyOtpSelectFull;
  protected relations = VerifyOtpRelations;

  constructor() {
    super();
  }
}
