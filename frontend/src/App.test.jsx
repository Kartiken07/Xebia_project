import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

describe('App component', () => {
  test('renders login screen by default', () => {
    render(<App />);
    const loginHeader = screen.getByText(/Enterprise Lifecycle Platform/i);
    expect(loginHeader).toBeInTheDocument();
    
    const signInButton = screen.getByRole('button', { name: /Sign In/i });
    expect(signInButton).toBeInTheDocument();
  });
});
