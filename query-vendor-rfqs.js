const { Pool } = require("pg");
require("dotenv").config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "projectile",
  password: process.env.DB_PASSWORD || "postgres",
  port: process.env.DB_PORT || 5432,
});

async function queryVendorRfqs() {
  let client;
  try {
    client = await pool.connect();

    // First, find the user with email v@v.com
    const userQuery = `
      SELECT id, name, email, role 
      FROM users 
      WHERE email = $1 AND role = 'vendor'
    `;
    const userResult = await client.query(userQuery, ["v@v.com"]);

    if (userResult.rows.length === 0) {
      console.log("No vendor user found with email v@v.com");
      return;
    }

    const vendorUser = userResult.rows[0];
    console.log("Vendor User:", vendorUser);

    // Find RFQs that are closed or awarded and for which this vendor has submitted quotes
    const rfqsQuery = `
      SELECT 
        r.id,
        r.title,
        r.status,
        r.deadline,
        q.id as quote_id,
        q.status as quote_status,
        q.total_amount
      FROM rfqs r
      JOIN quotes q ON r.id = q.rfq_id
      WHERE r.status IN ('closed', 'awarded')
      AND q.vendor_id = $1
      ORDER BY r.created_at DESC
    `;

    const rfqsResult = await client.query(rfqsQuery, [vendorUser.id]);

    console.log("\nClosed/Awarded RFQs for vendor v@v.com:");
    if (rfqsResult.rows.length === 0) {
      console.log("No closed or awarded RFQs found for this vendor.");
    } else {
      console.log("Found", rfqsResult.rows.length, "RFQ(s):");
      rfqsResult.rows.forEach((rfq, index) => {
        console.log(`${index + 1}. RFQ ID: ${rfq.id}`);
        console.log(`   Title: ${rfq.title}`);
        console.log(`   RFQ Status: ${rfq.status}`);
        console.log(`   Deadline: ${rfq.deadline}`);
        console.log(`   Quote ID: ${rfq.quote_id}`);
        console.log(`   Quote Status: ${rfq.quote_status}`);
        console.log(`   Quote Amount: ${rfq.total_amount}`);
        console.log("");
      });
    }

    // Also check all closed/awarded RFQs regardless of whether the vendor has quoted
    const allClosedRfqsQuery = `
      SELECT 
        id,
        title,
        status,
        deadline,
        created_at
      FROM rfqs 
      WHERE status IN ('closed', 'awarded')
      ORDER BY created_at DESC
    `;

    const allClosedRfqsResult = await client.query(allClosedRfqsQuery);

    console.log("\nAll Closed/Awarded RFQs in the system:");
    if (allClosedRfqsResult.rows.length === 0) {
      console.log("No closed or awarded RFQs found in the system.");
    } else {
      console.log("Found", allClosedRfqsResult.rows.length, "RFQ(s):");
      allClosedRfqsResult.rows.forEach((rfq, index) => {
        console.log(`${index + 1}. RFQ ID: ${rfq.id}`);
        console.log(`   Title: ${rfq.title}`);
        console.log(`   Status: ${rfq.status}`);
        console.log(`   Deadline: ${rfq.deadline}`);
        console.log(`   Created: ${rfq.created_at}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("Error querying database:", error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

queryVendorRfqs();
