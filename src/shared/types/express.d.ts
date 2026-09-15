import { JwtPayload, UserContext } from "./interfaces";
import { Store } from "@/database/models/Branch";
import { PermissionStructure } from "@/shared/middleware/permission.middleware";

declare global {
  namespace Express {
    // Override Passport's User interface to be JwtPayload
    interface User extends JwtPayload {}

    interface Request {
      user?: JwtPayload;
      userContext?: UserContext | null;
      permissions?: PermissionStructure;
      cookies: {
        access_token?: string;
        refresh_token?: string;
        [key: string]: any;
      };
    }
  }
}

export {};
