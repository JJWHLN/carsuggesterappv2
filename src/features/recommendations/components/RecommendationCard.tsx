import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Recommendation } from '../types';

interface Props {
  recommendation: Recommendation;
}

export const RecommendationCard: React.FC<Props> = ({ recommendation }) => {
  const { car, score, reasons, confidence } = recommendation;
  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {car.make} {car.model} ({car.year})
      </Text>
      <Text style={styles.score}>Score: {score.toFixed(1)} / 100</Text>
      <Text style={styles.confidence}>
        Confidence: {(confidence * 100).toFixed(0)}%
      </Text>
      <Text style={styles.price}>Price: ${car.price.toLocaleString()}</Text>
      <Text style={styles.bodyStyle}>Body: {car.bodyStyle}</Text>
      <Text style={styles.safety}>Safety: {car.safetyRating}★</Text>
      <Text style={styles.section}>Reasons:</Text>
      {reasons.map((reason, i) => (
        <Text key={i} style={styles.reason}>
          - {reason}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  title: { fontWeight: 'bold', fontSize: 18, marginBottom: 4 },
  score: { fontSize: 14, color: '#48cc6c' },
  confidence: { fontSize: 13, color: '#888' },
  price: { fontSize: 14, marginTop: 4 },
  bodyStyle: { fontSize: 13 },
  safety: { fontSize: 13 },
  section: { marginTop: 8, fontWeight: '600' },
  reason: { fontSize: 12, color: '#444' },
});
