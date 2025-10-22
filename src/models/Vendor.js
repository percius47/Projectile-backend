// Use mock database in test environment, real database otherwise
const db =
  process.env.NODE_ENV === "test"
    ? require("../config/db.test")
    : require("../config/db");

class Vendor {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.company_name = data.company_name;
    this.contact_person = data.contact_person;
    this.phone = data.phone;
    this.email = data.email;
    this.address = data.address;
    this.gst_number = data.gst_number;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(vendorData) {
    const {
      user_id,
      company_name,
      contact_person,
      phone,
      email,
      address,
      gst_number,
    } = vendorData;
    const query = `
      INSERT INTO vendors (user_id, company_name, contact_person, phone, email, address, gst_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`;
    const values = [
      user_id,
      company_name,
      contact_person,
      phone,
      email,
      address,
      gst_number,
    ];
    const result = await db.query(query, values);
    return new Vendor(result.rows[0]);
  }

  static async findById(id) {
    const query = "SELECT * FROM vendors WHERE id = $1";
    const result = await db.query(query, [id]);
    return result.rows.length ? new Vendor(result.rows[0]) : null;
  }

  static async findByUserId(user_id) {
    const query = "SELECT * FROM vendors WHERE user_id = $1";
    const result = await db.query(query, [user_id]);
    return result.rows.length ? new Vendor(result.rows[0]) : null;
  }

  static async findAll() {
    const query = "SELECT * FROM vendors ORDER BY created_at DESC";
    const result = await db.query(query);
    return result.rows.map((row) => new Vendor(row));
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
      UPDATE vendors 
      SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${index}
      RETURNING *`;

    const result = await db.query(query, values);
    return result.rows.length ? new Vendor(result.rows[0]) : null;
  }

  static async delete(id) {
    const query = "DELETE FROM vendors WHERE id = $1 RETURNING *";
    const result = await db.query(query, [id]);
    return result.rows.length ? new Vendor(result.rows[0]) : null;
  }
}

module.exports = Vendor;
