import React, { memo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { ChevronRight, Check, Minus, Plus } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';

export interface PreferenceOption {
  id: string;
  label: string;
  value: any;
}

interface PreferenceSelectorProps {
  question: string;
  description?: string;
  type: 'radio' | 'multiselect' | 'slider' | 'toggle';
  options?: PreferenceOption[];
  value?: any;
  onChange: (value: any) => void;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (value: number) => string;
  style?: any;
}

const { width } = Dimensions.get('window');

export const PreferenceSelector = memo<PreferenceSelectorProps>(({
  question,
  description,
  type,
  options = [],
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  formatValue = (val: number) => val.toString(),
  style,
}) => {
  const { colors } = useThemeColors();

  const renderRadioOptions = () => (
    <View style={styles.optionsContainer}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.id}
          style={[
            styles.radioOption,
            {
              backgroundColor: value === option.value ? colors.primaryLight : colors.surface,
              borderColor: value === option.value ? colors.primary : colors.border,
            }
          ]}
          onPress={() => onChange(option.value)}
          accessibilityRole="radio"
          accessibilityState={{ checked: value === option.value }}
        >
          <View style={styles.radioContent}>
            <Text style={[
              styles.optionLabel,
              { color: value === option.value ? colors.primary : colors.text }
            ]}>
              {option.label}
            </Text>
            {value === option.value && (
              <Check color={colors.primary} size={20} />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderMultiSelectOptions = () => {
    const selectedValues = Array.isArray(value) ? value : [];
    
    return (
      <View style={styles.optionsContainer}>
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.multiSelectOption,
                {
                  backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                }
              ]}
              onPress={() => {
                const newValues = isSelected
                  ? selectedValues.filter(v => v !== option.value)
                  : [...selectedValues, option.value];
                onChange(newValues);
              }}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
            >
              <View style={styles.multiSelectContent}>
                <Text style={[
                  styles.optionLabel,
                  { color: isSelected ? colors.primary : colors.text }
                ]}>
                  {option.label}
                </Text>
                {isSelected && (
                  <Check color={colors.primary} size={20} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderSlider = () => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderValue, { color: colors.primary }]}>
          {formatValue(value || min)}
        </Text>
      </View>
      
      {/* Custom step-based slider */}
      <View style={styles.stepperContainer}>
        <TouchableOpacity
          style={[styles.stepperButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            const newValue = Math.max(min, (value || min) - step);
            onChange(newValue);
          }}
          disabled={(value || min) <= min}
        >
          <Minus color={(value || min) <= min ? colors.textSecondary : colors.primary} size={20} />
        </TouchableOpacity>
        
        <View style={[styles.valueDisplay, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.valueText, { color: colors.primary }]}>
            {formatValue(value || min)}
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.stepperButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => {
            const newValue = Math.min(max, (value || min) + step);
            onChange(newValue);
          }}
          disabled={(value || min) >= max}
        >
          <Plus color={(value || min) >= max ? colors.textSecondary : colors.primary} size={20} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.sliderLabels}>
        <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
          {formatValue(min)}
        </Text>
        <Text style={[styles.sliderLabel, { color: colors.textSecondary }]}>
          {formatValue(max)}
        </Text>
      </View>
    </View>
  );

  const renderToggle = () => (
    <TouchableOpacity
      style={[
        styles.toggleContainer,
        {
          backgroundColor: value ? colors.primary : colors.border,
        }
      ]}
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: !!value }}
    >
      <View style={[
        styles.toggleKnob,
        {
          backgroundColor: colors.white,
          transform: [{ translateX: value ? 24 : 2 }],
        }
      ]} />
    </TouchableOpacity>
  );

  const renderInput = () => {
    switch (type) {
      case 'radio':
        return renderRadioOptions();
      case 'multiselect':
        return renderMultiSelectOptions();
      case 'slider':
        return renderSlider();
      case 'toggle':
        return renderToggle();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={[styles.question, { color: colors.text }]}>
          {question}
        </Text>
        {description && (
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {description}
          </Text>
        )}
      </View>
      
      <View style={styles.inputContainer}>
        {renderInput()}
      </View>
    </View>
  );
});

PreferenceSelector.displayName = 'PreferenceSelector';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  question: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputContainer: {
    width: '100%',
  },
  optionsContainer: {
    gap: Spacing.md,
  },
  radioOption: {
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    overflow: 'hidden',
  },
  radioContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  multiSelectOption: {
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    overflow: 'hidden',
  },
  multiSelectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  optionLabel: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
  },
  sliderContainer: {
    paddingVertical: Spacing.lg,
  },
  sliderHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sliderValue: {
    ...Typography.h3,
    fontWeight: '700',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginVertical: Spacing.lg,
  },
  stepperButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...ColorsShadows.small,
  },
  valueDisplay: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    minWidth: 80,
    alignItems: 'center',
  },
  valueText: {
    ...Typography.h3,
    fontWeight: '700',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  sliderLabel: {
    ...Typography.caption,
  },
  toggleContainer: {
    width: 52,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  toggleKnob: {
    width: 28,
    height: 28,
    borderRadius: 14,
    ...ColorsShadows.small,
  },
});
