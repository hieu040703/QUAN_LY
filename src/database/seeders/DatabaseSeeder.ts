import { DatabaseConfig } from "@/config/database";
import { AuthUtils } from "@/shared/utils/auth.utils";
import { User } from "../models/User";
import { Attribute } from "../models/Attribute";
import { Role } from "../models/Role";
import { roleSeeder } from "./role";
import { adminSeeders } from "./user";
import { DeepPartial } from "typeorm";
import { Packet } from "../models/Packet";

async function getUserSeeders() {
  const hashedPassword = await AuthUtils.hashPassword("123456");
  const result: DeepPartial<User>[] = [];

  for (const adminSeeder of adminSeeders) {
    result.push({
      ...adminSeeder,
      password: hashedPassword,
    });
  }

  return result;
}

export class DatabaseSeeder {
  static async run(): Promise<void> {
    console.log("🌱 Starting database seeding...");

    try {
      // Initialize database connection
      await DatabaseConfig.initialize();

      const adminRepository = DatabaseConfig.getRepository(User);
      const packetRepository = DatabaseConfig.getRepository(Packet);

      const existingAdmins = await adminRepository.find();
      if (existingAdmins.length > 0) {
        await adminRepository.remove(existingAdmins);
      }
      console.log("✅ Cleared existing data");

      // TODO: Create users
      const userSeeders = await getUserSeeders();
      const users = await adminRepository.save(userSeeders);
      console.log("✅ Created users: ", users);

      // TODO: Create packets
      const packetSeeders: Partial<Packet>[] = [
        {
          code: "PKT-TRAI-NGHIEM",
          name: "GÓI TRẢI NGHIỆM",
          note: "1 suất dùng thử dành cho khách lần đầu tới câu lạc bộ.",
          amount: 0,
          isActive: true,
          dayLimit: 3,
          quota: 1,
          isDefault: true,
        },
      ];
      const packets = await packetRepository.save(packetSeeders);
      console.log("✅ Created packets: ", packets);

      // TODO: Create attributes
      const attributeRepository = DatabaseConfig.getRepository(Attribute);
      const existingAttributesData = await attributeRepository.find();

      if (existingAttributesData.length > 0) {
        await attributeRepository.remove(existingAttributesData);
      }
      console.log("✅ Cleared existing attributes");

      // TODO: Create roles
      const roleRepository = DatabaseConfig.getRepository(Role);
      const existingRoles = await roleRepository.find();

      if (existingRoles.length > 0) {
        await roleRepository.remove(existingRoles);
      }

      const roles = await roleRepository.save(roleSeeder);
      console.log("✅ Created roles: ", roles);

      console.log("🌱 Database seeding completed successfully.");
    } catch (error) {
      console.error("❌ Database seeding failed:", error);
      throw error;
    } finally {
      // Close database connection
      await DatabaseConfig.destroy();
    }
  }
}
