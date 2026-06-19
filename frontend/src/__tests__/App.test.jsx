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
    const mockMembers = [
      { user_id: 'you', name: 'You', points: 100, isYou: true },
      { user_id: 'user2', name: 'User 2', points: 90 },
      { user_id: 'user3', name: 'User 3', points: 80 },
      { user_id: 'user4', name: 'User 4', points: 70 },
      { user_id: 'user5', name: 'User 5', points: 60 },
      { user_id: 'user6', name: 'User 6', points: 50 },
    ];

    vi.mocked(api.me).mockResolvedValue({ user: mockUser });
    vi.mocked(api.listLeaderboards).mockResolvedValue({ leaderboards: [mockBoard] });
    vi.mocked(api.getLeaderboard).mockResolvedValue({ members: mockMembers });
    vi.mocked(api.getPosts).mockResolvedValue({ posts: [] });
    vi.mocked(api.getQuests).mockResolvedValue({ quests: [] });
    vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [], unread: 0 });

    render(<App />);

    // Wait for the Learning screen contents (AI Coach sub-tab) to load
    await waitFor(() => {
      expect(screen.getByText(/Footprint Coach/i)).toBeInTheDocument();
      expect(screen.getByText('AI-verified · capped points')).toBeInTheDocument();
    });

    // Check that navigation bar is present
    expect(screen.getByRole('button', { name: 'Learning' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Home' })).toBeInTheDocument();
  });

  it('navigates to different screens when tabs are clicked', async () => {
    const mockUser = { id: 'you', name: 'Eco Champion', handle: '@you' };
    const mockBoard = { id: 'b1', name: 'Greenfield High', invite_code: 'GRNFLD-7K2', prize: 'A tree planted' };
    const mockMembers = [
      { user_id: 'you', name: 'You', points: 100, isYou: true },
      { user_id: 'user2', name: 'User 2', points: 90 },
      { user_id: 'user3', name: 'User 3', points: 80 },
      { user_id: 'user4', name: 'User 4', points: 70 },
      { user_id: 'user5', name: 'User 5', points: 60 },
      { user_id: 'user6', name: 'User 6', points: 50 },
    ];

    vi.mocked(api.me).mockResolvedValue({ user: mockUser });
    vi.mocked(api.listLeaderboards).mockResolvedValue({ leaderboards: [mockBoard] });
    vi.mocked(api.getLeaderboard).mockResolvedValue({ members: mockMembers });
    vi.mocked(api.getPosts).mockResolvedValue({ posts: [] });
    vi.mocked(api.getQuests).mockResolvedValue({ quests: [] });
    vi.mocked(api.getNotifications).mockResolvedValue({ notifications: [], unread: 0 });

    render(<App />);

    // Verify initial load on Learning page
    await waitFor(() => {
      expect(screen.getByText(/Footprint Coach/i)).toBeInTheDocument();
    });

    // Navigate to "Home" screen (which renders welcome header, board, and quests)
    const homeTab = screen.getByRole('button', { name: 'Home' });
    fireEvent.click(homeTab);
    await waitFor(() => {
      // Home page renders user dashboard info
      expect(screen.getByText('Eco Champion')).toBeInTheDocument();
      // It also renders the board title
      expect(screen.getByText('Leaderboard')).toBeInTheDocument();
    });

    // Navigate to the full Leaderboard page members expansion from the home screen
    const seeAllButton = screen.getByRole('button', { name: /See all/i });
    fireEvent.click(seeAllButton);
    await waitFor(() => {
      expect(screen.getByText('Greenfield High')).toBeInTheDocument();
    });

    // Navigate back to "Learning" screen and toggle to Research Library sub-tab
    const learningTab = screen.getByRole('button', { name: 'Learning' });
    fireEvent.click(learningTab);
    await waitFor(() => {
      expect(screen.getByText(/Footprint Coach/i)).toBeInTheDocument();
    });

    const researchSubTab = screen.getByRole('button', { name: 'Research Library' });
    fireEvent.click(researchSubTab);
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
