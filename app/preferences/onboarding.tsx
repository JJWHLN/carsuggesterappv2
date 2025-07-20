import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { OnboardingFlow, OnboardingStep } from '@/components/ui/OnboardingFlow';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';

const PreferenceStepScreen = memo(() => {
  const { colors } = useThemeColors();
  const { markOnboardingComplete } = useAuth();

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'budget',
      question: "What's your budget?",
      description: "Help us find cars within your price range",
      type: 'slider',
      min: 5000,
      max: 150000,
      step: 5000,
      formatValue: (value: number) => `$${value.toLocaleString()}`,
      required: true,
    },
    {
      id: 'bodyType',
      question: "What type of car are you looking for?",
      description: "Select all that interest you",
      type: 'multiselect',
      options: [
        { id: 'sedan', label: 'Sedan', value: 'sedan' },
        { id: 'suv', label: 'SUV', value: 'suv' },
        { id: 'hatchback', label: 'Hatchback', value: 'hatchback' },
        { id: 'coupe', label: 'Coupe', value: 'coupe' },
        { id: 'convertible', label: 'Convertible', value: 'convertible' },
        { id: 'truck', label: 'Truck', value: 'truck' },
      ],
      required: true,
    },
    {
      id: 'fuelType',
      question: "What's your preferred fuel type?",
      description: "Choose your preference for efficiency and environmental impact",
      type: 'radio',
      options: [
        { id: 'gasoline', label: 'Gasoline', value: 'gasoline' },
        { id: 'hybrid', label: 'Hybrid', value: 'hybrid' },
        { id: 'electric', label: 'Electric', value: 'electric' },
        { id: 'diesel', label: 'Diesel', value: 'diesel' },
        { id: 'no-preference', label: 'No Preference', value: 'any' },
      ],
      required: true,
    },
    {
      id: 'features',
      question: "Which features are important to you?",
      description: "Select all features you'd like in your next car",
      type: 'multiselect',
      options: [
        { id: 'safety', label: 'Advanced Safety Features', value: 'safety' },
        { id: 'tech', label: 'Latest Technology', value: 'tech' },
        { id: 'luxury', label: 'Luxury Interior', value: 'luxury' },
        { id: 'performance', label: 'High Performance', value: 'performance' },
        { id: 'efficiency', label: 'Fuel Efficiency', value: 'efficiency' },
        { id: 'space', label: 'Spacious Interior', value: 'space' },
      ],
    },
    {
      id: 'mileage',
      question: "Maximum acceptable mileage?",
      description: "For used cars, what's the highest mileage you'd consider?",
      type: 'slider',
      min: 0,
      max: 200000,
      step: 10000,
      formatValue: (value: number) => value === 0 ? 'New only' : `${value.toLocaleString()} miles`,
    },
    {
      id: 'notifications',
      question: "Get notified about new matches?",
      description: "We'll send you personalized car recommendations",
      type: 'toggle',
    },
  ];

  const handleComplete = async (preferences: Record<string, any>) => {
    logger.debug('User preferences:', preferences);
    // Here you would typically:
    // 1. Save preferences to user profile
    // 2. Generate initial recommendations
    // 3. Navigate to recommendations screen
    
    // Mark onboarding as complete
    await markOnboardingComplete();
    
    // Navigate to recommendations screen to show personalized results
    router.replace('/recommendations');
  };

  const handleSkip = async () => {
    // Mark onboarding as complete even if skipped
    await markOnboardingComplete();
    
    // Navigate to main app without saving preferences
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OnboardingFlow
        steps={onboardingSteps}
        onComplete={handleComplete}
        onSkip={handleSkip}
        title="Let's Find Your Perfect Car"
        subtitle="Answer a few questions to get personalized recommendations"
      />
    </SafeAreaView>
  );
});

PreferenceStepScreen.displayName = 'PreferenceStepScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default PreferenceStepScreen;
