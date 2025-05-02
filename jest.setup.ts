// Configuração global para os testes
import '@testing-library/jest-dom';

// Mock global de fetch para testes
global.fetch = jest.fn();

// Reset mocks após cada teste
beforeEach(() => {
  jest.clearAllMocks();
});

// Timeout global para testes (30 segundos)
jest.setTimeout(30000);
