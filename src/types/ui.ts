/**
 * 🎨 UI Component Types & Props
 * All component prop interfaces and UI-related types
 */

import type { ReactNode, ComponentType } from 'react';
import type {
  ViewStyle,
  TextStyle,
  ImageStyle,
  StyleProp,
  TouchableOpacityProps,
  TextInputProps,
  ScrollViewProps,
  FlatListProps,
  SectionListProps,
  ModalProps as RNModalProps,
  Animated,
} from 'react-native';
import type { Car, CarFilters, CarComparison } from './models';
import type { User } from './user';

// ===== BASE COMPONENT TYPES =====

// Common props that many components share
export interface BaseComponentProps {
  readonly testID?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly children?: ReactNode;
}

// Themed component props
export interface ThemedComponentProps extends BaseComponentProps {
  readonly theme?: ThemeVariant;
  readonly variant?: ComponentVariant;
}

// Interactive component props
export interface InteractiveComponentProps extends ThemedComponentProps {
  readonly disabled?: boolean;
  readonly loading?: boolean;
  readonly onPress?: () => void;
  readonly onLongPress?: () => void;
}

// ===== THEME & STYLING TYPES =====

export type ThemeVariant = 'light' | 'dark' | 'auto';

export type ComponentVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'ghost'
  | 'outline';

export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type BorderRadius = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export type Shadow = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Design system tokens
export interface DesignTokens {
  readonly colors: ColorTokens;
  readonly typography: TypographyTokens;
  readonly spacing: SpacingTokens;
  readonly breakpoints: BreakpointTokens;
  readonly shadows: ShadowTokens;
  readonly borderRadius: BorderRadiusTokens;
}

export interface ColorTokens {
  readonly primary: string;
  readonly primaryLight: string;
  readonly primaryDark: string;
  readonly secondary: string;
  readonly success: string;
  readonly warning: string;
  readonly error: string;
  readonly info: string;
  readonly background: string;
  readonly surface: string;
  readonly text: string;
  readonly textSecondary: string;
  readonly textMuted: string;
  readonly border: string;
  readonly borderLight: string;
  readonly shadow: string;
}

export interface TypographyTokens {
  readonly fonts: {
    readonly primary: string;
    readonly secondary: string;
    readonly mono: string;
  };
  readonly sizes: {
    readonly xs: number;
    readonly sm: number;
    readonly md: number;
    readonly lg: number;
    readonly xl: number;
    readonly xxl: number;
  };
  readonly weights: {
    readonly light: '300';
    readonly normal: '400';
    readonly medium: '500';
    readonly semibold: '600';
    readonly bold: '700';
  };
  readonly lineHeights: {
    readonly tight: number;
    readonly normal: number;
    readonly relaxed: number;
  };
}

export interface SpacingTokens {
  readonly xs: number;
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
  readonly xxl: number;
}

export interface BreakpointTokens {
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
}

export interface ShadowTokens {
  readonly xs: ViewStyle;
  readonly sm: ViewStyle;
  readonly md: ViewStyle;
  readonly lg: ViewStyle;
  readonly xl: ViewStyle;
}

export interface BorderRadiusTokens {
  readonly xs: number;
  readonly sm: number;
  readonly md: number;
  readonly lg: number;
  readonly xl: number;
  readonly full: number;
}

// ===== BUTTON COMPONENTS =====

export interface ButtonProps extends InteractiveComponentProps {
  readonly title: string;
  readonly icon?: ComponentType<IconProps>;
  readonly iconPosition?: 'left' | 'right';
  readonly size?: ComponentSize;
  readonly fullWidth?: boolean;
  readonly rounded?: boolean;
  readonly hapticFeedback?: boolean;
  readonly accessibilityLabel?: string;
  readonly accessibilityHint?: string;
}

export interface IconButtonProps extends Omit<ButtonProps, 'title'> {
  readonly icon: ComponentType<IconProps>;
  readonly iconSize?: number;
}

export interface FABProps extends IconButtonProps {
  readonly position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  readonly offset?: { x: number; y: number };
}

