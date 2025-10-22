// Mock User model for testing
const mockDb = require("../../../../src/config/db.test");

class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.password_hash = data.password_hash;
    this.role = data.role;
    this.company_name = data.company_name;
    this.phone = data.phone;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(userData) {
    const { name, email, password_hash, role, company_name, phone } = userData;
    const query = `
      INSERT INTO users (name, email, password_hash, role, company_name, phone)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`;
    const values = [name, email, password_hash, role, company_name, phone];
    const result = await mockDb.query(query, values);
    return new User(result.rows[0]);
  }

  static async findByEmail(email) {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await mockDb.query(query, [email]);
    return result.rows.length ? new User(result.rows[0]) : null;
  }

  static async findById(id) {
    const query = "SELECT * FROM users WHERE id = $1";
    const result = await mockDb.query(query, [id]);
    return result.rows.length ? new User(result.rows[0]) : null;
  }
}

module.exports = User;