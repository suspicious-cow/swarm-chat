import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../../components/MessageBubble';
import type { Message } from '../../types';

const baseMsg: Message = {
  id: 'm1',
  subgroup_id: 'sg1',
  user_id: 'u1',
  display_name: 'Alice',
  content: 'Hello everyone!',
  msg_type: 'human',
  source_subgroup_id: null,
  created_at: '2025-01-15T10:30:00Z',
};

describe('MessageBubble', () => {
  it('renders human message with display name and content', () => {
    render(<MessageBubble message={baseMsg} isOwn={false} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
  });

  it('renders surrogate message with Surrogate badge', () => {
    const msg: Message = {
      ...baseMsg,
      user_id: null,
      display_name: 'Surrogate Agent',
      msg_type: 'surrogate',
    };
    render(<MessageBubble message={msg} isOwn={false} />);
    expect(screen.getByText('Surrogate')).toBeInTheDocument();
  });

  it('renders contributor message with AI badge', () => {
    const msg: Message = {
      ...baseMsg,
      user_id: null,
      display_name: 'Contributor Agent',
      msg_type: 'contributor',
    };
    render(<MessageBubble message={msg} isOwn={false} />);
    expect(screen.getByText('AI')).toBeInTheDocument();
  });

  it('own messages get different alignment', () => {
    const { container: ownContainer } = render(
      <MessageBubble message={baseMsg} isOwn={true} />
    );
    const { container: otherContainer } = render(
      <MessageBubble message={baseMsg} isOwn={false} />
    );

    const ownDiv = ownContainer.firstElementChild as HTMLElement;
    const otherDiv = otherContainer.firstElementChild as HTMLElement;
    expect(ownDiv.style.alignSelf).toBe('flex-end');
    expect(otherDiv.style.alignSelf).toBe('flex-start');
  });

  it('renders message content', () => {
    render(<MessageBubble message={baseMsg} isOwn={false} />);
    expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
  });
});
