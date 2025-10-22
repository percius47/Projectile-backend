const db = require("../config/db");

async function resetDatabase() {
  try {
    console.log("Resetting database...");

    // Truncate tables in correct order to avoid foreign key constraint issues
    // Start with tables that have foreign key references
    await db.query("TRUNCATE TABLE quotes RESTART IDENTITY CASCADE");
    console.log("Quotes table cleared");

    await db.query("TRUNCATE TABLE rfqs RESTART IDENTITY CASCADE");
    console.log("RFQs table cleared");

    await db.query("TRUNCATE TABLE requirements RESTART IDENTITY CASCADE");
    console.log("Requirements table cleared");

    await db.query("TRUNCATE TABLE projects RESTART IDENTITY CASCADE");
    console.log("Projects table cleared");

    await db.query("TRUNCATE TABLE vendors RESTART IDENTITY CASCADE");
    console.log("Vendors table cleared");

    await db.query("TRUNCATE TABLE users RESTART IDENTITY CASCADE");
    console.log("Users table cleared");

    console.log("Database reset completed successfully!");
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

resetDatabase();
