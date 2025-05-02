import React from 'react';
import { render, screen } from '@testing-library/react';
import NotFound from '@/pages/not-found';

// Mock do useNavigate do wouter
jest.mock('wouter', () => ({
  useLocation: () => ['/not-found', () => {}],
  useNavigate: () => jest.fn(),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>
}));

describe('NotFound', () => {
  it('renders without crashing', () => {
    render(<NotFound />);
    
    // Verifica se o texto de página não encontrada é exibido
    expect(screen.getByText(/página não encontrada/i)).toBeInTheDocument();
    
    // Verifica se tem um botão para voltar
    expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument();
  });
});
