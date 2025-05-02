
import '@testing-library/jest-dom';

// Mock global de fetch para testes
global.fetch = jest.fn();

// Reset mocks após cada teste
beforeEach(() => {
  jest.clearAllMocks();
});

// Configuração do ambiente para React
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Timeout global para testes (120 segundos)
jest.setTimeout(120000);
