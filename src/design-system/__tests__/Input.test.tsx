import React, { createRef } from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Input, InputRef } from '../components/Input';
import { TextInput } from 'react-native';

(global as any).__ExpoImportMetaRegistry = (global as any).__ExpoImportMetaRegistry || {};
(global as any).structuredClone = (global as any).structuredClone || ((val: any) => JSON.parse(JSON.stringify(val)));

describe('Input Component', () => {
  it('renders correctly with label and placeholder', () => {
    const { getByText, getByPlaceholderText } = render(
      <Input label="Test Label" value="" onChange={() => {}} placeholder="Test Placeholder" />
    );

    expect(getByText('Test Label')).toBeTruthy();
    expect(getByPlaceholderText('Test Placeholder')).toBeTruthy();
  });

  it('calls onChange when text changes', () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <Input value="" onChange={onChange} placeholder="Input" />
    );

    fireEvent.changeText(getByPlaceholderText('Input'), 'new text');
    expect(onChange).toHaveBeenCalledWith('new text');
  });

  it('displays error message when error prop is provided', () => {
    const { getByText } = render(
      <Input value="" onChange={() => {}} error="Error Message" />
    );

    expect(getByText('Error Message')).toBeTruthy();
  });

  it('exposes focus method and current ref via useImperativeHandle', () => {
    const ref = createRef<InputRef>();
    render(<Input ref={ref} value="" onChange={() => {}} />);

    expect(ref.current).toHaveProperty('focus');
    expect(typeof ref.current?.focus).toBe('function');
    expect(ref.current?.current).toBeInstanceOf(Object); // TextInput instance
  });
});
