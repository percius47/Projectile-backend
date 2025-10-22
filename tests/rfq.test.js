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

describe("RFQ API", () => {
  let adminToken;
  let projectOwnerToken;
  let projectOwnerUser;
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

    // Create a project owner user
    projectOwnerUser = {
      name: "Project Owner",
      email: "project@test.com",
      password: "password123",
      role: "project_owner",
      company_name: "Project Owner Company",
      phone: "1234567890",
    };

    // Register users and get tokens
    const adminResponse = await request(app)
      .post("/api/auth/register")
      .send(adminUser);

    const projectOwnerResponse = await request(app)
      .post("/api/auth/register")
      .send(projectOwnerUser);

    adminToken = adminResponse.body.token;
    projectOwnerToken = projectOwnerResponse.body.token;
  });

  describe("POST /api/rfqs", () => {
    it("should create a new RFQ successfully as project owner", async () => {
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

      const rfqData = {
        project_id: projectId,
        title: "Test RFQ",
        description: "Test RFQ Description",
        deadline: "2025-12-31T23:59:59Z",
      };

      const response = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData)
        .expect(201);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("rfq");
      expect(response.body.rfq.title).toBe(rfqData.title);
      expect(response.body.rfq.project_id).toBe(projectId);
    });

    it("should fail to create an RFQ without required fields", async () => {
      const rfqData = {
        // Missing project_id, title, and deadline
        description: "Test RFQ Description",
      };

      const response = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData)
        .expect(400);

      expect(response.body).toHaveProperty("message");
    });

    it("should fail to create an RFQ for non-existent project", async () => {
      const rfqData = {
        project_id: 999, // Non-existent project
        title: "Test RFQ",
        description: "Test RFQ Description",
        deadline: "2025-12-31T23:59:59Z",
      };

      const response = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData)
        .expect(404);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("Project not found");
    });
  });

  describe("GET /api/rfqs", () => {
    it("should get all RFQs as admin", async () => {
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

      await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData);

      const response = await request(app)
        .get("/api/rfqs")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("rfqs");
      expect(Array.isArray(response.body.rfqs)).toBe(true);
    });

    it("should fail to get all RFQs as non-admin", async () => {
      const response = await request(app)
        .get("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("GET /api/rfqs/project/:project_id", () => {
    it("should get RFQs by project ID", async () => {
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

      await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData);

      const response = await request(app)
        .get(`/api/rfqs/project/${projectId}`)
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("rfqs");
      expect(Array.isArray(response.body.rfqs)).toBe(true);
      expect(response.body.rfqs.length).toBe(1);
    });

    it("should return empty array for project with no RFQs", async () => {
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

      const response = await request(app)
        .get(`/api/rfqs/project/${projectId}`)
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("rfqs");
      expect(Array.isArray(response.body.rfqs)).toBe(true);
      expect(response.body.rfqs.length).toBe(0);
    });
  });

  describe("GET /api/rfqs/:id", () => {
    it("should get an RFQ by ID", async () => {
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

      const createResponse = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData);

      const rfqId = createResponse.body.rfq.id;

      const response = await request(app)
        .get(`/api/rfqs/${rfqId}`)
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("rfq");
      expect(response.body.rfq.id).toBe(rfqId);
      expect(response.body.rfq.title).toBe(rfqData.title);
    });

    it("should return 404 for non-existent RFQ", async () => {
      const response = await request(app)
        .get("/api/rfqs/999")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("message");
    });
  });

  describe("PUT /api/rfqs/:id", () => {
    it("should update an RFQ successfully as project owner", async () => {
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

      const createResponse = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData);

      const rfqId = createResponse.body.rfq.id;

      const updateData = {
        title: "Updated RFQ Title",
        description: "Updated RFQ Description",
      };

      const response = await request(app)
        .put(`/api/rfqs/${rfqId}`)
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("message");
      expect(response.body).toHaveProperty("rfq");
      expect(response.body.rfq.title).toBe(updateData.title);
      expect(response.body.rfq.description).toBe(updateData.description);
    });

    it("should fail to update a non-existent RFQ", async () => {
      const updateData = {
        title: "Updated RFQ Title",
      };

      const response = await request(app)
        .put("/api/rfqs/999")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("RFQ not found");
    });
  });

  describe("DELETE /api/rfqs/:id", () => {
    it("should delete an RFQ successfully as project owner", async () => {
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

      const createResponse = await request(app)
        .post("/api/rfqs")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .send(rfqData);

      const rfqId = createResponse.body.rfq.id;

      const response = await request(app)
        .delete(`/api/rfqs/${rfqId}`)
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("message");
    });

    it("should fail to delete a non-existent RFQ", async () => {
      const response = await request(app)
        .delete("/api/rfqs/999")
        .set("Authorization", `Bearer ${projectOwnerToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toBe("RFQ not found");
    });
  });
});
