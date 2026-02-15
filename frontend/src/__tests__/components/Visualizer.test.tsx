import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useDeliberationStore } from '../../stores/deliberationStore';

// Mock ResizeObserver for jsdom
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal('ResizeObserver', MockResizeObserver);

import { Visualizer } from '../../components/Visualizer';

beforeEach(() => {
  useDeliberationStore.getState().reset();
});

describe('Visualizer', () => {
  const setupState = () => {
    useDeliberationStore.setState({
      currentUser: {
        id: 'u1', display_name: 'Alice', session_id: 's1',
        subgroup_id: 'sg1', is_admin: true, created_at: '2025-01-01',
      },
      currentSession: {
        id: 's1', title: 'Test Topic', status: 'active',
        join_code: 'ABC', subgroup_size: 5, created_at: '2025-01-01',
      },
      subgroups: [
        {
          id: 'sg1', session_id: 's1', label: 'ThinkTank 1',
          members: [{ id: 'u1', display_name: 'Alice', session_id: 's1', subgroup_id: 'sg1', is_admin: true, created_at: '2025-01-01' }],
          created_at: '2025-01-01',
        },
        {
          id: 'sg2', session_id: 's1', label: 'ThinkTank 2',
          members: [{ id: 'u2', display_name: 'Bob', session_id: 's1', subgroup_id: 'sg2', is_admin: false, created_at: '2025-01-01' }],
          created_at: '2025-01-01',
        },
      ],
      ideas: [
        {
          id: 'i1', session_id: 's1', subgroup_id: 'sg1',
          summary: 'Ban cars from downtown', sentiment: 0.7,
          support_count: 3, challenge_count: 1, created_at: '2025-01-01',
        },
      ],
    });
  };

  it('renders Deliberation Map title', () => {
    setupState();
    render(<Visualizer />);
    expect(screen.getByText('Deliberation Map')).toBeInTheDocument();
  });

  it('renders SubgroupNode for each subgroup', () => {
    setupState();
    render(<Visualizer />);
    expect(screen.getByText('ThinkTank 1')).toBeInTheDocument();
    expect(screen.getByText('ThinkTank 2')).toBeInTheDocument();
  });

  it('renders ideas in sidebar', () => {
    setupState();
    render(<Visualizer />);
    expect(screen.getByText('Ban cars from downtown')).toBeInTheDocument();
    expect(screen.getByText(/Live Ideas/)).toBeInTheDocument();
  });

  it('returns null without currentSession', () => {
    const { container } = render(<Visualizer />);
    expect(container.innerHTML).toBe('');
  });
});
