// Use mock database in test environment, real database otherwise
const db =
  process.env.NODE_ENV === "test"
    ? require("../config/db.test")
    : require("../config/db");

class Requirement {
  constructor(data) {
    this.id = data.id;
    this.custom_id = data.custom_id;
    this.project_custom_id = data.project_custom_id;
    this.project_id = data.project_id;
    this.item_name = data.item_name;
    this.description = data.description;
    this.quantity = data.quantity;
    this.unit = data.unit;
    this.rate = data.rate;
    this.category = data.category;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(requirementData) {
    const {
      project_id,
      item_name,
      description,
      quantity,
      unit,
      rate,
      category,
    } = requirementData;

    // Generate custom ID
    const IdGenerator = require("../utils/idGenerator");
    const custom_id = IdGenerator.generateRequirementId();

    // Get project custom ID for reference
    const Project = require("./Project");
    const project = await Project.findById(project_id);
    const project_custom_id = project ? project.custom_id : null;

    const query = `
      INSERT INTO requirements (project_id, item_name, description, quantity, unit, rate, category, custom_id, project_custom_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`;
    const values = [
      project_id,
      item_name,
      description,
      quantity,
      unit,
      rate,
      category,
      custom_id,
      project_custom_id,
    ];
    const result = await db.query(query, values);
    return new Requirement(result.rows[0]);
  }

  static async findByProjectId(project_id) {
    const query =
      "SELECT * FROM requirements WHERE project_id = $1 ORDER BY created_at ASC";
    const result = await db.query(query, [project_id]);
    return result.rows.map((row) => new Requirement(row));
  }

  static async findById(id) {
    const query = "SELECT * FROM requirements WHERE id = $1";
    const result = await db.query(query, [id]);
    return result.rows.length ? new Requirement(result.rows[0]) : null;
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
      UPDATE requirements 
      SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${index}
      RETURNING *`;

    const result = await db.query(query, values);
    return result.rows.length ? new Requirement(result.rows[0]) : null;
  }

  static async delete(id) {
    const query = "DELETE FROM requirements WHERE id = $1 RETURNING *";
    const result = await db.query(query, [id]);
    return result.rows.length ? new Requirement(result.rows[0]) : null;
  }
}

module.exports = Requirement;
