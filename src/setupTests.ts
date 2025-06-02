import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock the DatePicker component since it's complex to test
vi.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ label, value, onChange }: { 
    label: string; 
    value: Date; 
    onChange: (date: Date | null) => void 
  }) => {
    return React.createElement('input', {
      type: 'text',
      value: value.toISOString(),
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(new Date(e.target.value)),
      'aria-label': label,
    });
  },
})); 