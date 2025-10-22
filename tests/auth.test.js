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

describe("Authentication API", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        role: "project_owner",
        company_name: "Test Company",
        phone: "1234567890",
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.role).toBe(userData.role);
    });

    it("should fail to register with missing required fields", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        // Missing password and role
      };

      const response = await request(app)
        .post("/api/auth/register")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      // First register a user
      const userData = {
        name: "Login Test User",
        email: "login@test.com",
        password: "password123",
        role: "project_owner",
      };

      await request(app).post("/api/auth/register").send(userData).expect(201);

      // Then try to login
      const loginData = {
        email: "login@test.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("user");
      expect(response.body).toHaveProperty("token");
    });

    it("should fail to login with invalid credentials", async () => {
      const loginData = {
        email: "nonexistent@test.com",
        password: "wrongpassword",
      };

      const response = await request(app)
        .post("/api/auth/login")
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty("message");
    });
  });
});
