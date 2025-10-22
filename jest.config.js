module.exports = {
  testEnvironment: "node",
  collectCoverageFrom: ["src/**/*.js", "!src/config/**", "!src/middleware/**"],
  testMatch: ["**/tests/**/*.test.js"],
  verbose: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
};
