// Set environment variables before requiring any modules
process.env.JWT_SECRET = "test_secret_key";
process.env.JWT_EXPIRES_IN = "24h";

const request = require("supertest");
const app = require("./test-app");
const mockDb = require("../src/config/db.test");

// Reset the mock database before each test
beforeEach(() => {
  mockDb.reset();
});

// Clean up after all tests
afterAll(() => {
  mockDb.reset();
});

describe("Vendor API", () => {
  let adminToken;
  let vendorToken;
  let vendorUser;
  let adminUser;

  beforeEach(async () => {
    // Create an admin user
    adminUser = {
      name: "Admin User",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
      company_name: "Test Company",
      phone: "1234567890",
    };

    // Create a vendor user
    vendorUser = {
      name: "Vendor User",
      email: "vendor@test.com",
      password: "password123",
      role: "vendor",
      company_name: "Vendor Company",
      phone: "1234567890",
    };

    // Register users and get tokens
    const adminResponse = await request(app)
      .post("/api/auth/register")
      .send(adminUser);

    const vendorResponse = await request(app)
      .post("/api/auth/register")
      .send(vendorUser);

    adminToken = adminResponse.body.token;
    vendorToken = vendorResponse.body.token;
  });

  describe("POST /api/vendors", () => {
    it("should create a new vendor successfully as admin", async () => {
      const vendorData = {
        user_id: 2, // Vendor user ID
        company_name: "Test Vendor Company",
        contact_person: "John Doe",
        phone: "1234567890",
        email: "john@vendor.com",
        address: "123 Vendor Street",
        gst_number: "GST1234567890",
      };

      const response = await request(app)
        .post("/api/vendors")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(vendorData)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("vendor");
      expect(response.body.vendor.company_name).toBe(vendorData.company_name);
      expect(response.body.vendor.user_id).toBe(vendorData.user_id);
    });

    it("should fail to create a vendor without required fields", async () => {
      const vendorData = {
        // Missing user_id and company_name
        contact_person: "John Doe",
        phone: "1234567890",
      };

      const response = await request(app)
        .post("/api/vendors")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(vendorData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should fail to create a vendor with non-vendor user", async () => {
      const vendorData = {
        user_id: 1, // Admin user ID
        company_name: "Test Vendor Company",
        contact_person: "John Doe",
        phone: "1234567890",
        email: "john@vendor.com",
        address: "123 Vendor Street",
        gst_number: "GST1234567890",
      };

      const response = await request(app)
        .post("/api/vendors")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(vendorData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("User must have vendor role");
    });
  });

  describe("GET /api/vendors", () => {
    it("should get all vendors as admin", async () => {
      // First create a vendor
      const vendorData = {
        user_id: 2,
        company_name: "Test Vendor Company",
        contact_person: "John Doe",
        phone: "1234567890",
        email: "john@vendor.com",
        address: "123 Vendor Street",
        gst_number: "GST1234567890",
      };

      await request(app)
        .post("/api/vendors")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(vendorData);

      const response = await request(app)
        .get("/api/vendors")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("vendors");
      expect(Array.isArray(response.body.vendors)).toBe(true);
      expect(response.body.vendors.length).toBe(1);
    });

    it("should fail to get all vendors as non-admin", async () => {
      const response = await request(app)
        .get("/api/vendors")
        .set("Authorization", `Bearer ${vendorToken}`)
        .expect(403);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/vendors/:id", () => {
    it("should get a vendor by ID", async () => {
      // First create a vendor
      const vendorData = {
        user_id: 2,
        company_name: "Test Vendor Company",
        contact_person: "John Doe",
        phone: "1234567890",
        email: "john@vendor.com",
        address: "123 Vendor Street",
        gst_number: "GST1234567890",
      };

      const createResponse = await request(app)
        .post("/api/vendors")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(vendorData);

      const vendorId = createResponse.body.vendor.id;

      const response = await request(app)
        .get(`/api/vendors/${vendorId}`)
        .set("Authorization", `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("vendor");
      expect(response.body.vendor.id).toBe(vendorId);
      expect(response.body.vendor.company_name).toBe(vendorData.company_name);
    });

    it("should return 404 for non-existent vendor", async () => {
      const response = await request(app)
        .get("/api/vendors/999")
        .set("Authorization", `Bearer ${vendorToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("PUT /api/vendors/:id", () => {
    it("should update a vendor successfully as admin", async () => {
      // First create a vendor
      const vendorData = {
        user_id: 2,
        company_name: "Test Vendor Company",
        contact_person: "John Doe",
        phone: "1234567890",
        email: "john@vendor.com",
        address: "123 Vendor Street",
        gst_number: "GST1234567890",
      };

      const createResponse = await request(app)
        .post("/api/vendors")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(vendorData);

      const vendorId = createResponse.body.vendor.id;

      const updateData = {
        company_name: "Updated Vendor Company",
        contact_person: "Jane Doe",
      };

      const response = await request(app)
        .put(`/api/vendors/${vendorId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("vendor");
      expect(response.body.vendor.company_name).toBe(updateData.company_name);
      expect(response.body.vendor.contact_person).toBe(
        updateData.contact_person
      );
    });

    it("should fail to update a vendor as non-admin", async () => {
      const response = await request(app)
        .put("/api/vendors/1")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send({ company_name: "Updated Company" })
        .expect(403);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("DELETE /api/vendors/:id", () => {
    it("should delete a vendor successfully as admin", async () => {
      // First create a vendor
      const vendorData = {
        user_id: 2,
        company_name: "Test Vendor Company",
        contact_person: "John Doe",
        phone: "1234567890",
        email: "john@vendor.com",
        address: "123 Vendor Street",
        gst_number: "GST1234567890",
      };

      const createResponse = await request(app)
        .post("/api/vendors")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(vendorData);

      const vendorId = createResponse.body.vendor.id;

      const response = await request(app)
        .delete(`/api/vendors/${vendorId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("message");
    });

    it("should fail to delete a vendor as non-admin", async () => {
      const response = await request(app)
        .delete("/api/vendors/1")
        .set("Authorization", `Bearer ${vendorToken}`)
        .expect(403);

      expect(response.body).toHaveProperty("message");
    });
  });
});
