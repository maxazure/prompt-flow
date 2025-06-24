import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App', () => {
  it('renders PromptFlow heading', () => {
    render(<App />);
    expect(screen.getByText('PromptFlow')).toBeInTheDocument();
  });
});