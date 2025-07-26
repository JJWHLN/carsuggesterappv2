import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  Switch,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Save,
  Sliders,
  Check,
  Star,
} from '@/utils/ultra-optimized-icons';
import { useThemeColors } from '@/hooks/useTheme';
import {
  currentColors,
  BorderRadius,
  Spacing,
  Typography,
  Shadows,
} from '@/constants/Colors';
import { usePerformanceMonitor } from '../../src/utils/performance';

const { width, height } = Dimensions.get('window');

// Types
interface FilterOption {
  id: string;
  label: string;
  value: any;
  count?: number;
}

interface RangeFilter {
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

interface BaseFilterConfig {
  id: string;
  title: string;
  type: 'single' | 'multi' | 'range' | 'toggle' | 'text';
  required?: boolean;
  visible?: boolean;
}

interface SingleSelectFilter extends BaseFilterConfig {
  type: 'single';
  options: FilterOption[];
  defaultValue?: string;
}

interface MultiSelectFilter extends BaseFilterConfig {
  type: 'multi';
  options: FilterOption[];
  defaultValue?: string[];
  maxSelections?: number;
}

interface RangeFilterConfig extends BaseFilterConfig {
  type: 'range';
  range: RangeFilter;
  defaultValue?: [number, number];
}

interface ToggleFilter extends BaseFilterConfig {
  type: 'toggle';
  defaultValue?: boolean;
}

interface TextFilter extends BaseFilterConfig {
  type: 'text';
  placeholder?: string;
  defaultValue?: string;
}

type FilterConfig =
  | SingleSelectFilter
  | MultiSelectFilter
  | RangeFilterConfig
  | ToggleFilter
  | TextFilter;

interface FilterValues {
  [key: string]: any;
}

interface FilterPreset {
  id: string;
  name: string;
  values: FilterValues;
  icon?: string;
}

type FilterPanelVariant = 'modal' | 'bottom-sheet' | 'inline' | 'sidebar';

interface UnifiedFilterPanelProps {
  // Configuration
  variant?: FilterPanelVariant;
  filters: FilterConfig[];
  values: FilterValues;
  onValuesChange: (values: FilterValues) => void;

  // Visibility
  visible?: boolean;
  onClose?: () => void;

  // Presets
  presets?: FilterPreset[];
  onSavePreset?: (name: string, values: FilterValues) => void;
  onLoadPreset?: (preset: FilterPreset) => void;

  // Actions
  onApply?: (values: FilterValues) => void;
  onClear?: () => void;
  onReset?: () => void;

  // UI Configuration
  showPresets?: boolean;
  showApplyButton?: boolean;
  showClearButton?: boolean;
  showHeader?: boolean;
  title?: string;

  // Styling
  style?: any;

