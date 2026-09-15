import webpush from "web-push";
import { config } from "./env";

webpush.setVapidDetails(
  "mailto:vuq147@email.com",
  config.VAPID_PUBLIC_KEY!,
  config.VAPID_PRIVATE_KEY!
);

export { webpush };