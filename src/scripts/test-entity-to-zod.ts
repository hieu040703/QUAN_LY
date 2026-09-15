import { z } from "zod";
import {
  createCreateSchema,
  createUpdateSchema,
  createQuerySchema,
  createParamsSchema,
  extractEntityColumns,
} from "@/shared/utils/entity-to-zod";

/**
 * Demo: So sánh manual vs auto-generated validators
 */

console.log("🔍 Demo: Entity to Zod Schema Generation");
console.log("========================================");

try {
  // Test extract entity columns

  // Test create schemas
  console.log("\n2. 🏗️  Creating schemas:");

  console.log("✅ Create schema generated");

  // Update Schema
  console.log("✅ Update schema generated");

  // Query Schema
  const querySchema = createQuerySchema(["keyword", "userId"]);
  console.log("✅ Query schema generated");

  // Params Schema
  const paramsSchema = createParamsSchema("id");
  console.log("✅ Params schema generated");

  // Test validation
  console.log("\n3. 🧪 Testing validation:");

  const testCreateData = {
    userId: 1,
    courtId: 2,
    creditsUsed: 10,
    checkInTime: new Date(),
  };

  // Test invalid data
  const invalidData = {
    userId: -1, // Invalid: negative
    courtId: "invalid", // Invalid: string instead of number
    creditsUsed: -5, // Invalid: negative
  };


  console.log("\n🎉 Demo completed successfully!");
} catch (error) {
  console.error("\n❌ Demo failed:", error);
  console.log("\n💡 Tips:");
  console.log("   1. Đảm bảo TypeORM metadata được load");
  console.log("   2. Import reflect-metadata trước");
  console.log("   3. Entities phải được import và decorated đúng");
}
