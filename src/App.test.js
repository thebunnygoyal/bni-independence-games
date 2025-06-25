import { render, screen } from '@testing-library/react';
import App from './App';

test('renders BNI Independence Games', () => {
  render(<App />);
  const titleElement = screen.getByText(/BNI Independence Games/i);
  expect(titleElement).toBeInTheDocument();
});