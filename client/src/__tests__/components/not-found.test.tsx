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
    
    // Verify the 404 text is displayed
    expect(screen.getByText(/404 Page Not Found/i)).toBeInTheDocument();
    
    // Verify the error message is displayed
    expect(screen.getByText(/Did you forget to add the page to the router\?/i)).toBeInTheDocument();
  });
});
