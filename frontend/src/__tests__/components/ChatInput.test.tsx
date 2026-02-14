import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatInput } from '../../components/ChatInput';

describe('ChatInput', () => {
  it('calls onSend with text when Send button clicked', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Hello world');
    await user.click(screen.getByText('Send'));

    expect(onSend).toHaveBeenCalledWith('Hello world');
  });

  it('clears input after sending', async () => {
    const user = userEvent.setup();
    render(<ChatInput onSend={vi.fn()} />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Hello');
    await user.click(screen.getByText('Send'));

    expect(input).toHaveValue('');
  });

  it('sends on Enter key', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Hello{Enter}');

    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('does not send on Shift+Enter', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByPlaceholderText('Type your message...');
    await user.type(input, 'Hello{Shift>}{Enter}{/Shift}');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not call onSend with empty input', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput onSend={onSend} />);

    await user.click(screen.getByText('Send'));

    expect(onSend).not.toHaveBeenCalled();
  });
});
