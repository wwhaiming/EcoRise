import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Onboarding from '../pages/Onboarding';
import api from '../utils/api';

vi.mock('../utils/api', () => {
  return {
    default: {
      signup: vi.fn(),
      login: vi.fn(),
    },
  };
});

describe('Onboarding Page Component', () => {
  const mockOnAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Hero stage initially', () => {
    render(<Onboarding onAuth={mockOnAuth} />);

    expect(screen.getByText((content, element) => element.textContent === 'EcoRise')).toBeInTheDocument();
    expect(screen.getByText(/AI school audit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start AI audit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /I already have an account/i })).toBeInTheDocument();
  });

  it('transitions to Carousel stage and navigates step-by-step to Auth stage', () => {
    render(<Onboarding onAuth={mockOnAuth} />);

    // Click Start AI audit to go to Carousel
    fireEvent.click(screen.getByRole('button', { name: /Start AI audit/i }));

    // Step 1 of 3
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Ask the AI footprint coach')).toBeInTheDocument();

    // Click Next to go to Step 2
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    expect(screen.getByText('Learn from cited sources')).toBeInTheDocument();

    // Click Next to go to Step 3
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    expect(screen.getByText('Turn insight into proof')).toBeInTheDocument();

    // Click Open coach to go to Auth stage
    fireEvent.click(screen.getByRole('button', { name: /Open coach/i }));

    // Now in Auth stage (signup mode by default)
    expect(screen.getByText('Launch your AI audit')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('skips the Carousel stage to Auth stage when Skip is clicked', () => {
    render(<Onboarding onAuth={mockOnAuth} />);

    fireEvent.click(screen.getByRole('button', { name: /Start AI audit/i }));
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Skip/i }));

    // Now in Auth stage (signup mode)
    expect(screen.getByText('Launch your AI audit')).toBeInTheDocument();
  });

  it('transitions directly to Login Auth stage when "I already have an account" is clicked on Hero', () => {
    render(<Onboarding onAuth={mockOnAuth} />);

    fireEvent.click(screen.getByRole('button', { name: /I already have an account/i }));

    // Now in Auth stage (login mode)
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Name/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('allows toggling between Signup and Login mode in the Auth stage', () => {
    render(<Onboarding onAuth={mockOnAuth} />);
    fireEvent.click(screen.getByRole('button', { name: /I already have an account/i }));

    expect(screen.getByText('Welcome back')).toBeInTheDocument();

    // Click toggle to go to Signup mode
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));
    expect(screen.getByText('Launch your AI audit')).toBeInTheDocument();
    expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();

    // Click toggle to go back to Login mode
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Name/i)).not.toBeInTheDocument();
  });

  it('calls signup API with form values and triggers onAuth on success', async () => {
    const mockUser = { id: 'u1', name: 'Alice', email: 'alice@school.edu' };
    vi.mocked(api.signup).mockResolvedValue({ user: mockUser });

    render(<Onboarding onAuth={mockOnAuth} />);
    // Navigate to Signup
    fireEvent.click(screen.getByRole('button', { name: /I already have an account/i }));
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));

    // Fill form
    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'alice@school.edu' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(api.signup).toHaveBeenCalledWith({
        name: 'Alice',
        email: 'alice@school.edu',
        password: 'password123',
      });
      expect(mockOnAuth).toHaveBeenCalledWith(mockUser);
    });
  });

  it('calls login API with form values and triggers onAuth on success', async () => {
    const mockUser = { id: 'u2', name: 'Bob', email: 'bob@school.edu' };
    vi.mocked(api.login).mockResolvedValue({ user: mockUser });

    render(<Onboarding onAuth={mockOnAuth} />);
    // Navigate to Login
    fireEvent.click(screen.getByRole('button', { name: /I already have an account/i }));

    // Fill form
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'bob@school.edu' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'securePass' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /Log in/i }));

    await waitFor(() => {
      expect(api.login).toHaveBeenCalledWith({
        email: 'bob@school.edu',
        password: 'securePass',
      });
      expect(mockOnAuth).toHaveBeenCalledWith(mockUser);
    });
  });

  it('displays API validation/error messages on failure', async () => {
    const errorDetails = {
      message: 'Signup failed',
      data: {
        details: [{ message: 'Password is too weak' }]
      }
    };
    vi.mocked(api.signup).mockRejectedValue(errorDetails);

    render(<Onboarding onAuth={mockOnAuth} />);
    fireEvent.click(screen.getByRole('button', { name: /I already have an account/i }));
    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));

    fireEvent.change(screen.getByLabelText(/Name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'alice@school.edu' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: '123' } });

    fireEvent.click(screen.getByRole('button', { name: /Create account/i }));

    await waitFor(() => {
      expect(screen.getByText('Password is too weak')).toBeInTheDocument();
    });
  });
});
