/**
 * Chạy migration SQL: src/database/migrations/1719000000000-SyncProductInventorySchema.sql
 *
 * Cách dùng:
 *   npx ts-node scripts/run-product-inventory-migration.ts
 *   hoặc: npx tsx scripts/run-product-inventory-migration.ts
 *
 * Yêu cầu: biến môi trường DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
 * (project đã load sẵn qua src/config/env).
 */
import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const migrationPath = path.resolve(
        __dirname,
        "../src/database/migrations/1719000000000-SyncProductInventorySchema.sql",
    );

    if (!fs.existsSync(migrationPath)) {
        console.error(`❌ Không tìm thấy file migration: ${migrationPath}`);
        process.exit(1);
    }

    // Load .env manually (tránh parse lỗi do ký tự đặc biệt như "bdmf" trong SECRET_KEY)
    const envPath = path.resolve(__dirname, "../.env");
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, "utf8");
        envContent.split("\n").forEach((line) => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) return;
            const m = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
            if (!m) return;
            const key = m[1];
            let val = m[2];
            // bỏ quote nếu có
            if (
                (val.startsWith('"') && val.endsWith('"')) ||
                (val.startsWith("'") && val.endsWith("'"))
            ) {
                val = val.slice(1, -1);
            }
            if (!process.env[key]) process.env[key] = val;
        });
    }

    const client = new Client({
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432", 10),
        user: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_DATABASE || "postgres",
    });

    const sql = fs.readFileSync(migrationPath, "utf8");

    console.log("🔌 Connecting...");
    console.log(`   host=${process.env.DB_HOST}:${process.env.DB_PORT}`);
    console.log(`   db=${process.env.DB_DATABASE} user=${process.env.DB_USERNAME}`);

    await client.connect();
    console.log("✅ Connected");

    try {
        console.log("🚀 Executing migration...");
        await client.query(sql);
        console.log("✅ Migration applied successfully");
    } catch (e: any) {
        console.error("❌ Migration failed:", e.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
