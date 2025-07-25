import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { UnifiedModal } from './UnifiedModal';
import { currentColors, Spacing, Typography, BorderRadius } from '@/constants/Colors';

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
}

interface PriceAlertModalProps {
  visible: boolean;
  onClose: () => void;
  car: Car;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  visible,
  onClose,
  car,
}) => {
  const [targetPrice, setTargetPrice] = useState('');
  const [email, setEmail] = useState('');

  const handleSetAlert = () => {
    // Implementation for setting price alert
    console.log('Setting price alert:', { carId: car.id, targetPrice, email });
    onClose();
  };

  return (
    <UnifiedModal
      visible={visible}
      onClose={onClose}
      variant="default"
      title="Set Price Alert"
      subtitle={`${car.year} ${car.make} ${car.model}`}
      showHeader={true}
      size="medium"
      primaryAction={{
        label: 'Set Alert',
        onPress: handleSetAlert,
        style: 'primary',
      }}
      secondaryAction={{
        label: 'Cancel',
        onPress: onClose,
        style: 'secondary',
      }}
    >
      <View style={styles.container}>
        <Text style={styles.description}>
          Get notified when the price of this vehicle drops below your target price.
        </Text>
        
        <View style={styles.carInfo}>
          <Text style={styles.carTitle}>
            {car.year} {car.make} {car.model}
          </Text>
          <Text style={styles.currentPrice}>
            Current Price: ${car.price.toLocaleString()}
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Target Price</Text>
          <TextInput
            style={styles.input}
            value={targetPrice}
            onChangeText={setTargetPrice}
            placeholder="Enter your target price"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.note}>
          We'll send you an email notification when the price drops to or below your target price.
        </Text>
      </View>
    </UnifiedModal>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  description: {
    fontSize: Typography.body.fontSize,
    color: currentColors.textSecondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  carInfo: {
    backgroundColor: currentColors.surfaceSecondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  carTitle: {
    fontSize: Typography.subtitle.fontSize,
    fontWeight: '600',
    color: currentColors.text,
    marginBottom: Spacing.xs,
  },
  currentPrice: {
    fontSize: Typography.body.fontSize,
    color: currentColors.primary,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
    color: currentColors.text,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: currentColors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.body.fontSize,
    color: currentColors.text,
    backgroundColor: currentColors.surfaceSecondary,
  },
  note: {
    fontSize: Typography.caption.fontSize,
    color: currentColors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
