import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5433),
  database: process.env.POSTGRES_DB || "medicore",
  user: process.env.POSTGRES_USER || "medicore_user",
  password: process.env.POSTGRES_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("connect", () => {
  console.log("✅ PostgreSQL client connected");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected PostgreSQL pool error:", err);
});

export const testDatabaseConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("✅ Database connected successfully");
    console.log("🕒 Database time:", result.rows[0].now);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
};