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

describe("Debug Vendor Operations", () => {
  it("should create and retrieve a vendor successfully", async () => {
    // Register an admin user
    const adminUser = {
      name: "Admin User",
      email: "admin@test.com",
      password: "password123",
      role: "admin",
      company_name: "Test Company",
      phone: "1234567890",
    };

    const vendorUser = {
      name: "Vendor User",
      email: "vendor@test.com",
      password: "password123",
      role: "vendor",
      company_name: "Vendor Company",
      phone: "1234567890",
    };

    // Register users
    const adminResponse = await request(app)
      .post("/api/auth/register")
      .send(adminUser)
      .expect(201);

    const vendorResponse = await request(app)
      .post("/api/auth/register")
      .send(vendorUser)
      .expect(201);

    const adminToken = adminResponse.body.token;
    const vendorToken = vendorResponse.body.token;

    console.log("Admin token:", adminToken);
    console.log("Vendor token:", vendorToken);

    // Create a vendor
    const vendorData = {
      user_id: 2, // Vendor user ID
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
      .send(vendorData)
      .expect(201);

    console.log("Create vendor response:", createResponse.body);

    const vendorId = createResponse.body.vendor.id;
    console.log("Vendor ID:", vendorId);

    // Get all vendors as admin
    const allVendorsResponse = await request(app)
      .get("/api/vendors")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    console.log("All vendors response:", allVendorsResponse.body);

    // Get vendor by ID
    const vendorByIdResponse = await request(app)
      .get(`/api/vendors/${vendorId}`)
      .set("Authorization", `Bearer ${vendorToken}`)
      .expect(200);

    console.log("Vendor by ID response:", vendorByIdResponse.body);
  });
});