// ===== INPUT COMPONENTS =====

export interface InputProps
  extends Omit<TextInputProps, 'style' | 'children' | 'testID'> {
  readonly testID?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly theme?: ThemeVariant;
  readonly variant?: ComponentVariant;
  readonly label?: string;
  readonly placeholder?: string;
  readonly helperText?: string;
  readonly errorText?: string;
  readonly leftIcon?: ComponentType<IconProps>;
  readonly rightIcon?: ComponentType<IconProps>;
  readonly onLeftIconPress?: () => void;
  readonly onRightIconPress?: () => void;
  readonly size?: ComponentSize;
  readonly inputStyle?: StyleProp<TextStyle>;
}

export interface SearchBarProps extends Omit<InputProps, 'leftIcon'> {
  readonly onSearch: (query: string) => void;
  readonly onClear?: () => void;
  readonly showClearButton?: boolean;
  readonly showFilterButton?: boolean;
  readonly onFilterPress?: () => void;
  readonly debounceMs?: number;
  readonly suggestions?: readonly string[];
  readonly onSuggestionPress?: (suggestion: string) => void;
}

export interface FilterChipProps extends InteractiveComponentProps {
  readonly label: string;
  readonly active?: boolean;
  readonly removable?: boolean;
  readonly onRemove?: () => void;
  readonly count?: number;
}

// ===== CARD COMPONENTS =====

export interface CardProps extends ThemedComponentProps {
  readonly elevated?: boolean;
  readonly bordered?: boolean;
  readonly pressable?: boolean;
  readonly onPress?: () => void;
  readonly header?: ReactNode;
  readonly footer?: ReactNode;
  readonly padding?: ComponentSize;
}

export interface CarCardProps extends Omit<CardProps, 'variant'> {
  readonly car: Car;
  readonly variant?: 'compact' | 'standard' | 'detailed' | 'comparison';
  readonly showSaveButton?: boolean;
  readonly showCompareButton?: boolean;
  readonly showContactButton?: boolean;
  readonly onSave?: (carId: string) => void;
  readonly onCompare?: (carId: string) => void;
  readonly onContact?: (carId: string) => void;
  readonly isSaved?: boolean;
  readonly isComparing?: boolean;
  readonly priority?: 'high' | 'normal' | 'low';
  readonly index?: number;
  readonly viewportHeight?: number;
}

// ===== LIST COMPONENTS =====

export interface EmptyStateProps extends ThemedComponentProps {
  readonly title: string;
  readonly message?: string;
  readonly icon?: ComponentType<IconProps>;
  readonly illustration?: ComponentType;
  readonly action?: {
    readonly label: string;
    readonly onPress: () => void;
  };
}

export interface LoadingStateProps extends ThemedComponentProps {
  readonly message?: string;
  readonly size?: ComponentSize;
}

export interface ErrorStateProps extends ThemedComponentProps {
  readonly title: string;
  readonly message?: string;
  readonly showRetry?: boolean;
  readonly onRetry?: () => void;
  readonly retryLabel?: string;
}

export interface PullToRefreshProps {
  readonly refreshing: boolean;
  readonly onRefresh: () => void;
  readonly tintColor?: string;
  readonly title?: string;
}

export interface InfiniteScrollProps {
  readonly hasMore: boolean;
  readonly loading: boolean;
  readonly onLoadMore: () => void;
  readonly threshold?: number;
  readonly loadingComponent?: ComponentType;
}

// ===== MODAL & OVERLAY COMPONENTS =====

export interface ModalProps extends Omit<RNModalProps, 'children' | 'style'> {
  readonly testID?: string;
  readonly style?: StyleProp<ViewStyle>;
  readonly children?: ReactNode;
  readonly theme?: ThemeVariant;
  readonly variant?: ComponentVariant;
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly title?: string;
  readonly subtitle?: string;
  readonly size?: 'small' | 'medium' | 'large' | 'fullscreen';
  readonly showCloseButton?: boolean;
  readonly closeOnBackdrop?: boolean;
  readonly closeOnBackPress?: boolean;
  readonly header?: ReactNode;
  readonly footer?: ReactNode;
}

