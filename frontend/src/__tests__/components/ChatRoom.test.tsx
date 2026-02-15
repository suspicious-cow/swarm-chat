import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useDeliberationStore } from '../../stores/deliberationStore';

// Mock the useWebSocket hook
vi.mock('../../hooks/useWebSocket', () => ({
  useWebSocket: () => ({ sendMessage: vi.fn() }),
}));

// Import ChatRoom AFTER mocking
import { ChatRoom } from '../../components/ChatRoom';

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

beforeEach(() => {
  useDeliberationStore.getState().reset();
});

describe('ChatRoom', () => {
  const setupState = (overrides = {}) => {
    useDeliberationStore.setState({
      currentUser: {
        id: 'u1', display_name: 'Alice', session_id: 's1',
        subgroup_id: 'sg1', is_admin: false, created_at: '2025-01-01',
      },
      currentSession: {
        id: 's1', title: 'Test Topic', status: 'active',
        join_code: 'ABC', subgroup_size: 5, created_at: '2025-01-01',
      },
      subgroups: [{
        id: 'sg1', session_id: 's1', label: 'ThinkTank 1',
        members: [
          { id: 'u1', display_name: 'Alice', session_id: 's1', subgroup_id: 'sg1', is_admin: false, created_at: '2025-01-01' },
          { id: 'u2', display_name: 'Bob', session_id: 's1', subgroup_id: 'sg1', is_admin: false, created_at: '2025-01-01' },
        ],
        created_at: '2025-01-01',
      }],
      messages: [],
      ...overrides,
    });
  };

  it('renders subgroup label', () => {
    setupState();
    render(<ChatRoom />);
    expect(screen.getByText('ThinkTank 1')).toBeInTheDocument();
  });

  it('renders member count in header', () => {
    setupState();
    render(<ChatRoom />);
    expect(screen.getByText('2 members')).toBeInTheDocument();
  });

  it('shows empty message text when no messages', () => {
    setupState();
    render(<ChatRoom />);
    expect(screen.getByText(/No transmissions yet/)).toBeInTheDocument();
  });

  it('renders messages', () => {
    setupState({
      messages: [{
        id: 'm1', subgroup_id: 'sg1', user_id: 'u2', display_name: 'Bob',
        content: 'Hello there!', msg_type: 'human', source_subgroup_id: null,
        created_at: '2025-01-01T10:00:00Z',
      }],
    });
    render(<ChatRoom />);
    expect(screen.getByText('Hello there!')).toBeInTheDocument();
  });

  it('returns null without currentUser', () => {
    useDeliberationStore.setState({ currentUser: null, currentSession: null });
    const { container } = render(<ChatRoom />);
    expect(container.innerHTML).toBe('');
  });
});
