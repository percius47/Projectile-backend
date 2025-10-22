// Utility function to generate unique IDs with prefixes
const crypto = require("crypto");

class IdGenerator {
  // Generate a random 3-character uppercase string
  static generatePrefix() {
    return crypto.randomBytes(2).toString("hex").toUpperCase().substring(0, 3);
  }

  // Generate unique ID with prefix
  static generateId(prefix) {
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit number
    return `${prefix}_${this.generatePrefix()}_${randomPart}`;
  }

  // Generate IDs for different entities
  static generateProjectId() {
    return this.generateId("PROJ");
  }

  static generateRequirementId() {
    return this.generateId("REQ");
  }

  static generateRfqId() {
    return this.generateId("RFQ");
  }

  static generateQuoteId() {
    return this.generateId("QUOT");
  }
}

module.exports = IdGenerator;
