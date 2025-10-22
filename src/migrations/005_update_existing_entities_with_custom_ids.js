// Migration script to update existing entities with custom IDs
require("dotenv").config();
const db = require("../config/db");
const IdGenerator = require("../utils/idGenerator");

async function updateExistingEntities() {
  try {
    console.log("Updating existing entities with custom IDs...");

    // Update projects
    console.log("Updating projects...");
    const projects = await db.query(
      "SELECT id FROM projects WHERE custom_id IS NULL"
    );
    for (const project of projects.rows) {
      const customId = IdGenerator.generateProjectId();
      await db.query("UPDATE projects SET custom_id = $1 WHERE id = $2", [
        customId,
        project.id,
      ]);
      console.log(
        `  Updated project ${project.id} with custom ID: ${customId}`
      );
    }

    // Update requirements
    console.log("Updating requirements...");
    const requirements = await db.query(
      "SELECT id, project_id FROM requirements WHERE custom_id IS NULL"
    );
    for (const requirement of requirements.rows) {
      const customId = IdGenerator.generateRequirementId();
      // Get project custom ID for reference
      const projectResult = await db.query(
        "SELECT custom_id FROM projects WHERE id = $1",
        [requirement.project_id]
      );
      const projectCustomId =
        projectResult.rows.length > 0 ? projectResult.rows[0].custom_id : null;
      await db.query(
        "UPDATE requirements SET custom_id = $1, project_custom_id = $2 WHERE id = $3",
        [customId, projectCustomId, requirement.id]
      );
      console.log(
        `  Updated requirement ${requirement.id} with custom ID: ${customId}`
      );
    }

    // Update RFQs
    console.log("Updating RFQs...");
    const rfqs = await db.query(
      "SELECT id, project_id FROM rfqs WHERE custom_id IS NULL"
    );
    for (const rfq of rfqs.rows) {
      const customId = IdGenerator.generateRfqId();
      // Get project custom ID for reference
      const projectResult = await db.query(
        "SELECT custom_id FROM projects WHERE id = $1",
        [rfq.project_id]
      );
      const projectCustomId =
        projectResult.rows.length > 0 ? projectResult.rows[0].custom_id : null;
      await db.query(
        "UPDATE rfqs SET custom_id = $1, project_custom_id = $2 WHERE id = $3",
        [customId, projectCustomId, rfq.id]
      );
      console.log(`  Updated RFQ ${rfq.id} with custom ID: ${customId}`);
    }

    // Update quotes
    console.log("Updating quotes...");
    const quotes = await db.query(
      "SELECT id, rfq_id, vendor_id FROM quotes WHERE custom_id IS NULL"
    );
    for (const quote of quotes.rows) {
      const customId = IdGenerator.generateQuoteId();
      // Get RFQ custom ID for reference
      const rfqResult = await db.query(
        "SELECT custom_id FROM rfqs WHERE id = $1",
        [quote.rfq_id]
      );
      const rfqCustomId =
        rfqResult.rows.length > 0 ? rfqResult.rows[0].custom_id : null;
      // Vendor ID is just the user ID
      const vendorCustomId = quote.vendor_id;
      await db.query(
        "UPDATE quotes SET custom_id = $1, rfq_custom_id = $2, vendor_custom_id = $3 WHERE id = $4",
        [customId, rfqCustomId, vendorCustomId, quote.id]
      );
      console.log(`  Updated quote ${quote.id} with custom ID: ${customId}`);
    }

    console.log("All entities updated successfully with custom IDs!");
  } catch (error) {
    console.error("Error updating entities:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

updateExistingEntities();
