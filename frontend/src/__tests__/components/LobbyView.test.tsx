import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useDeliberationStore } from '../../stores/deliberationStore';
import { LobbyView } from '../../components/LobbyView';

// Mock fetch
vi.stubGlobal('fetch', vi.fn());

beforeEach(() => {
  useDeliberationStore.getState().reset();
});

describe('LobbyView', () => {
  it('renders both create and join cards', () => {
    render(<LobbyView />);
    expect(screen.getByText('Create a Session')).toBeInTheDocument();
    expect(screen.getByText('Join a Session')).toBeInTheDocument();
  });

  it('renders hero text', () => {
    render(<LobbyView />);
    expect(screen.getByText('Conversational Swarm Intelligence')).toBeInTheDocument();
  });

  it('calls createSession when Create button is clicked with filled inputs', async () => {
    const user = userEvent.setup();
    const createSession = vi.fn();
    useDeliberationStore.setState({ createSession });

    render(<LobbyView />);

    const topicInput = screen.getByPlaceholderText(/Should cities ban/i);
    const nameInput = screen.getAllByPlaceholderText('Enter your name')[0];

    await user.type(topicInput, 'Should we ban cars?');
    await user.type(nameInput, 'Admin');
    await user.click(screen.getByText('Create Session'));

    expect(createSession).toHaveBeenCalledWith('Should we ban cars?', 5);
  });

  it('calls joinSession when Join button is clicked with filled inputs', async () => {
    const user = userEvent.setup();
    const joinSession = vi.fn();
    useDeliberationStore.setState({ joinSession });

    render(<LobbyView />);

    const codeInput = screen.getByPlaceholderText(/A3X9K2/i);
    const nameInput = screen.getAllByPlaceholderText('Enter your name')[1];

    await user.type(codeInput, 'ABC123');
    await user.type(nameInput, 'Bob');
    await user.click(screen.getByText('Join Session'));

    expect(joinSession).toHaveBeenCalledWith('ABC123', 'Bob');
  });

  it('shows join code after session is created', () => {
    useDeliberationStore.setState({
      currentSession: {
        id: '1', title: 'Test Topic', status: 'waiting',
        join_code: 'XYZ789', subgroup_size: 5, created_at: '2025-01-01',
      },
      currentUser: null,
    });

    render(<LobbyView />);

    expect(screen.getByText('Session Created!')).toBeInTheDocument();
    expect(screen.getByText('XYZ789')).toBeInTheDocument();
  });
});
