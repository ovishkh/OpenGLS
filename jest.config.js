module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
  },
  testMatch: ["**/tests/**/*.test.js"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { configFile: "./jest.babel.config.js" }],
  },
};
