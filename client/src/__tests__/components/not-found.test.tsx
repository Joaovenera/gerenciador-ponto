import React from 'react';
import { render, screen } from '@testing-library/react';
import NotFound from '../../pages/not-found';

describe('<NotFound />', () => {
  it('renders the not found page correctly', () => {
    render(<NotFound />);
    
    // Verify title is present
    expect(screen.getByText(/página não encontrada/i)).toBeInTheDocument();
    
    // Verify return link is present
    expect(screen.getByRole('link', { name: /voltar/i })).toBeInTheDocument();
  });
});
