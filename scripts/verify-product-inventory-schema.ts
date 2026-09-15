/**
 * Verify schema đã đồng bộ với model chưa.
 * In ra:
 *   - danh sách bảng cần có
 *   - danh sách cột mới trên products
 */
import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

async function main() {
    const envPath = path.resolve(__dirname, "../.env");
    if (fs.existsSync(envPath)) {
        fs.readFileSync(envPath, "utf8")
            .split("\n")
            .forEach((line) => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith("#")) return;
                const m = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
                if (!m) return;
                let val = m[2];
                if (
                    (val.startsWith('"') && val.endsWith('"')) ||
                    (val.startsWith("'") && val.endsWith("'"))
                )
                    val = val.slice(1, -1);
                if (!process.env[m[1]]) process.env[m[1]] = val;
            });
    }

    const client = new Client({
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432", 10),
        user: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "",
        database: process.env.DB_DATABASE || "postgres",
    });

    await client.connect();

    const tables = [
        "products",
        "product_extra_units",
        "product_stock_settings",
        "inventory_lots",
    ];
    console.log("\n📋 Tables:");
    for (const t of tables) {
        const r = await client.query(
            `SELECT to_regclass($1) AS exists`,
            [`public.${t}`],
        );
        console.log(`  ${r.rows[0].exists ? "✅" : "❌"} ${t}`);
    }

    const productCols = [
        "categoryAttributeId",
        "baseUnitId",
        "inventoryMode",
        "stockMetadata",
        "defaultCostPerBaseUnit",
    ];
    console.log("\n📋 New columns on products:");
    for (const c of productCols) {
        const r = await client.query(
            `SELECT 1 FROM information_schema.columns
             WHERE table_name='products' AND column_name=$1`,
            [c],
        );
        console.log(`  ${r.rows.length ? "✅" : "❌"} ${c}`);
    }

    await client.end();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
