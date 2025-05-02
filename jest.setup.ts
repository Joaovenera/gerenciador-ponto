import '@testing-library/jest-dom';

// Mock global fetch for all tests
global.fetch = jest.fn();

// Reset mocks between tests
beforeEach(() => {
  jest.resetAllMocks();
});
