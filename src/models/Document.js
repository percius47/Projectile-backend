// Use mock database in test environment, real database otherwise
const db =
  process.env.NODE_ENV === "test"
    ? require("../config/db.test")
    : require("../config/db");

class Document {
  constructor(data) {
    this.id = data.id;
    this.entity_type = data.entity_type; // project, rfq, requirement, quote
    this.entity_id = data.entity_id;
    this.filename = data.filename;
    this.original_name = data.original_name;
    this.file_path = data.file_path;
    this.file_size = data.file_size;
    this.mime_type = data.mime_type;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async create(documentData) {
    const {
      entity_type,
      entity_id,
      filename,
      original_name,
      file_path,
      file_size,
      mime_type,
    } = documentData;
    const query = `
      INSERT INTO documents (entity_type, entity_id, filename, original_name, file_path, file_size, mime_type)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`;
    const values = [
      entity_type,
      entity_id,
      filename,
      original_name,
      file_path,
      file_size,
      mime_type,
    ];
    const result = await db.query(query, values);
    return new Document(result.rows[0]);
  }

  static async findByEntity(entity_type, entity_id) {
    const query = `
      SELECT * FROM documents 
      WHERE entity_type = $1 AND entity_id = $2 
      ORDER BY created_at DESC`;
    const result = await db.query(query, [entity_type, entity_id]);
    return result.rows.map((row) => new Document(row));
  }

  static async findById(id) {
    const query = "SELECT * FROM documents WHERE id = $1";
    const result = await db.query(query, [id]);
    return result.rows.length ? new Document(result.rows[0]) : null;
  }

  static async delete(id) {
    const query = "DELETE FROM documents WHERE id = $1 RETURNING *";
    const result = await db.query(query, [id]);
    return result.rows.length ? new Document(result.rows[0]) : null;
  }
}

module.exports = Document;
