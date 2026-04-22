import React from 'react';
import { Switch } from 'react-native';
import { theme } from '../theme';

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export const Toggle = ({ value, onChange }: Props) => (
  <Switch
    value={value}
    onValueChange={onChange}
    trackColor={{
      false: theme.colors.border,
      true: theme.colors.primary,
    }}
    thumbColor={theme.colors.white}
  />
);
