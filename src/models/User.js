// Use mock database in test environment, real database otherwise
const db =
  process.env.NODE_ENV === "test"
    ? require("../config/db.test")
    : require("../config/db");
const bcrypt = require("bcryptjs");

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.role = data.role;
    this.company_name = data.company_name;
    this.contact_person = data.contact_person;
    this.phone = data.phone;
    this.address = data.address;
    this.gst_number = data.gst_number;
    this.reset_token = data.reset_token;
    this.reset_token_expiry = data.reset_token_expiry;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(userData) {
    const {
      name,
      email,
      password_hash,
      role,
      company_name,
      contact_person,
      phone,
      address,
      gst_number,
    } = userData;
    const query = `
      INSERT INTO users (name, email, password_hash, role, company_name, contact_person, phone, address, gst_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`;
    const values = [
      name,
      email,
      password_hash,
      role,
      company_name,
      contact_person,
      phone,
      address,
      gst_number,
    ];
    const result = await db.query(query, values);
    return new User(result.rows[0]);
  }

  static async findByEmail(email) {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await db.query(query, [email]);
    return result.rows.length ? new User(result.rows[0]) : null;
  }

  static async findById(id) {
    const query = "SELECT * FROM users WHERE id = $1";
    const result = await db.query(query, [id]);
    return result.rows.length ? new User(result.rows[0]) : null;
  }

  static async findByResetToken(token) {
    const query =
      "SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW()";
    const result = await db.query(query, [token]);
    return result.rows.length ? new User(result.rows[0]) : null;
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
      UPDATE users 
      SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${index}
      RETURNING *`;

    const result = await db.query(query, values);
    return result.rows.length ? new User(result.rows[0]) : null;
  }

  static async updatePassword(id, newPassword) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    const query = `
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *`;

    const result = await db.query(query, [hashedPassword, id]);
    return result.rows.length ? new User(result.rows[0]) : null;
  }
}

module.exports = User;
