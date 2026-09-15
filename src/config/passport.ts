import { Router } from "express";
import { injectable } from "inversify";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import logger from "@/shared/utils/logger";

@injectable()
export class PassportAuthRouter {
  private router: Router;

  constructor() {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      "/google",
      passport.authenticate("google", { scope: ["profile", "email"] })
    );
    this.router.get(
      "/facebook",
      passport.authenticate("facebook", { scope: ["email"] })
    );
    this.router.get("/github", passport.authenticate("github"));

    // TODO: Callback routes
    // this.router.get(
    //   "/callback/google",
    //   passport.authenticate("google", { failureRedirect: "/" }),
    //   this.passportAuthController.handleOAuthCallback
    // );

    // this.router.get(
    //   "/callback/facebook",
    //   passport.authenticate("facebook", { failureRedirect: "/" }),
    //   this.passportAuthController.handleOAuthCallback
    // );

    // this.router.get(
    //   "/callback/yahoo",
    //   passport.authenticate("yahoo", { failureRedirect: "/" }),
    //   this.passportAuthController.handleOAuthCallback
    // );
  }

  public getRouter(): Router {
    return this.router;
  }
}

export function initializePassport() {
  // Serialize user - lưu vào session
  passport.serializeUser((user: any, done) => {
    logger.info("🔵 Serializing user:", user.email);
    done(null, user);
  });

  // Deserialize user - lấy từ session
  passport.deserializeUser((user: any, done) => {
    logger.info("🟢 Deserializing user:", user.email);
    done(null, user);
  });

  // Google Strategy
  if (
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  ) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_OAUTH_CLIENT_ID,
          clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
          callbackURL:
            `${process.env.API_DOMAIN || "http://localhost:4060"}` +
            "/v1/admin/passport-auth/callback/google",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Profile data từ Google
            const userData: any = {
              providerId: profile.id,
              provider: "google",
              email: profile.emails?.[0]?.value,
              name: profile.displayName,
              avatar: profile.photos?.[0]?.value,
              profile: profile,
            };

            return done(null, userData);
          } catch (error) {
            logger.error("Google OAuth error:", error);
            return done(error as Error, false);
          }
        }
      )
    );
    logger.info("✅ Google OAuth strategy initialized");
  } else {
    logger.warn("⚠️ Google OAuth credentials not configured");
  }

  // Facebook Strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL:
            `${process.env.API_DOMAIN || "http://localhost:4060"}` +
            "/v1/admin/passport-auth/callback/facebook",
          profileFields: ["id", "emails", "name", "picture"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            console.log({
              profile,
            });
            const email = profile.emails?.[0]?.value || "";
            const name = `${profile.name?.givenName || ""} ${
              profile.name?.familyName || ""
            }`.trim();

            const userData: any = {
              providerId: profile.id,
              provider: "facebook",
              email,
              name,
              avatar: profile.photos?.[0]?.value,
              profile: profile,
            };

            return done(null, userData);
          } catch (error) {
            logger.error("Facebook OAuth error:", error);
            return done(error as Error, undefined);
          }
        }
      )
    );
    logger.info("✅ Facebook OAuth strategy initialized");
  } else {
    logger.warn("⚠️ Facebook OAuth credentials not configured");
  }
}
