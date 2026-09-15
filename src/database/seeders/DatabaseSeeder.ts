import { DatabaseConfig } from "@/config/database";
import { AuthUtils } from "@/shared/utils/auth.utils";
import { User } from "../models/User";
import { Role } from "../models/Role";
import { roleSeeder } from "./role";
import { adminSeeders } from "./user";
import { DeepPartial } from "typeorm";

async function getUserSeeders(): Promise<DeepPartial<User>[]> {
  const hashedPassword = await AuthUtils.hashPassword("123456");
  return adminSeeders.map((adminSeeder) => ({
    ...adminSeeder,
    password: hashedPassword,
  }));
}

export class DatabaseSeeder {
  static async run(): Promise<void> {
    console.log("Starting core database seeding...");

    try {
      await DatabaseConfig.initialize();

      const roleRepository = DatabaseConfig.getRepository(Role);
      const userRepository = DatabaseConfig.getRepository(User);

      const roles = await roleRepository.save(roleSeeder);
      const adminRole = roles.find((role) => role.name === "Quản trị viên");
      const users = await userRepository.save(
        (await getUserSeeders()).map((user) => ({
          ...user,
          roleId: adminRole?.id ?? null,
        })),
      );

      console.log(`Created ${roles.length} roles and ${users.length} users.`);
    } catch (error) {
      console.error("Core database seeding failed:", error);
      throw error;
    } finally {
      await DatabaseConfig.destroy();
    }
  }
}
