import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { PreferenceSelector, PreferenceOption } from './PreferenceSelector';
import { Button } from './Button';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius } from '@/constants/Colors';

export interface OnboardingStep {
  id: string;
  question: string;
  description?: string;
  type: 'radio' | 'multiselect' | 'slider' | 'toggle';
  options?: PreferenceOption[];
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (value: number) => string;
  required?: boolean;
}

interface OnboardingFlowProps {
  steps: OnboardingStep[];
  onComplete: (preferences: Record<string, any>) => void;
  onSkip?: () => void;
  title?: string;
  subtitle?: string;
  style?: any;
}

const { width } = Dimensions.get('window');

export const OnboardingFlow = memo<OnboardingFlowProps>(({
  steps,
  onComplete,
  onSkip,
  title = "Let's Find Your Perfect Car",
  subtitle = "Answer a few questions to get personalized recommendations",
  style,
}) => {
  const { colors } = useThemeColors();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [preferences, setPreferences] = useState<Record<string, any>>({});
  const [fadeAnim] = useState(new Animated.Value(1));

  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const animateTransition = useCallback((callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(callback, 150);
  }, [fadeAnim]);

  const handleNext = useCallback(() => {
    if (!currentStep) return;

    const currentValue = preferences[currentStep.id];
    
    // Check if required field is filled
    if (currentStep.required && (currentValue === undefined || currentValue === null || currentValue === '')) {
      // You could show an error message here
      return;
    }

    if (isLastStep) {
      onComplete(preferences);
    } else {
      animateTransition(() => {
        setCurrentStepIndex(prev => prev + 1);
      });
    }
  }, [currentStep, preferences, isLastStep, onComplete, animateTransition]);

  const handleBack = useCallback(() => {
    if (isFirstStep) return;
    
    animateTransition(() => {
      setCurrentStepIndex(prev => prev - 1);
    });
  }, [isFirstStep, animateTransition]);

  const handlePreferenceChange = useCallback((value: any) => {
    if (!currentStep) return;
    
    setPreferences(prev => ({
      ...prev,
      [currentStep.id]: value,
    }));
  }, [currentStep]);

  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  if (!currentStep) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }, style]}>
      {/* Header */}
      <View style={styles.header}>
        {/* Progress Bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: colors.primary,
                width: `${progressPercentage}%`,
              }
            ]}
          />
        </View>
        
        {/* Step Counter */}
        <Text style={[styles.stepCounter, { color: colors.textSecondary }]}>
          {currentStepIndex + 1} of {steps.length}
        </Text>
        
        {/* Title */}
        {isFirstStep && (
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              {title}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <PreferenceSelector
          question={currentStep.question}
          description={currentStep.description}
          type={currentStep.type}
          options={currentStep.options}
          value={preferences[currentStep.id]}
          onChange={handlePreferenceChange}
          min={currentStep.min}
          max={currentStep.max}
          step={currentStep.step}
          formatValue={currentStep.formatValue}
        />
      </Animated.View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.navigationButtons}>
          {/* Back Button */}
          <Button
            title="Back"
            onPress={handleBack}
            variant="outline"
            disabled={isFirstStep}
            style={StyleSheet.flatten([styles.backButton, isFirstStep && styles.disabledButton])}
            icon={<ChevronLeft color={isFirstStep ? colors.textSecondary : colors.primary} size={20} />}
          />

          {/* Next/Complete Button */}
          <Button
            title={isLastStep ? "Complete" : "Next"}
            onPress={handleNext}
            style={styles.nextButton}
            icon={
              isLastStep ? 
                <Check color={colors.white} size={20} /> : 
                <ChevronRight color={colors.white} size={20} />
            }
          />
        </View>

        {/* Skip Button */}
        {onSkip && (
          <Button
            title="Skip for now"
            onPress={onSkip}
            variant="ghost"
            style={styles.skipButton}
          />
        )}
      </View>
    </SafeAreaView>
  );
});

OnboardingFlow.displayName = 'OnboardingFlow';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  stepCounter: {
    ...Typography.caption,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: width * 0.8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  actions: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  skipButton: {
    alignSelf: 'center',
  },
});
