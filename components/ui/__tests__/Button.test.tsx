import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} disabled />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('shows loading spinner when loading', () => {
    const { queryByText } = render(
      <Button title="Test Button" onPress={() => {}} loading />
    );
    
    // Title should not be visible when loading
    expect(queryByText('Test Button')).toBeFalsy();
  });

  it('applies correct accessibility props', () => {
    const { getByRole } = render(
      <Button 
        title="Test Button" 
        onPress={() => {}} 
        accessibilityLabel="Custom label"
        accessibilityHint="Custom hint"
      />
    );
    
    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('Custom label');
    expect(button.props.accessibilityHint).toBe('Custom hint');
  });
});