  // Performance
  enableLazyLoading?: boolean;
  maxInitialFilters?: number;
}

export const UnifiedFilterPanel: React.FC<UnifiedFilterPanelProps> = React.memo(
  ({
    variant = 'modal',
    filters,
    values,
    onValuesChange,
    visible = true,
    onClose,
    presets = [],
    onSavePreset,
    onLoadPreset,
    onApply,
    onClear,
    onReset,
    showPresets = true,
    showApplyButton = true,
    showClearButton = true,
    showHeader = true,
    title = 'Filters',
    style,
    enableLazyLoading = false,
    maxInitialFilters = 5,
  }) => {
    const { colors } = useThemeColors();
    const { trackMetric } = usePerformanceMonitor();

    // State
    const [expandedSections, setExpandedSections] = useState<Set<string>>(
      new Set(),
    );
    const [showPresetInput, setShowPresetInput] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [localValues, setLocalValues] = useState<FilterValues>(values);
    const [visibleFilters, setVisibleFilters] = useState<FilterConfig[]>(
      enableLazyLoading ? filters.slice(0, maxInitialFilters) : filters,
    );

    // Animations
    const slideAnim = useRef(
      new Animated.Value(variant === 'bottom-sheet' ? height : 0),
    ).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    // Load more filters for lazy loading
    const loadMoreFilters = useCallback(() => {
      if (enableLazyLoading && visibleFilters.length < filters.length) {
        const nextBatch = filters.slice(
          visibleFilters.length,
          visibleFilters.length + maxInitialFilters,
        );
        setVisibleFilters((prev) => [...prev, ...nextBatch]);
        trackMetric('filters_loaded', nextBatch.length);
      }
    }, [
      enableLazyLoading,
      visibleFilters.length,
      filters,
      maxInitialFilters,
      trackMetric,
    ]);

    // Animation effects
    React.useEffect(() => {
      if (visible) {
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: variant === 'bottom-sheet' ? height : -height,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [visible, slideAnim, opacityAnim, variant]);

    // Handlers
    const toggleSection = useCallback(
      (sectionId: string) => {
        setExpandedSections((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(sectionId)) {
            newSet.delete(sectionId);
          } else {
            newSet.add(sectionId);
          }
          trackMetric('filter_section_toggled', 1, undefined, {
            section_id: sectionId,
            expanded: !prev.has(sectionId),
          });
          return newSet;
        });
      },
      [trackMetric],
    );

    const handleValueChange = useCallback(
      (filterId: string, value: any) => {
        const newValues = { ...localValues, [filterId]: value };
        setLocalValues(newValues);
        onValuesChange(newValues);
        trackMetric('filter_changed', 1, undefined, {
          filter_id: filterId,
          filter_type: filters.find((f) => f.id === filterId)?.type,
        });
      },
      [localValues, onValuesChange, filters, trackMetric],
    );

    const handleClear = useCallback(() => {
      const clearedValues: FilterValues = {};
      filters.forEach((filter) => {
        switch (filter.type) {
          case 'multi':
            clearedValues[filter.id] = [];
            break;
          case 'range':
            clearedValues[filter.id] = [filter.range.min, filter.range.max];
            break;
          case 'toggle':
            clearedValues[filter.id] = false;
            break;
          default:
            clearedValues[filter.id] = '';
        }
      });
      setLocalValues(clearedValues);
      onValuesChange(clearedValues);
      if (onClear) onClear();
      trackMetric('filters_cleared', 1);
    }, [filters, onValuesChange, onClear, trackMetric]);

    const handleApply = useCallback(() => {
      if (onApply) onApply(localValues);
      if (onClose) onClose();
      trackMetric('filters_applied', 1, undefined, {
        filter_count: Object.keys(localValues).length,
      });
    }, [localValues, onApply, onClose, trackMetric]);

    const handleSavePreset = useCallback(() => {
      if (presetName.trim() && onSavePreset) {
        onSavePreset(presetName.trim(), localValues);
        setPresetName('');
        setShowPresetInput(false);
        trackMetric('preset_saved', 1, undefined, {
          preset_name: presetName.trim(),
        });
      }
    }, [presetName, onSavePreset, localValues, trackMetric]);

    const handleLoadPreset = useCallback(
      (preset: FilterPreset) => {
        setLocalValues(preset.values);
        onValuesChange(preset.values);
        trackMetric('preset_loaded', 1, undefined, { preset_id: preset.id });
      },
      [onValuesChange, trackMetric],
    );

    // Render individual filter components
    const renderFilter = useCallback(
      (filter: FilterConfig) => {
        const currentValue = localValues[filter.id];
        const isExpanded = expandedSections.has(filter.id);

        const FilterHeader = (
          <TouchableOpacity
            style={styles.filterHeader}
            onPress={() => toggleSection(filter.id)}
          >
            <Text style={[styles.filterTitle, { color: colors.text }]}>
              {filter.title}
            </Text>
            {isExpanded ? (
              <ChevronUp size={20} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={20} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        );

        if (!isExpanded) {
          return (
            <View key={filter.id} style={styles.filterContainer}>
              {FilterHeader}
            </View>
          );
        }

        const FilterContent = () => {
          switch (filter.type) {
            case 'single':
              return (
                <View style={styles.optionsContainer}>
                  {filter.options.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      style={[
                        styles.optionItem,
                        currentValue === option.value &&
                          styles.optionItemSelected,
                      ]}
                      onPress={() => handleValueChange(filter.id, option.value)}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          {
                            color:
                              currentValue === option.value
                                ? colors.primary
                                : colors.text,
                          },
                        ]}
                      >
                        {option.label}
                      </Text>
                      {option.count && (
                        <Text
                          style={[
                            styles.optionCount,
                            { color: colors.textMuted },
                          ]}
                        >
                          ({option.count})
                        </Text>
                      )}
                      {currentValue === option.value && (
                        <Check size={16} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              );

            case 'multi':
              const selectedValues = currentValue || [];
              return (
                <View style={styles.optionsContainer}>
                  {filter.options.map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[
                          styles.optionItem,
                          isSelected && styles.optionItemSelected,
                        ]}
                        onPress={() => {
                          const newSelection = isSelected
                            ? selectedValues.filter((v) => v !== option.value)
                            : [...selectedValues, option.value];
                          handleValueChange(filter.id, newSelection);
                        }}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            {
                              color: isSelected ? colors.primary : colors.text,
                            },
                          ]}
                        >
                          {option.label}
                        </Text>
                        {option.count && (
                          <Text
                            style={[
                              styles.optionCount,
                              { color: colors.textMuted },
                            ]}
                          >
                            ({option.count})
                          </Text>
                        )}
                        {isSelected && (
                          <Check size={16} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );

            case 'range':
              const [min, max] = currentValue || [
                filter.range.min,
                filter.range.max,
              ];
              return (
                <View style={styles.rangeContainer}>
                  <View style={styles.rangeInputs}>
                    <TextInput
                      style={[
                        styles.rangeInput,
                        { color: colors.text, borderColor: colors.border },
                      ]}
                      value={min.toString()}
                      onChangeText={(text) => {
                        const value = parseInt(text) || filter.range.min;
                        handleValueChange(filter.id, [value, max]);
                      }}
                      keyboardType="numeric"
                      placeholder={filter.range.min.toString()}
                    />
                    <Text
                      style={[
                        styles.rangeSeparator,
                        { color: colors.textSecondary },
                      ]}
                    >
                      to
                    </Text>
                    <TextInput
                      style={[
                        styles.rangeInput,
                        { color: colors.text, borderColor: colors.border },
                      ]}
                      value={max.toString()}
                      onChangeText={(text) => {
                        const value = parseInt(text) || filter.range.max;
                        handleValueChange(filter.id, [min, value]);
                      }}
                      keyboardType="numeric"
                      placeholder={filter.range.max.toString()}
                    />
                  </View>
                  {filter.range.unit && (
                    <Text
                      style={[styles.rangeUnit, { color: colors.textMuted }]}
                    >
                      {filter.range.unit}
                    </Text>
                  )}
                </View>
              );

            case 'toggle':
              return (
                <View style={styles.toggleContainer}>
                  <Switch
                    value={currentValue || false}
                    onValueChange={(value) =>
                      handleValueChange(filter.id, value)
                    }
                    trackColor={{
                      false: colors.neutral300,
                      true: colors.primaryLight,
                    }}
                    thumbColor={
                      currentValue ? colors.primary : colors.neutral400
                    }
                  />
                </View>
              );

            case 'text':
              return (
                <TextInput
                  style={[
                    styles.textInput,
                    { color: colors.text, borderColor: colors.border },
                  ]}
                  value={currentValue || ''}
                  onChangeText={(text) => handleValueChange(filter.id, text)}
                  placeholder={
                    filter.placeholder || `Enter ${filter.title.toLowerCase()}`
                  }
                  placeholderTextColor={colors.textMuted}
                />
              );

            default:
              return null;
          }
        };

        return (
          <View key={filter.id} style={styles.filterContainer}>
            {FilterHeader}
            <View style={styles.filterContent}>
              <FilterContent />
            </View>
          </View>
        );
      },
      [localValues, expandedSections, colors, toggleSection, handleValueChange],
    );

    // Memoized preset section
    const PresetSection = useMemo(() => {
      if (!showPresets) return null;

      return (
        <View style={styles.presetSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Saved Filters
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {presets.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[
                  styles.presetChip,
                  { backgroundColor: colors.primaryLight },
                ]}
                onPress={() => handleLoadPreset(preset)}
              >
                <Text style={[styles.presetText, { color: colors.primary }]}>
                  {preset.name}
                </Text>
              </TouchableOpacity>
            ))}
            {onSavePreset && (
              <TouchableOpacity
                style={[
                  styles.presetChip,
                  styles.savePresetChip,
                  { borderColor: colors.border },
                ]}
                onPress={() => setShowPresetInput(true)}
              >
                <Save size={16} color={colors.textSecondary} />
                <Text
                  style={[styles.presetText, { color: colors.textSecondary }]}
                >
                  Save Current
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {showPresetInput && (
            <View style={styles.presetInputContainer}>
              <TextInput
                style={[
                  styles.presetInput,
                  { color: colors.text, borderColor: colors.border },
                ]}
                value={presetName}
                onChangeText={setPresetName}
                placeholder="Enter preset name"
                placeholderTextColor={colors.textMuted}
                autoFocus
              />
              <TouchableOpacity
                style={[
                  styles.savePresetButton,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleSavePreset}
              >
                <Text
                  style={[styles.savePresetButtonText, { color: colors.white }]}
                >
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }, [
      showPresets,
      presets,
      colors,
      handleLoadPreset,
      onSavePreset,
      showPresetInput,
      presetName,
      handleSavePreset,
    ]);

    // Memoized action buttons
    const ActionButtons = useMemo(() => {
      const appliedCount = Object.keys(localValues).filter((key) => {
        const value = localValues[key];
        return (
          value &&
          ((Array.isArray(value) && value.length > 0) ||
            (typeof value === 'string' && value.trim() !== '') ||
            (typeof value === 'boolean' && value) ||
            typeof value === 'number')
        );
      }).length;

      return (
        <View style={styles.actionButtons}>
          {showClearButton && (
            <TouchableOpacity
              style={[styles.clearButton, { borderColor: colors.border }]}
              onPress={handleClear}
            >
              <Text
                style={[
                  styles.clearButtonText,
                  { color: colors.textSecondary },
                ]}
              >
                Clear All
              </Text>
            </TouchableOpacity>
          )}

          {showApplyButton && (
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
            >
              <Text style={[styles.applyButtonText, { color: colors.white }]}>
                Apply{appliedCount > 0 ? ` (${appliedCount})` : ''}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }, [
      localValues,
      colors,
      showClearButton,
      showApplyButton,
      handleClear,
      handleApply,
    ]);

    // Content component
    const FilterContent = (
      <View style={[styles.container, style]}>
        {showHeader && (
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            {onClose && (
              <TouchableOpacity onPress={onClose}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {PresetSection}

        <ScrollView
          style={styles.filtersScroll}
          showsVerticalScrollIndicator={false}
          onScroll={({ nativeEvent }) => {
            // Load more filters when near bottom
            if (
              enableLazyLoading &&
              nativeEvent.contentOffset.y >
                nativeEvent.contentSize.height -
                  nativeEvent.layoutMeasurement.height -
                  100
            ) {
              loadMoreFilters();
            }
          }}
          scrollEventThrottle={400}
        >
          {visibleFilters.map(renderFilter)}
        </ScrollView>

        {ActionButtons}
      </View>
    );

    // Render based on variant
    switch (variant) {
      case 'modal':
        return (
          <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
          >
            <View style={styles.modalOverlay}>
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: colors.surface,
                    opacity: opacityAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {FilterContent}
              </Animated.View>
            </View>
          </Modal>
        );

      case 'bottom-sheet':
        if (!visible) return null;
        return (
          <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
          >
            <View style={styles.bottomSheetOverlay}>
              <Pressable style={styles.bottomSheetBackdrop} onPress={onClose} />
              <Animated.View
                style={[
                  styles.bottomSheetContent,
                  {
                    backgroundColor: colors.surface,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                {FilterContent}
              </Animated.View>
            </View>
          </Modal>
        );

      case 'inline':
      case 'sidebar':
      default:
        if (!visible) return null;
        return (
          <View
            style={[
              styles.inlineContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            {FilterContent}
          </View>
        );
    }
  },
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: height * 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    ...Shadows.lg,
  },
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheetBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: height * 0.8,
  },
  inlineContainer: {
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: currentColors.border,
  },
  title: {
    fontSize: Typography.h2.fontSize,
    fontWeight: '600',
  },
  presetSection: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: currentColors.border,
  },
  sectionTitle: {
    fontSize: Typography.subtitle.fontSize,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  presetChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  savePresetChip: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  presetText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '500',
  },
  presetInputContainer: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  presetInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.body.fontSize,
  },
  savePresetButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
  },
  savePresetButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
  },
  filtersScroll: {
    flex: 1,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: currentColors.border,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  filterTitle: {
    fontSize: Typography.subtitle.fontSize,
    fontWeight: '600',
  },
  filterContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  optionsContainer: {
    gap: Spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  optionItemSelected: {
    backgroundColor: currentColors.primaryLight,
  },
  optionText: {
    fontSize: Typography.body.fontSize,
    flex: 1,
  },
  optionCount: {
    fontSize: Typography.caption.fontSize,
    marginHorizontal: Spacing.sm,
  },
  rangeContainer: {
    gap: Spacing.sm,
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  rangeInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.body.fontSize,
    textAlign: 'center',
  },
  rangeSeparator: {
    fontSize: Typography.body.fontSize,
  },
  rangeUnit: {
    fontSize: Typography.caption.fontSize,
    textAlign: 'center',
  },
  toggleContainer: {
    alignItems: 'flex-start',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.body.fontSize,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: currentColors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
  },
});

UnifiedFilterPanel.displayName = 'UnifiedFilterPanel';

export { UnifiedFilterPanel as FilterPanel };
export default UnifiedFilterPanel;
