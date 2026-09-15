import { Request, Response, NextFunction } from "express";
import { injectable, inject } from "inversify";
import { BaseController } from "@/shared/base/BaseController";
import { ClubMember, MemberStatus } from "@/database/models/ClubMember";
import { ClubMemberService } from "./clubMember.service";
import { CLUB_MEMBER_TYPES } from "./clubMember.types";

@injectable()
export class ClubMemberController extends BaseController<ClubMember> {
  protected service: ClubMemberService;

  constructor(
    @inject(CLUB_MEMBER_TYPES.ClubMemberService)
    service: ClubMemberService,
  ) {
    super();
    this.service = service;
  }
  approve = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.updateStatus(id, MemberStatus.ACTIVE, undefined, reqContext);
      return res.json({
        success: true,
        data,
        message: "Phê duyệt thành viên thành công",
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  };

  unLock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.updateStatus(id, MemberStatus.ACTIVE, undefined, reqContext);
      return res.json({
        success: true,
        data,
        message: "Mở khóa hội viên thành công",
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  };

  kick = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.updateStatus(id, MemberStatus.OUT, undefined, reqContext);
      return res.json({
        success: true,
        data,
        message: "Đã loại thành viên khỏi câu lạc bộ",
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  };

  block = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const reqContext = this.service.getReqContext(req);
      const data = await this.service.updateStatus(id, MemberStatus.BLOCKED, undefined, reqContext);
      return res.json({
        success: true,
        data,
        message: "Đã chặn thành viên",
        statusCode: 200,
      });
    } catch (error) {
      next(error);
    }
  };
}