export interface BottomSheetProps extends ModalProps {
  readonly snapPoints?: readonly string[];
  readonly initialSnapIndex?: number;
  readonly enableDismissOnClose?: boolean;
  readonly enableHandlePanningGesture?: boolean;
  readonly enableContentPanningGesture?: boolean;
}

export interface TooltipProps extends ThemedComponentProps {
  readonly content: string;
  readonly placement?: 'top' | 'bottom' | 'left' | 'right';
  readonly visible?: boolean;
  readonly onVisibilityChange?: (visible: boolean) => void;
  readonly trigger?: 'press' | 'longPress' | 'hover';
}

// ===== NAVIGATION COMPONENTS =====

export interface TabBarProps extends ThemedComponentProps {
  readonly tabs: readonly TabItem[];
  readonly activeTab: string;
  readonly onTabPress: (tabId: string) => void;
  readonly showBadges?: boolean;
  readonly scrollable?: boolean;
}

export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: ComponentType<IconProps>;
  readonly badge?: number | string;
  readonly disabled?: boolean;
}

export interface BreadcrumbProps extends ThemedComponentProps {
  readonly items: readonly BreadcrumbItem[];
  readonly onItemPress?: (item: BreadcrumbItem) => void;
  readonly separator?: ReactNode;
  readonly maxItems?: number;
}

export interface BreadcrumbItem {
  readonly id: string;
  readonly label: string;
  readonly href?: string;
  readonly disabled?: boolean;
}

// ===== CAR-SPECIFIC COMPONENTS =====

export interface CarFiltersProps extends ThemedComponentProps {
  readonly filters: CarFilters;
  readonly onFiltersChange: (filters: CarFilters) => void;
  readonly availableMakes?: readonly string[];
  readonly availableModels?: readonly string[];
  readonly priceRange?: { min: number; max: number };
  readonly yearRange?: { min: number; max: number };
  readonly showAdvancedFilters?: boolean;
  readonly onReset?: () => void;
}

export interface CarComparisonProps extends ThemedComponentProps {
  readonly comparison: CarComparison;
  readonly onRemoveCar?: (carId: string) => void;
  readonly onAddCar?: () => void;
  readonly maxCars?: number;
  readonly showScores?: boolean;
  readonly showProsAndCons?: boolean;
}

export interface CarDetailsProps extends ThemedComponentProps {
  readonly car: Car;
  readonly user?: User;
  readonly onSave?: () => void;
  readonly onShare?: () => void;
  readonly onContact?: () => void;
  readonly onScheduleTestDrive?: () => void;
  readonly isSaved?: boolean;
  readonly showActions?: boolean;
  readonly showSimilarCars?: boolean;
}

export interface CarGalleryProps extends ThemedComponentProps {
  readonly images: readonly string[];
  readonly initialIndex?: number;
  readonly onImagePress?: (index: number) => void;
  readonly showThumbnails?: boolean;
  readonly autoPlay?: boolean;
  readonly autoPlayInterval?: number;
  readonly showIndicators?: boolean;
}

// ===== FORM COMPONENTS =====

export interface FormProps extends ThemedComponentProps {
  readonly onSubmit: (data: Record<string, unknown>) => void;
  readonly validation?: ValidationSchema;
  readonly initialValues?: Record<string, unknown>;
  readonly resetOnSubmit?: boolean;
}

export interface FormFieldProps extends InputProps {
  readonly name: string;
  readonly rules?: ValidationRules;
}

export interface ValidationSchema {
  readonly [fieldName: string]: ValidationRules;
}

export interface ValidationRules {
  readonly required?: boolean | string;
  readonly minLength?: number | { value: number; message: string };
  readonly maxLength?: number | { value: number; message: string };
  readonly pattern?: RegExp | { value: RegExp; message: string };
  readonly validate?: (value: unknown) => boolean | string;
}

