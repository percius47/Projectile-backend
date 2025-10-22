// Use mock database in test environment, real database otherwise
const db =
  process.env.NODE_ENV === "test"
    ? require("../config/db.test")
    : require("../config/db");

class Rfq {
  constructor(data) {
    this.id = data.id;
    this.custom_id = data.custom_id;
    this.project_custom_id = data.project_custom_id;
    this.project_id = data.project_id;
    this.title = data.title;
    this.description = data.description;
    this.deadline = data.deadline;
    this.status = data.status;
    this.contact_person = data.contact_person;
    this.contact_email = data.contact_email;
    this.contact_phone = data.contact_phone;
    this.special_requirements = data.special_requirements;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(rfqData) {
    const {
      project_id,
      title,
      description,
      deadline,
      status,
      contact_person,
      contact_email,
      contact_phone,
      special_requirements,
    } = rfqData;

    // Generate custom ID
    const IdGenerator = require("../utils/idGenerator");
    const custom_id = IdGenerator.generateRfqId();

    // Get project custom ID for reference
    const Project = require("./Project");
    const project = await Project.findById(project_id);
    const project_custom_id = project ? project.custom_id : null;

    const query = `
      INSERT INTO rfqs (project_id, title, description, deadline, status, contact_person, contact_email, contact_phone, special_requirements, custom_id, project_custom_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`;
    const values = [
      project_id,
      title,
      description,
      deadline,
      status || "open",
      contact_person || null,
      contact_email || null,
      contact_phone || null,
      special_requirements || null,
      custom_id,
      project_custom_id,
    ];
    const result = await db.query(query, values);
    return new Rfq(result.rows[0]);
  }

  static async findById(id) {
    const query = "SELECT * FROM rfqs WHERE id = $1";
    const result = await db.query(query, [id]);
    return result.rows.length ? new Rfq(result.rows[0]) : null;
  }

  static async findByProjectId(project_id) {
    const query =
      "SELECT * FROM rfqs WHERE project_id = $1 ORDER BY created_at DESC";
    const result = await db.query(query, [project_id]);
    return result.rows.map((row) => new Rfq(row));
  }

  static async findAll() {
    const query = "SELECT * FROM rfqs ORDER BY created_at DESC";
    const result = await db.query(query);
    return result.rows.map((row) => new Rfq(row));
  }

  static async findOpenRfqs() {
    const query =
      "SELECT * FROM rfqs WHERE status = 'open' ORDER BY created_at DESC";
    const result = await db.query(query);
    return result.rows.map((row) => new Rfq(row));
  }

  static async findClosedRfqs() {
    const query =
      "SELECT * FROM rfqs WHERE status IN ('awarded', 'closed') ORDER BY created_at DESC";
    const result = await db.query(query);
    return result.rows.map((row) => new Rfq(row));
  }

  static async findClosedRfqsByProjectId(project_id) {
    const query =
      "SELECT * FROM rfqs WHERE project_id = $1 AND status IN ('awarded', 'closed') ORDER BY created_at DESC";
    const result = await db.query(query, [project_id]);
    return result.rows.map((row) => new Rfq(row));
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
      UPDATE rfqs 
      SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${index}
      RETURNING *`;

    const result = await db.query(query, values);
    return result.rows.length ? new Rfq(result.rows[0]) : null;
  }

  static async delete(id) {
    const query = "DELETE FROM rfqs WHERE id = $1 RETURNING *";
    const result = await db.query(query, [id]);
    return result.rows.length ? new Rfq(result.rows[0]) : null;
  }
}

module.exports = Rfq;
