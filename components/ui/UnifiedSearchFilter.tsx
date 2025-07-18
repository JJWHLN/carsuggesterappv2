import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ViewStyle,
  TextStyle,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Search, Filter, X, ChevronDown, Check, Settings } from '@/utils/icons';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { BaseFormInput, SearchInput } from '@/components/ui/UnifiedFormComponents';
import { CategoryChip, FilterButton, ViewToggle } from '@/components/ui/SharedComponents';
import { Button } from '@/components/ui/Button';
import { useDebounce } from '@/hooks/useDebounce';

const { width: screenWidth } = Dimensions.get('window');

// Filter types
export interface FilterOption {
  id: string;
  label: string;
  value: any;
  count?: number;
  icon?: React.ReactNode;
  color?: string;
}

export interface FilterCategory {
  id: string;
  label: string;
  type: 'single' | 'multiple' | 'range' | 'toggle';
  options: FilterOption[];
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  unit?: string;
}

export interface SearchFilters {
  searchTerm: string;
  categories: Record<string, any>;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
}

export interface UnifiedSearchFilterProps {
  // Search configuration
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  enableSearch?: boolean;
  
  // Filter configuration
  filterCategories?: FilterCategory[];
  activeFilters?: Partial<SearchFilters>;
  onFiltersChange?: (filters: Partial<SearchFilters>) => void;
  enableFilters?: boolean;
  
  // Sort configuration
  sortOptions?: FilterOption[];
  enableSort?: boolean;
  
  // View mode configuration
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
  enableViewToggle?: boolean;
  
  // Quick filters
  quickFilters?: FilterOption[];
  enableQuickFilters?: boolean;
  
  // Results summary
  resultsCount?: number;
  resultsLabel?: string;
  showResultsCount?: boolean;
  
  // UI customization
  variant?: 'compact' | 'expanded' | 'floating';
  showClearAll?: boolean;
  containerStyle?: ViewStyle;
  
  // Callbacks
  onClearAll?: () => void;
  onFilterModalOpen?: () => void;
  onFilterModalClose?: () => void;
}