// ===== ICON COMPONENT =====

export interface IconProps {
  readonly name: string;
  readonly size?: number;
  readonly color?: string;
  readonly style?: StyleProp<TextStyle>;
  readonly onPress?: () => void;
}

// ===== IMAGE COMPONENTS =====

export interface OptimizedImageProps {
  readonly source: { uri: string } | number;
  readonly style?: StyleProp<ImageStyle>;
  readonly resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  readonly placeholder?: ComponentType;
  readonly errorComponent?: ComponentType;
  readonly priority?: 'high' | 'normal' | 'low';
  readonly lazy?: boolean;
  readonly onLoad?: () => void;
  readonly onError?: (error: Error) => void;
  readonly alt?: string;
}

export interface AvatarProps extends ThemedComponentProps {
  readonly source?: { uri: string } | number;
  readonly name?: string;
  readonly size?: ComponentSize | number;
  readonly shape?: 'circle' | 'square';
  readonly onPress?: () => void;
}

// ===== ANIMATION COMPONENTS =====

export interface AnimatedProps {
  readonly duration?: number;
  readonly delay?: number;
  readonly easing?: (value: number) => number;
  readonly useNativeDriver?: boolean;
}

export interface FadeProps extends AnimatedProps, BaseComponentProps {
  readonly visible: boolean;
  readonly fadeInDuration?: number;
  readonly fadeOutDuration?: number;
}

export interface SlideProps extends AnimatedProps, BaseComponentProps {
  readonly direction: 'up' | 'down' | 'left' | 'right';
  readonly distance?: number;
  readonly visible: boolean;
}

export interface ScaleProps extends AnimatedProps, BaseComponentProps {
  readonly scale?: number;
  readonly visible: boolean;
}

// ===== ACCESSIBILITY TYPES =====

export interface AccessibilityProps {
  readonly accessibilityLabel?: string;
  readonly accessibilityHint?: string;
  readonly accessibilityRole?: string;
  readonly accessibilityState?: {
    readonly disabled?: boolean;
    readonly selected?: boolean;
    readonly checked?: boolean | 'mixed';
    readonly busy?: boolean;
    readonly expanded?: boolean;
  };
  readonly accessibilityValue?: {
    readonly min?: number;
    readonly max?: number;
    readonly now?: number;
    readonly text?: string;
  };
  readonly accessible?: boolean;
  readonly importantForAccessibility?:
    | 'auto'
    | 'yes'
    | 'no'
    | 'no-hide-descendants';
}

// ===== PERFORMANCE TYPES =====

export interface PerformanceProps {
  readonly lazy?: boolean;
  readonly priority?: 'high' | 'normal' | 'low';
  readonly preload?: boolean;
  readonly memo?: boolean;
  readonly optimizeUpdates?: boolean;
}

export interface VirtualizedListItemProps<T = unknown> {
  readonly item: T;
  readonly index: number;
  readonly isVisible?: boolean;
  readonly height?: number;
  readonly onLayout?: (height: number) => void;
}

// ===== UTILITY TYPES =====

// Extract props from a component type
export type ComponentProps<T> = T extends ComponentType<infer P> ? P : never;

// Make certain props optional
export type OptionalProps<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;

// Make certain props required
export type RequiredProps<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Merge two prop types
export type MergeProps<T, U> = Omit<T, keyof U> & U;

// Style prop helper
export type StyleProps<T = ViewStyle> = {
  readonly style?: StyleProp<T>;
};

// Theme-aware style function
export type ThemedStyleFunction<T = ViewStyle> = (
  theme: DesignTokens,
) => StyleProp<T>;

// Responsive prop type
export type ResponsiveProp<T> =
  | T
  | {
      readonly sm?: T;
      readonly md?: T;
      readonly lg?: T;
      readonly xl?: T;
    };

// Event handler types
export type PressHandler = () => void;
export type LongPressHandler = () => void;
export type ChangeHandler<T = string> = (value: T) => void;
export type FocusHandler = () => void;
export type BlurHandler = () => void;
