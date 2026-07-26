import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SendForm from '../../src/ui/components/SendForm';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

afterEach(() => {
  cleanup();
});

describe('SendForm', () => {
  it('renders without crash', () => {
    const { container } = render(<SendForm />);
    expect(container).toBeTruthy();
  });

  it('shows Padala brand heading', () => {
    render(<SendForm />);
    // h2 inside the send form
    expect(screen.getByRole('heading', { level: 2, name: 'Padala' })).toBeTruthy();
  });

  it('shows the resolve button', () => {
    render(<SendForm />);
    const resolveBtn = screen.getByRole('button', { name: /Resolve/i });
    expect(resolveBtn).toBeTruthy();
  });

  it('shows the send button as disabled initially', () => {
    render(<SendForm />);
    const sendBtn = screen.getByRole('button', { name: /Send USDC/i });
    expect(sendBtn).toBeDisabled();
  });

  it('shows federation address input', () => {
    render(<SendForm />);
    const input = screen.getByPlaceholderText('supplier*padala.ph');
    expect(input).toBeTruthy();
  });

  it('shows amount input', () => {
    render(<SendForm />);
    const input = screen.getByPlaceholderText('0.00');
    expect(input).toBeTruthy();
  });

  it('shows sender identity badge', () => {
    render(<SendForm />);
    expect(screen.getByText('Sending as')).toBeTruthy();
    expect(screen.getByText('leni*padala.ph')).toBeTruthy();
  });

  it('shows quick-select suggestion for supplier', () => {
    render(<SendForm />);
    const buttons = screen.getAllByText('supplier*padala.ph');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('shows quick amount $5 button', () => {
    render(<SendForm />);
    expect(screen.getByRole('button', { name: '$5' })).toBeTruthy();
  });

  it('shows memo input', () => {
    render(<SendForm />);
    const memo = screen.getByPlaceholderText('For rice delivery, Sept');
    expect(memo).toBeTruthy();
  });

  it('shows testnet note', () => {
    render(<SendForm />);
    // The footer text contains "SEP-2 federation"
    const note = screen.getByText(/SEP-2 federation/i);
    expect(note).toBeTruthy();
  });
});
