import { Attribute } from "./Attribute";
import { Notification } from "./Notification";
import { Token } from "./Token";
import { User } from "./User";
import { UserNotification } from "./UserNotification";
import { VerifyOtp } from "./VerifyOtp";
import { FileEntity } from "./File";
import { OperationLog } from "./OperationLog";
import { Role } from "./Role";
import { Device } from "./Device";
import { Club } from "./Club";
import { HealthIndicator } from "./HealthIndicator";
import { Booking } from "./Booking";
import { ClubActivity } from "./ClubActivity";
import { ClubMember } from "./ClubMember";
import { Packet } from "./Packet";
import { UserPacket } from "./UserPacket";
import { UserTarget } from "./UserTarget";
import { ClubRole } from "./ClubRole";
import { Transaction } from "./Transaction";
import { CheckIn } from "./CheckIn";
import { Chat } from "./Chat";
import { SeenMessage } from "./SeenMessage";
export const entities = [
  // Systems
  User,
  Notification,
  UserNotification,
  Attribute,
  FileEntity,
  Token,
  VerifyOtp,
  OperationLog,
  Role,
  Device,
  Club,
  HealthIndicator,
  Booking,
  ClubActivity,
  ClubMember,
  Packet,
  UserPacket,
  UserTarget,
  ClubRole,
  Transaction,
  CheckIn,
  Chat,
  SeenMessage,
];
