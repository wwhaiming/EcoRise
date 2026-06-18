import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import api from '../utils/api';

vi.mock('../utils/api', () => {
  return {
    default: {
      me: vi.fn(),
      listLeaderboards: vi.fn(),
      getLeaderboard: vi.fn(),
      getPosts: vi.fn(),
      getQuests: vi.fn(),
      getNotifications: vi.fn(),
      joinByCode: vi.fn(),
      readNotifications: vi.fn(),
      logout: vi.fn(),
      coachStatus: vi.fn().mockResolvedValue({ enabled: true }),
      coachQuestion: vi.fn().mockResolvedValue({
        question: { id: 'cq1', text: 'Sample Question?', options: ['Yes', 'No'] }
      }),
      coachGuidance: vi.fn().mockResolvedValue({ guidance: 'Mock Guidance' }),
      coachTip: vi.fn().mockResolvedValue({ tip: 'Mock Tip' }),
      coachEvalReport: vi.fn().mockResolvedValue({ available: false }),
      coachPapers: vi.fn().mockResolvedValue({ papers: [], total: 0 }),
    },
  };
});

vi.mock('../components/Confetti', () => ({
  fireConfetti: vi.fn(),
}));

describe('App Shell Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Onboarding screen by default when unauthenticated', async () => {
    vi.mocked(api.me).mockRejectedValue(new Error('Unauthorized'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText((content, element) => element.textContent === 'EcoRise')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Start AI audit/i })).toBeInTheDocument();
    });
  });

  it('bootstraps to authenticated state and loads Coach page', async () => {
    const mockUser = { id: 'you', name: 'Eco Champion', handle: '@you' };
    const mockBoard = { id: 'b1', name: 'Greenfield High', invite_code: 'GRNFLD-7K2', prize: 'A tree planted' };

    vi.mocked(api.me).mockResolvedValue({ user: mockUser });
    vi.mocked(api.listLeaderboards).mockResolvedValue({ leaderboards: [mockBoard] });
    vi.mocked(api.getLeaderboard).mockResolvedValue({ members: [{ user_id: 'you', name: 'You', points: 100, isYou: true }] });
    vi.mocked(api.getPosts).mockResolvedValue({ posts: [] });
    vi.mocked(api.getQuests).mockResolvedValue({ quests: [] });
    vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [], unread: 0 });

    render(<App />);

    // Wait for the Coach screen contents to load
    await waitFor(() => {
      expect(screen.getByText(/AI Footprint Coach/i)).toBeInTheDocument();
      expect(screen.getByText(/AI drafts from trusted sources/i)).toBeInTheDocument();
    });

    // Check that navigation bar is present
    expect(screen.getByRole('button', { name: 'AI Eco Coach' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Board' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Quests' })).toBeInTheDocument();
  });

  it('navigates to different screens when tabs are clicked', async () => {
    const mockUser = { id: 'you', name: 'Eco Champion', handle: '@you' };
    const mockBoard = { id: 'b1', name: 'Greenfield High', invite_code: 'GRNFLD-7K2', prize: 'A tree planted' };

    vi.mocked(api.me).mockResolvedValue({ user: mockUser });
    vi.mocked(api.listLeaderboards).mockResolvedValue({ leaderboards: [mockBoard] });
    vi.mocked(api.getLeaderboard).mockResolvedValue({ members: [{ user_id: 'you', name: 'You', points: 100, isYou: true }] });
    vi.mocked(api.getPosts).mockResolvedValue({ posts: [] });
    vi.mocked(api.getQuests).mockResolvedValue({ quests: [] });
    vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [], unread: 0 });

    render(<App />);

    // Verify initial load on Coach page
    await waitFor(() => {
      expect(screen.getByText(/AI Footprint Coach/i)).toBeInTheDocument();
    });

    // Navigate to "Board" screen (Home.jsx)
    const boardTab = screen.getByRole('button', { name: 'Board' });
    fireEvent.click(boardTab);
    await waitFor(() => {
      // Home page renders user dashboard info
      expect(screen.getByText('Eco Champion')).toBeInTheDocument();
    });

    // Navigate to the full Leaderboard page from the home widget
    const seeAllButton = screen.getByRole('button', { name: /See all/i });
    fireEvent.click(seeAllButton);
    await waitFor(() => {
      expect(screen.getByText('Greenfield High')).toBeInTheDocument();
    });

    // Navigate to "Quests" screen
    const questsTab = screen.getByRole('button', { name: 'Quests' });
    fireEvent.click(questsTab);
    await waitFor(() => {
      expect(screen.getByText(/Daily Quests/i)).toBeInTheDocument();
      expect(screen.getByText(/refreshes daily/i)).toBeInTheDocument();
    });

    // Navigate to "Research" screen
    const researchTab = screen.getByRole('button', { name: 'Research library' });
    fireEvent.click(researchTab);
    await waitFor(() => {
      expect(screen.getByText(/Research library · 1,000 papers/i)).toBeInTheDocument();
    });

    // Navigate to "Profile" screen
    const profileTab = screen.getByRole('button', { name: 'Profile' });
    fireEvent.click(profileTab);
    await waitFor(() => {
      expect(screen.getByText(/Badges earned/i)).toBeInTheDocument();
    });
  });
});
