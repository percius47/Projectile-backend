// Test setup file
const mockDb = require("../src/config/db.test");

// Reset the mock database before each test
beforeEach(() => {
  mockDb.reset();
});

// Clean up after all tests
afterAll(() => {
  mockDb.reset();
});
