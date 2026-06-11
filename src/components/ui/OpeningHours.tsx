import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface OpeningHoursProps {
  hours?: string[];
}

export default function OpeningHours({ hours }: OpeningHoursProps) {
  if (!hours || hours.length === 0) {
    return <Text style={styles.text}>Opening hours not available</Text>;
  }

  return (
    <View style={styles.container}>
      {hours.map((day, index) => (
        <Text
          key={index}
          style={[styles.text, day.includes('Closed') && styles.closed]}
        >
          {day}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  text: {
    fontSize: 12,
    color: '#555',
    marginBottom: 2,
  },
  closed: {
    color: '#d32f2f',
    fontWeight: 'bold',
  },
});
