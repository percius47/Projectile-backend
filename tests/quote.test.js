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

describe("Quote API", () => {
  let adminToken;
  let projectOwnerToken;
  let vendorToken;
  let adminUser;
  let projectOwnerUser;
  let vendorUser;
  let vendor;

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

    // Create a project owner user
    projectOwnerUser = {
      name: "Project Owner",
      email: "project@test.com",
      password: "password123",
      role: "project_owner",
      company_name: "Project Owner Company",
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

    const projectOwnerResponse = await request(app)
      .post("/api/auth/register")
      .send(projectOwnerUser);

    const vendorResponse = await request(app)
      .post("/api/auth/register")
      .send(vendorUser);

    adminToken = adminResponse.body.token;
    projectOwnerToken = projectOwnerResponse.body.token;
    vendorToken = vendorResponse.body.token;

    // Create a vendor profile for the vendor user
    const vendorData = {
      user_id: mockDb.getUsers().find((u) => u.email === vendorUser.email).id,
      company_name: "Test Vendor Company",
      contact_person: "Vendor Contact",
      phone: "1234567890",
      email: "vendor@test.com",
      address: "123 Vendor St",
      gst_number: "GST123456789",
    };

    const vendorResponse2 = await request(app)
      .post("/api/vendors")
      .set("Authorization", `Bearer ${vendorToken}`)
      .send(vendorData);

    vendor = vendorResponse2.body.vendor;
  });

  describe("POST /api/quotes", () => {
    it("should create a new quote successfully as vendor", async () => {
      // First create a project
      const projectData = {
        name: "Test Project",
        description: "Test Project Description",
        location: "Test Location",
        deadline: "2025-12-31",
      };

      const projectResponse = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(projectData)
        .expect(201);

      const projectId = projectResponse.body.project.id;

      // Create an RFQ
      const rfqData = {
        project_id: projectId,
        title: "Test RFQ",
        description: "Test RFQ Description",
        deadline: "2025-12-31T23:59:59Z",
      };

      const rfqResponse = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData)
        .expect(201);

      const rfqId = rfqResponse.body.rfq.id;

      // Create a quote
      const quoteData = {
        rfq_id: rfqId,
        vendor_id: vendor.id,
        total_amount: 1000.0,
      };

      const response = await request(app)
        .post("/api/quotes")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send(quoteData)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("quote");
      expect(response.body.quote.rfq_id).toBe(rfqId);
      expect(response.body.quote.vendor_id).toBe(vendor.id);
      expect(response.body.quote.total_amount).toBe(1000);
    });

    it("should fail to create a quote without required fields", async () => {
      const quoteData = {
        // Missing rfq_id, vendor_id, and total_amount
        status: "submitted",
      };

      const response = await request(app)
        .post("/api/quotes")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send(quoteData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should fail to create a quote for non-existent RFQ", async () => {
      const quoteData = {
        rfq_id: 999, // Non-existent RFQ
        vendor_id: vendor.id,
        total_amount: 1000.0,
      };

      const response = await request(app)
        .post("/api/quotes")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send(quoteData)
        .expect(404);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("RFQ not found");
    });
  });

  describe("GET /api/quotes", () => {
    it("should get all quotes as admin", async () => {
      // First create a project, RFQ, and quote
      const projectData = {
        name: "Test Project",
        description: "Test Project Description",
        location: "Test Location",
        deadline: "2025-12-31",
      };

      const projectResponse = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(projectData)
        .expect(201);

      const projectId = projectResponse.body.project.id;

      const rfqData = {
        project_id: projectId,
        title: "Test RFQ",
        description: "Test RFQ Description",
        deadline: "2025-12-31T23:59:59Z",
      };

      const rfqResponse = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData)
        .expect(201);

      const rfqId = rfqResponse.body.rfq.id;

      const quoteData = {
        rfq_id: rfqId,
        vendor_id: vendor.id,
        total_amount: 1000.0,
      };

      await request(app)
        .post("/api/quotes")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send(quoteData);

      const response = await request(app)
        .get("/api/quotes")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("quotes");
      expect(Array.isArray(response.body.quotes)).toBe(true);
    });

    it("should fail to get all quotes as non-admin", async () => {
      const response = await request(app)
        .get("/api/quotes")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/quotes/rfq/:rfq_id", () => {
    it("should get quotes by RFQ ID as project owner", async () => {
      // First create a project, RFQ, and quote
      const projectData = {
        name: "Test Project",
        description: "Test Project Description",
        location: "Test Location",
        deadline: "2025-12-31",
      };

      const projectResponse = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(projectData)
        .expect(201);

      const projectId = projectResponse.body.project.id;

      const rfqData = {
        project_id: projectId,
        title: "Test RFQ",
        description: "Test RFQ Description",
        deadline: "2025-12-31T23:59:59Z",
      };

      const rfqResponse = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData)
        .expect(201);

      const rfqId = rfqResponse.body.rfq.id;

      const quoteData = {
        rfq_id: rfqId,
        vendor_id: vendor.id,
        total_amount: 1000.0,
      };

      await request(app)
        .post("/api/quotes")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send(quoteData);

      const response = await request(app)
        .get(`/api/quotes/rfq/${rfqId}`)
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("quotes");
      expect(Array.isArray(response.body.quotes)).toBe(true);
      expect(response.body.quotes.length).toBe(1);
    });

    it("should return empty array for RFQ with no quotes", async () => {
      // First create a project and RFQ
      const projectData = {
        name: "Test Project",
        description: "Test Project Description",
        location: "Test Location",
        deadline: "2025-12-31",
      };

      const projectResponse = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(projectData)
        .expect(201);

      const projectId = projectResponse.body.project.id;

      const rfqData = {
        project_id: projectId,
        title: "Test RFQ",
        description: "Test RFQ Description",
        deadline: "2025-12-31T23:59:59Z",
      };

      const rfqResponse = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData)
        .expect(201);

      const rfqId = rfqResponse.body.rfq.id;

      const response = await request(app)
        .get(`/api/quotes/rfq/${rfqId}`)
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("quotes");
      expect(Array.isArray(response.body.quotes)).toBe(true);
      expect(response.body.quotes.length).toBe(0);
    });
  });

  describe("GET /api/quotes/vendor/:vendor_id", () => {
    it("should get quotes by vendor ID as vendor owner", async () => {
      // First create a project, RFQ, and quote
      const projectData = {
        name: "Test Project",
        description: "Test Project Description",
        location: "Test Location",
        deadline: "2025-12-31",
      };

      const projectResponse = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(projectData)
        .expect(201);

      const projectId = projectResponse.body.project.id;

      const rfqData = {
        project_id: projectId,
        title: "Test RFQ",
        description: "Test RFQ Description",
        deadline: "2025-12-31T23:59:59Z",
      };

      const rfqResponse = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData)
        .expect(201);

      const rfqId = rfqResponse.body.rfq.id;

      const quoteData = {
        rfq_id: rfqId,
        vendor_id: vendor.id,
        total_amount: 1000.0,
      };

      await request(app)
        .post("/api/quotes")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send(quoteData);

      const response = await request(app)
        .get(`/api/quotes/vendor/${vendor.id}`)
        .set("Authorization", `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("quotes");
      expect(Array.isArray(response.body.quotes)).toBe(true);
      expect(response.body.quotes.length).toBe(1);
    });

    it("should fail to get quotes by vendor ID as different vendor", async () => {
      // Create another vendor
      const otherVendorUser = {
        name: "Other Vendor",
        email: "other_vendor@test.com",
        password: "password123",
        role: "vendor",
        company_name: "Other Vendor Company",
        phone: "1234567890",
      };

      const otherVendorResponse = await request(app)
        .post("/api/auth/register")
        .send(otherVendorUser);

      const otherVendorToken = otherVendorResponse.body.token;

      const otherVendorData = {
        user_id: mockDb
          .getUsers()
          .find((u) => u.email === otherVendorUser.email).id,
        company_name: "Other Vendor Company",
        contact_person: "Other Vendor Contact",
        phone: "1234567890",
        email: "other_vendor@test.com",
        address: "456 Other Vendor St",
        gst_number: "GST987654321",
      };

      const otherVendorResponse2 = await request(app)
        .post("/api/vendors")
        .set("Authorization", `Bearer ${otherVendorToken}`)
        .send(otherVendorData)
        .expect(201);

      const otherVendor = otherVendorResponse2.body.vendor;

      const response = await request(app)
        .get(`/api/quotes/vendor/${vendor.id}`)
        .set("Authorization", `Bearer ${otherVendorToken}`)
        .expect(403);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/quotes/:id", () => {
    it("should get a quote by ID as vendor owner", async () => {
      // First create a project, RFQ, and quote
      const projectData = {
        name: "Test Project",
        description: "Test Project Description",
        location: "Test Location",
        deadline: "2025-12-31",
      };

      const projectResponse = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(projectData)
        .expect(201);

      const projectId = projectResponse.body.project.id;

      const rfqData = {
        project_id: projectId,
        title: "Test RFQ",
        description: "Test RFQ Description",
        deadline: "2025-12-31T23:59:59Z",
      };

      const rfqResponse = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData)
        .expect(201);

      const rfqId = rfqResponse.body.rfq.id;

      const quoteData = {
        rfq_id: rfqId,
        vendor_id: vendor.id,
        total_amount: 1000.0,
      };

      const createResponse = await request(app)
        .post("/api/quotes")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send(quoteData);

      const quoteId = createResponse.body.quote.id;

      const response = await request(app)
        .get(`/api/quotes/${quoteId}`)
        .set("Authorization", `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("quote");
      expect(response.body.quote.id).toBe(quoteId);
      expect(response.body.quote.rfq_id).toBe(rfqId);
    });

    it("should return 404 for non-existent quote", async () => {
      const response = await request(app)
        .get("/api/quotes/999")
        .set("Authorization", `Bearer ${vendorToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("PUT /api/quotes/:id", () => {
    it("should update a quote successfully as vendor owner", async () => {
      // First create a project, RFQ, and quote
      const projectData = {
        name: "Test Project",
        description: "Test Project Description",
        location: "Test Location",
        deadline: "2025-12-31",
      };

      const projectResponse = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(projectData)
        .expect(201);

      const projectId = projectResponse.body.project.id;

      const rfqData = {
        project_id: projectId,
        title: "Test RFQ",
        description: "Test RFQ Description",
        deadline: "2025-12-31T23:59:59Z",
      };

      const rfqResponse = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData)
        .expect(201);

      const rfqId = rfqResponse.body.rfq.id;

      const quoteData = {
        rfq_id: rfqId,
        vendor_id: vendor.id,
        total_amount: 1000.0,
      };

      const createResponse = await request(app)
        .post("/api/quotes")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send(quoteData);

      const quoteId = createResponse.body.quote.id;

      const updateData = {
        status: "revised",
        total_amount: 1500.0,
      };

      const response = await request(app)
        .put(`/api/quotes/${quoteId}`)
        .set("Authorization", `Bearer ${vendorToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("quote");
      expect(response.body.quote.status).toBe(updateData.status);
      expect(response.body.quote.total_amount).toBe(1500);
    });

    it("should fail to update a quote as different vendor", async () => {
      // Create another vendor
      const otherVendorUser = {
        name: "Other Vendor",
        email: "other_vendor@test.com",
        password: "password123",
        role: "vendor",
        company_name: "Other Vendor Company",
        phone: "1234567890",
      };

      const otherVendorResponse = await request(app)
        .post("/api/auth/register")
        .send(otherVendorUser);

      const otherVendorToken = otherVendorResponse.body.token;

      const otherVendorData = {
        user_id: mockDb
          .getUsers()
          .find((u) => u.email === otherVendorUser.email).id,
        company_name: "Other Vendor Company",
        contact_person: "Other Vendor Contact",
        phone: "1234567890",
        email: "other_vendor@test.com",
        address: "456 Other Vendor St",
        gst_number: "GST987654321",
      };

      const otherVendorResponse2 = await request(app)
        .post("/api/vendors")
        .set("Authorization", `Bearer ${otherVendorToken}`)
        .send(otherVendorData)
        .expect(201);

      const otherVendor = otherVendorResponse2.body.vendor;

      // Create a quote with the original vendor
      const projectData = {
        name: "Test Project",
        description: "Test Project Description",
        location: "Test Location",
        deadline: "2025-12-31",
      };

      const projectResponse = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(projectData)
        .expect(201);

      const projectId = projectResponse.body.project.id;

      const rfqData = {
        project_id: projectId,
        title: "Test RFQ",
        description: "Test RFQ Description",
        deadline: "2025-12-31T23:59:59Z",
      };

      const rfqResponse = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData)
        .expect(201);

      const rfqId = rfqResponse.body.rfq.id;

      const quoteData = {
        rfq_id: rfqId,
        vendor_id: vendor.id,
        total_amount: 1000.0,
      };

      const createResponse = await request(app)
        .post("/api/quotes")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send(quoteData);

      const quoteId = createResponse.body.quote.id;

      const updateData = {
        status: "revised",
      };

      const response = await request(app)
        .put(`/api/quotes/${quoteId}`)
        .set("Authorization", `Bearer ${otherVendorToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("DELETE /api/quotes/:id", () => {
    it("should delete a quote successfully as vendor owner", async () => {
      // First create a project, RFQ, and quote
      const projectData = {
        name: "Test Project",
        description: "Test Project Description",
        location: "Test Location",
        deadline: "2025-12-31",
      };

      const projectResponse = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(projectData)
        .expect(201);

      const projectId = projectResponse.body.project.id;

      const rfqData = {
        project_id: projectId,
        title: "Test RFQ",
        description: "Test RFQ Description",
        deadline: "2025-12-31T23:59:59Z",
      };

      const rfqResponse = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData)
        .expect(201);

      const rfqId = rfqResponse.body.rfq.id;

      const quoteData = {
        rfq_id: rfqId,
        vendor_id: vendor.id,
        total_amount: 1000.0,
      };

      const createResponse = await request(app)
        .post("/api/quotes")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send(quoteData);

      const quoteId = createResponse.body.quote.id;

      const response = await request(app)
        .delete(`/api/quotes/${quoteId}`)
        .set("Authorization", `Bearer ${vendorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("message");
    });

    it("should fail to delete a quote as different vendor", async () => {
      // Create another vendor
      const otherVendorUser = {
        name: "Other Vendor",
        email: "other_vendor@test.com",
        password: "password123",
        role: "vendor",
        company_name: "Other Vendor Company",
        phone: "1234567890",
      };

      const otherVendorResponse = await request(app)
        .post("/api/auth/register")
        .send(otherVendorUser);

      const otherVendorToken = otherVendorResponse.body.token;

      const otherVendorData = {
        user_id: mockDb
          .getUsers()
          .find((u) => u.email === otherVendorUser.email).id,
        company_name: "Other Vendor Company",
        contact_person: "Other Vendor Contact",
        phone: "1234567890",
        email: "other_vendor@test.com",
        address: "456 Other Vendor St",
        gst_number: "GST987654321",
      };

      const otherVendorResponse2 = await request(app)
        .post("/api/vendors")
        .set("Authorization", `Bearer ${otherVendorToken}`)
        .send(otherVendorData)
        .expect(201);

      const otherVendor = otherVendorResponse2.body.vendor;

      // Create a quote with the original vendor
      const projectData = {
        name: "Test Project",
        description: "Test Project Description",
        location: "Test Location",
        deadline: "2025-12-31",
      };

      const projectResponse = await request(app)
        .post("/api/projects")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(projectData)
        .expect(201);

      const projectId = projectResponse.body.project.id;

      const rfqData = {
        project_id: projectId,
        title: "Test RFQ",
        description: "Test RFQ Description",
        deadline: "2025-12-31T23:59:59Z",
      };

      const rfqResponse = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData)
        .expect(201);

      const rfqId = rfqResponse.body.rfq.id;

      const quoteData = {
        rfq_id: rfqId,
        vendor_id: vendor.id,
        total_amount: 1000.0,
      };

      const createResponse = await request(app)
        .post("/api/quotes")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send(quoteData);

      const quoteId = createResponse.body.quote.id;

      const response = await request(app)
        .delete(`/api/quotes/${quoteId}`)
        .set("Authorization", `Bearer ${otherVendorToken}`)
        .expect(403);

      expect(response.body).toHaveProperty("message");
    });
  });
});
