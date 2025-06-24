import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import Login from '../../pages/Login';

// Mock API
vi.mock('../../services/api', () => ({
  authAPI: {
    login: vi.fn(),
  },
}));

const LoginWrapper = () => (
  <BrowserRouter>
    <AuthProvider>
      <Login />
    </AuthProvider>
  </BrowserRouter>
);

describe('Login Page', () => {
  it('renders login form', () => {
    render(<LoginWrapper />);
    
    expect(screen.getByText('Sign in to PromptFlow')).toBeInTheDocument();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows validation for empty fields', async () => {
    render(<LoginWrapper />);
    
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    fireEvent.click(submitButton);

    // HTML5 validation will prevent submission
    const emailField = screen.getByLabelText('Email address');
    expect(emailField).toBeRequired();
  });

  it('allows typing in form fields', async () => {
    render(<LoginWrapper />);
    
    const emailField = screen.getByLabelText('Email address');
    const passwordField = screen.getByLabelText('Password');

    fireEvent.change(emailField, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordField, { target: { value: 'password123' } });

    expect(emailField).toHaveValue('test@example.com');
    expect(passwordField).toHaveValue('password123');
  });
});