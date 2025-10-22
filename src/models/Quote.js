// Use mock database in test environment, real database otherwise
const db =
  process.env.NODE_ENV === "test"
    ? require("../config/db.test")
    : require("../config/db");

class Quote {
  constructor(data) {
    this.id = data.id;
    this.custom_id = data.custom_id;
    this.rfq_custom_id = data.rfq_custom_id;
    this.vendor_custom_id = data.vendor_custom_id;
    this.rfq_id = data.rfq_id;
    this.vendor_id = data.vendor_id;
    this.status = data.status;
    // Ensure total_amount is a number, converting from string if necessary
    this.total_amount =
      typeof data.total_amount === "string"
        ? parseFloat(data.total_amount)
        : data.total_amount;
    // Map database fields to expected field names
    this.created_at = data.created_at || data.submission_date;
    this.updated_at = data.updated_at || data.last_updated;
  }

  static async create(quoteData) {
    const { rfq_id, vendor_id, status, total_amount } = quoteData;

    // Generate custom ID
    const IdGenerator = require("../utils/idGenerator");
    const custom_id = IdGenerator.generateQuoteId();

    // Get RFQ and vendor info for reference IDs
    const Rfq = require("./Rfq");
    const User = require("./User");

    const rfq = await Rfq.findById(rfq_id);
    const vendor = await User.findById(vendor_id);

    const rfq_custom_id = rfq ? rfq.custom_id : null;
    const vendor_custom_id = vendor ? vendor.id : null; // Using user ID as vendor ID

    const query = `
      INSERT INTO quotes (rfq_id, vendor_id, status, total_amount, custom_id, rfq_custom_id, vendor_custom_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`;
    const values = [
      rfq_id,
      vendor_id,
      status || "submitted",
      total_amount,
      custom_id,
      rfq_custom_id,
      vendor_custom_id,
    ];
    const result = await db.query(query, values);
    return new Quote(result.rows[0]);
  }

  static async findById(id) {
    const query = "SELECT * FROM quotes WHERE id = $1";
    const result = await db.query(query, [id]);
    return result.rows.length ? new Quote(result.rows[0]) : null;
  }

  static async findByRfqId(rfq_id) {
    const query =
      "SELECT * FROM quotes WHERE rfq_id = $1 ORDER BY submission_date DESC";
    const result = await db.query(query, [rfq_id]);
    return result.rows.map((row) => new Quote(row));
  }

  static async findByVendorId(vendor_id) {
    const query =
      "SELECT * FROM quotes WHERE vendor_id = $1 ORDER BY submission_date DESC";
    const result = await db.query(query, [vendor_id]);
    return result.rows.map((row) => new Quote(row));
  }

  static async findAll() {
    const query = "SELECT * FROM quotes ORDER BY submission_date DESC";
    const result = await db.query(query);
    return result.rows.map((row) => new Quote(row));
  }

  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let index = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (key !== "id" && value !== undefined) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
      }
    }

    if (fields.length === 0) {
      throw new Error("No fields to update");
    }

    values.push(id);
    const query = `
      UPDATE quotes 
      SET ${fields.join(", ")}, last_updated = CURRENT_TIMESTAMP
      WHERE id = $${index}
      RETURNING *`;

    const result = await db.query(query, values);
    return result.rows.length ? new Quote(result.rows[0]) : null;
  }

  static async delete(id) {
    const query = "DELETE FROM quotes WHERE id = $1 RETURNING *";
    const result = await db.query(query, [id]);
    return result.rows.length ? new Quote(result.rows[0]) : null;
  }
}

module.exports = Quote;
