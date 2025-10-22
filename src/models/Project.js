// Use mock database in test environment, real database otherwise
const db =
  process.env.NODE_ENV === "test"
    ? require("../config/db.test")
    : require("../config/db");

class Project {
  constructor(data) {
    this.id = data.id;
    this.custom_id = data.custom_id;
    this.name = data.name;
    this.description = data.description;
    this.location = data.location;
    this.deadline = data.deadline;
    this.owner_id = data.owner_id;
    this.status = data.status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(projectData) {
    const { name, description, location, deadline, owner_id, status } =
      projectData;

    // Generate custom ID
    const IdGenerator = require("../utils/idGenerator");
    const custom_id = IdGenerator.generateProjectId();

    const query = `
      INSERT INTO projects (name, description, location, deadline, owner_id, status, custom_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`;
    const values = [
      name,
      description,
      location,
      deadline,
      owner_id,
      status || "active",
      custom_id,
    ];
    const result = await db.query(query, values);
    return new Project(result.rows[0]);
  }

  static async findById(id) {
    const query = "SELECT * FROM projects WHERE id = $1";
    const result = await db.query(query, [id]);
    return result.rows.length ? new Project(result.rows[0]) : null;
  }

  static async findByOwnerId(owner_id) {
    const query =
      "SELECT * FROM projects WHERE owner_id = $1 ORDER BY created_at DESC";
    const result = await db.query(query, [owner_id]);
    return result.rows.map((row) => new Project(row));
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
      UPDATE projects 
      SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${index}
      RETURNING *`;

    const result = await db.query(query, values);
    return result.rows.length ? new Project(result.rows[0]) : null;
  }

  static async delete(id) {
    const query = "DELETE FROM projects WHERE id = $1 RETURNING *";
    const result = await db.query(query, [id]);
    return result.rows.length ? new Project(result.rows[0]) : null;
  }
}

module.exports = Project;
