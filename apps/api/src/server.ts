
import dotenv from "dotenv";
import app from "./app";
import { testDatabaseConnection } from "./config/database";

dotenv.config();

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  console.log("🚀 Starting MediCore API...");

  const databaseConnected = await testDatabaseConnection();

  if (!databaseConnected) {
    console.error("❌ Server startup aborted: Database unavailable.");
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`✅ MediCore API running at http://localhost:${PORT}`);
    console.log(`📍 Health endpoint: http://localhost:${PORT}/api/health`);
  });
}

startServer();
