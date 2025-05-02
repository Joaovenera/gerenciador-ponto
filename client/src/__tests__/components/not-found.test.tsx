import React from 'react';
import { render, screen } from '@testing-library/react';
import NotFound from '@/pages/not-found';

describe('NotFound', () => {
  it('renders without crashing', () => {
    render(<NotFound />);
    
    // Verifica se o texto de página não encontrada é exibido
    expect(screen.getByText(/página não encontrada/i)).toBeInTheDocument();
    
    // Verifica se tem um botão para voltar
    expect(screen.getByRole('button', { name: /voltar/i })).toBeInTheDocument();
  });
});
