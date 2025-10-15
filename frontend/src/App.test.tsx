import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the auth hook
jest.mock('./hooks/useAuth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    token: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

test('renders login page when not authenticated', () => {
  render(<App />);
  expect(screen.getByText(/Voltas BMS Dashboard/i)).toBeInTheDocument();
});