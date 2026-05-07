// src/components/admin/ExportCsvButton.tsx
// Botão para exportar logs filtrados como CSV

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Button as DSButton } from '@/design-system';
import { theme } from '@/design-system';

interface Props {
  filters: {
    userId?: string;
    actions?: string[];
    startDate?: string;
    endDate?: string;
    platform?: string;
  };
}

export const ExportCsvButton = ({ filters }: Props) => {
  const handleExport = () => {
    // In a real implementation, this would trigger a CSV download
    // For now, we'll just show an alert or toast
    alert('Exportar CSV não implementado nesta versão');
    
    // Example of what the implementation would do:
    // 1. Call the /admin/logs endpoint with the same filters
    // 2. Receive the data as JSON
    // 3. Convert to CSV format
    // 4. Trigger a download (on web) or share (on native)
  };

  return (
    <DSButton
      title="Exportar CSV"
      onPress={handleExport}
      size="sm"
      style={styles.button}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.secondary,
  },
});