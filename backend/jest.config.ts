module.exports = {
  "testEnvironment": "node",
  "testMatch": [
    "**/__tests__/**/*.js",
    "**/?(*.)+(spec|test).js"
  ],
  "setupFilesAfterEnv": [
    "./test/setupTests.js"
  ],
  "coverageDirectory": "coverage",
  "globals": {
    "__API_URL__": "http://localhost:3000/api"
  },
  "collectCoverageFrom": [
    "src/**/*.{js,ts}",
    "!**/node_modules/**"
  ],
  "preset": "ts-jest"
};