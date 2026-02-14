import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useDeliberationStore } from '../../stores/deliberationStore';
import { AdminPanel } from '../../components/AdminPanel';

// Mock fetch for summary requests
vi.stubGlobal('fetch', vi.fn());

beforeEach(() => {
  useDeliberationStore.getState().reset();
});

describe('AdminPanel', () => {
  it('shows Start Deliberation button in waiting status', () => {
    useDeliberationStore.setState({
      currentSession: {
        id: '1', title: 'Test', status: 'waiting',
        join_code: 'ABC', subgroup_size: 5, created_at: '2025-01-01',
      },
    });
    render(<AdminPanel />);
    expect(screen.getByText('Start Deliberation')).toBeInTheDocument();
  });

  it('shows End Deliberation button in active status', () => {
    useDeliberationStore.setState({
      currentSession: {
        id: '1', title: 'Test', status: 'active',
        join_code: 'ABC', subgroup_size: 5, created_at: '2025-01-01',
      },
    });
    render(<AdminPanel />);
    expect(screen.getByText('End Deliberation')).toBeInTheDocument();
  });

  it('shows Generate Summary button in active status', () => {
    useDeliberationStore.setState({
      currentSession: {
        id: '1', title: 'Test', status: 'active',
        join_code: 'ABC', subgroup_size: 5, created_at: '2025-01-01',
      },
    });
    render(<AdminPanel />);
    expect(screen.getByText('Generate Summary')).toBeInTheDocument();
  });

  it('shows Generate Summary button in completed status', () => {
    useDeliberationStore.setState({
      currentSession: {
        id: '1', title: 'Test', status: 'completed',
        join_code: 'ABC', subgroup_size: 5, created_at: '2025-01-01',
      },
    });
    render(<AdminPanel />);
    expect(screen.getByText('Generate Summary')).toBeInTheDocument();
  });

  it('does not show Start button when active', () => {
    useDeliberationStore.setState({
      currentSession: {
        id: '1', title: 'Test', status: 'active',
        join_code: 'ABC', subgroup_size: 5, created_at: '2025-01-01',
      },
    });
    render(<AdminPanel />);
    expect(screen.queryByText('Start Deliberation')).not.toBeInTheDocument();
  });

  it('returns null without currentSession', () => {
    const { container } = render(<AdminPanel />);
    expect(container.innerHTML).toBe('');
  });
});
