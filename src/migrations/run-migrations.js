const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../..", ".env") });
const db = require("../config/db");

async function runMigrations() {
  try {
    console.log("Running migrations...");

    // Read all migration files
    const migrationsDir = path.join(__dirname);
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    console.log(`Found ${migrationFiles.length} migration files`);

    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      const migrationPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationPath, "utf8");

      // Split the migration file into individual statements
      const statements = sql.split(";").filter((stmt) => stmt.trim() !== "");

      for (const statement of statements) {
        if (statement.trim() !== "") {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          await db.query(statement);
        }
      }

      console.log(`Completed migration: ${file}`);
    }

    console.log("All migrations completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runMigrations();