export const UnifiedSearchFilter: React.FC<UnifiedSearchFilterProps> = ({
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  enableSearch = true,
  
  filterCategories = [],
  activeFilters = {},
  onFiltersChange,
  enableFilters = true,
  
  sortOptions = [],
  enableSort = true,
  
  viewMode = 'grid',
  onViewModeChange,
  enableViewToggle = true,
  
  quickFilters = [],
  enableQuickFilters = true,
  
  resultsCount = 0,
  resultsLabel = 'items',
  showResultsCount = true,
  
  variant = 'expanded',
  showClearAll = true,
  containerStyle,
  
  onClearAll,
  onFilterModalOpen,
  onFilterModalClose,
}) => {
  const { colors, layout, buttons, spacing } = useDesignTokens();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [localFilters, setLocalFilters] = useState<Partial<SearchFilters>>(activeFilters);
  const [searchTerm, setSearchTerm] = useState(searchValue);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Handle search changes
  useEffect(() => {
    if (onSearchChange && debouncedSearchTerm !== searchValue) {
      onSearchChange(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, onSearchChange, searchValue]);

  // Handle filter changes
  const handleFilterChange = useCallback((categoryId: string, value: any) => {
    const newFilters = {
      ...localFilters,
      categories: {
        ...localFilters.categories,
        [categoryId]: value,
      },
    };
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [localFilters, onFiltersChange]);

  // Handle quick filter selection
  const handleQuickFilterPress = useCallback((filter: FilterOption) => {
    const newFilters = {
      ...localFilters,
      categories: {
        ...localFilters.categories,
        [filter.id]: filter.value,
      },
    };
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [localFilters, onFiltersChange]);

  // Handle clear all
  const handleClearAll = useCallback(() => {
    const clearedFilters = {
      searchTerm: '',
      categories: {},
      sortBy: '',
      sortOrder: 'asc' as const,
      viewMode: viewMode,
    };
    setLocalFilters(clearedFilters);
    setSearchTerm('');
    onFiltersChange?.(clearedFilters);
    onClearAll?.();
  }, [viewMode, onFiltersChange, onClearAll]);

  // Handle sort change
  const handleSortChange = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    const newFilters = {
      ...localFilters,
      sortBy,
      sortOrder,
    };
    setLocalFilters(newFilters);
    onFiltersChange?.(newFilters);
  }, [localFilters, onFiltersChange]);

  // Filter modal animations
  const openFilterModal = useCallback(() => {
    setShowFilterModal(true);
    onFilterModalOpen?.();
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [slideAnim, onFilterModalOpen]);

  const closeFilterModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowFilterModal(false);
      onFilterModalClose?.();
    });
  }, [slideAnim, onFilterModalClose]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (localFilters.categories) {
      Object.values(localFilters.categories).forEach(value => {
        if (value && (Array.isArray(value) ? value.length > 0 : true)) {
          count++;
        }
      });
    }
    return count;
  }, [localFilters.categories]);

  // Render filter category
  const renderFilterCategory = (category: FilterCategory) => {
    const activeValue = localFilters.categories?.[category.id];

    switch (category.type) {
      case 'single':
        return (
          <View key={category.id} style={styles.filterCategory}>
            <Text style={[styles.filterCategoryLabel, { color: colors.text }]}>
              {category.label}
            </Text>
            <View style={styles.filterOptions}>
              {category.options.map((option) => (
                <CategoryChip
                  key={option.id}
                  text={option.label}
                  isActive={activeValue === option.value}
                  onPress={() => handleFilterChange(category.id, option.value)}
                />
              ))}
            </View>
          </View>
        );

      case 'multiple':
        return (
          <View key={category.id} style={styles.filterCategory}>
            <Text style={[styles.filterCategoryLabel, { color: colors.text }]}>
              {category.label}
            </Text>
            <View style={styles.filterOptions}>
              {category.options.map((option) => {
                const isSelected = Array.isArray(activeValue) && activeValue.includes(option.value);
                return (
                  <CategoryChip
                    key={option.id}
                    text={option.label}
                    isActive={isSelected}
                    onPress={() => {
                      const currentValues = Array.isArray(activeValue) ? activeValue : [];
                      const newValues = isSelected
                        ? currentValues.filter(v => v !== option.value)
                        : [...currentValues, option.value];
                      handleFilterChange(category.id, newValues);
                    }}
                  />
                );
              })}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  // Render main search bar
  const renderSearchBar = () => {
    if (!enableSearch) return null;

    return (
      <View style={styles.searchContainer}>
        <SearchInput
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChangeText={setSearchTerm}
          onClear={() => setSearchTerm('')}
          containerStyle={styles.searchInput}
        />
      </View>
    );
  };

  // Render filter controls
  const renderFilterControls = () => {
    if (variant === 'compact') {
      return (
        <View style={[styles.compactControls, layout.row]}>
          {enableFilters && (
            <TouchableOpacity
              style={[styles.compactButton, { backgroundColor: colors.surface }]}
              onPress={openFilterModal}
            >
              <Settings color={colors.text} size={18} />
              {activeFilterCount > 0 && (
                <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.filterBadgeText, { color: colors.white }]}>
                    {activeFilterCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          
          {enableViewToggle && onViewModeChange && (
            <ViewToggle
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
            />
          )}
        </View>
      );
    }

    return (
      <View style={styles.filterControls}>
        {enableFilters && (
          <FilterButton
            text={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
            onPress={openFilterModal}
            icon={<Filter color={colors.text} size={16} />}
            isActive={activeFilterCount > 0}
          />
        )}
        
        {enableSort && sortOptions.length > 0 && (
          <FilterButton
            text="Sort"
            onPress={() => {}} // TODO: Implement sort dropdown
            icon={<ChevronDown color={colors.text} size={16} />}
          />
        )}
        
        {enableViewToggle && onViewModeChange && (
          <ViewToggle
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        )}
      </View>
    );
  };

  // Render quick filters
  const renderQuickFilters = () => {
    if (!enableQuickFilters || quickFilters.length === 0) return null;

    return (
      <View style={styles.quickFiltersContainer}>
        <Text style={[styles.quickFiltersLabel, { color: colors.text }]}>
          Quick Filters
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFiltersContent}
        >
          {quickFilters.map((filter) => (
            <CategoryChip
              key={filter.id}
              text={filter.label}
              isActive={localFilters.categories?.[filter.id] === filter.value}
              onPress={() => handleQuickFilterPress(filter)}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render results header
  const renderResultsHeader = () => {
    if (!showResultsCount) return null;

    return (
      <View style={[styles.resultsHeader, layout.rowSpaced]}>
        <Text style={[styles.resultsCount, { color: colors.text }]}>
          {resultsCount} {resultsLabel}
        </Text>
        {showClearAll && (activeFilterCount > 0 || searchTerm) && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={[styles.clearAllText, { color: colors.primary }]}>
              Clear All
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render filter modal
  const renderFilterModal = () => {
    if (!showFilterModal) return null;

    return (
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={closeFilterModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [screenWidth, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filters
              </Text>
              <TouchableOpacity onPress={closeFilterModal}>
                <X color={colors.text} size={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {filterCategories.map(renderFilterCategory)}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <Button
                title="Clear All"
                onPress={handleClearAll}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                title="Apply Filters"
                onPress={closeFilterModal}
                style={styles.modalButton}
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {renderSearchBar()}
      {renderFilterControls()}
      {renderQuickFilters()}
      {renderResultsHeader()}
      {renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    marginBottom: 0,
  },
  filterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  compactControls: {
    gap: 8,
    marginBottom: 12,
  },
  compactButton: {
    padding: 8,
    borderRadius: 8,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  quickFiltersContainer: {
    marginBottom: 12,
  },
  quickFiltersLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  quickFiltersContent: {
    paddingRight: 16,
  },
  resultsHeader: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  filterCategory: {
    marginBottom: 24,
  },
  filterCategoryLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});

// Utility hooks for search and filter state management
export const useSearchFilters = (initialFilters: Partial<SearchFilters> = {}) => {
  const [filters, setFilters] = useState<Partial<SearchFilters>>(initialFilters);
  const [searchTerm, setSearchTerm] = useState(initialFilters.searchTerm || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchTerm(initialFilters.searchTerm || '');
  }, [initialFilters]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters.categories || {}).some(value => 
      value && (Array.isArray(value) ? value.length > 0 : true)
    ) || debouncedSearchTerm.length > 0;
  }, [filters.categories, debouncedSearchTerm]);

  return {
    filters,
    searchTerm,
    debouncedSearchTerm,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    setSearchTerm,
  };
};

export default UnifiedSearchFilter;
