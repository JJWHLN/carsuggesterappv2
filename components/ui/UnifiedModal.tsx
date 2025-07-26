import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Pressable,
  KeyboardAvoidingView,
  SafeAreaView,
  BackHandler,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X,
  AlertTriangle,
  CheckCircle,
  Info,
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
type ModalVariant =
  | 'default'
  | 'fullscreen'
  | 'bottom-sheet'
  | 'center'
  | 'alert'
  | 'confirmation';
type ModalSize = 'small' | 'medium' | 'large' | 'auto';
type AnimationType = 'slide' | 'fade' | 'scale' | 'spring';

interface ModalAction {
  label: string;
  onPress: () => void;
  style?: 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
}

interface UnifiedModalProps {
  // Visibility
  visible: boolean;
  onClose?: () => void;

  // Variant and styling
  variant?: ModalVariant;
  size?: ModalSize;
  animationType?: AnimationType;

  // Content
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  content?: React.ReactNode;

  // Header configuration
  showHeader?: boolean;
  showCloseButton?: boolean;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;

  // Actions
  actions?: ModalAction[];
  primaryAction?: ModalAction;
  secondaryAction?: ModalAction;

  // Modal behavior
  dismissible?: boolean;
  closeOnBackdropPress?: boolean;
  closeOnBackButton?: boolean;

  // Styling
  backgroundColor?: string;
  backdropColor?: string;
  style?: ViewStyle;
  contentStyle?: ViewStyle;

  // Alert/Confirmation specific
  icon?: 'warning' | 'error' | 'success' | 'info' | React.ReactNode;
  message?: string;

  // Accessibility
  accessibilityLabel?: string;
  testID?: string;

  // Callbacks
  onShow?: () => void;
  onDismiss?: () => void;
}

export const UnifiedModal: React.FC<UnifiedModalProps> = React.memo(
  ({
    visible,
    onClose,
    variant = 'default',
    size = 'medium',
    animationType = 'slide',
    title,
    subtitle,
    children,
    content,
    showHeader = true,
    showCloseButton = true,
    headerLeft,
    headerRight,
    actions = [],
    primaryAction,
    secondaryAction,
    dismissible = true,
    closeOnBackdropPress = true,
    closeOnBackButton = true,
    backgroundColor,
    backdropColor = 'rgba(0, 0, 0, 0.5)',
    style,
    contentStyle,
    icon,
    message,
    accessibilityLabel,
    testID = 'unified-modal',
    onShow,
    onDismiss,
  }) => {
    const { colors } = useThemeColors();
    const { trackMetric } = usePerformanceMonitor();

    // Animation values
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.9);
    const translateY = useSharedValue(variant === 'bottom-sheet' ? height : 0);

    // Refs
    const showTime = useRef<number>();

    // Handle Android back button
    useEffect(() => {
      if (Platform.OS === 'android' && closeOnBackButton) {
        const handleBackPress = () => {
          if (visible && dismissible && onClose) {
            onClose();
            return true;
          }
          return false;
        };

        BackHandler.addEventListener('hardwareBackPress', handleBackPress);
        return () =>
          BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
      }
    }, [visible, dismissible, closeOnBackButton, onClose]);

    // Animation effects
    useEffect(() => {
      if (visible) {
        showTime.current = Date.now();
        if (onShow) onShow();

        // Animate in
        switch (animationType) {
          case 'fade':
            opacity.value = withTiming(1, { duration: 200 });
            break;
          case 'scale':
            opacity.value = withTiming(1, { duration: 200 });
            scale.value = withSpring(1, { damping: 15, stiffness: 300 });
            break;
          case 'spring':
            opacity.value = withTiming(1, { duration: 100 });
            scale.value = withSpring(1, { damping: 10, stiffness: 200 });
            break;
          case 'slide':
          default:
            opacity.value = withTiming(1, { duration: 200 });
            translateY.value = withSpring(0, { damping: 15, stiffness: 300 });
            break;
        }
      } else {
        // Animate out
        switch (animationType) {
          case 'fade':
            opacity.value = withTiming(0, { duration: 150 });
            break;
          case 'scale':
            opacity.value = withTiming(0, { duration: 150 });
            scale.value = withTiming(0.9, { duration: 150 });
            break;
          case 'spring':
            opacity.value = withTiming(0, { duration: 150 });
            scale.value = withTiming(0.8, { duration: 150 });
            break;
          case 'slide':
          default:
            opacity.value = withTiming(0, { duration: 150 });
            translateY.value = withTiming(
              variant === 'bottom-sheet' ? height : -height,
              { duration: 200 },
            );
            break;
        }

        // Track usage metrics
        if (showTime.current) {
          const duration = Date.now() - showTime.current;
          trackMetric(
            'modal_usage',
            duration,
            {
              good: 5000,
              needsImprovement: 15000,
            },
            {
              variant,
              size,
              animation_type: animationType,
            },
          );
        }

        if (onDismiss) onDismiss();
      }
    }, [
      visible,
      animationType,
      variant,
      opacity,
      scale,
      translateY,
      onShow,
      onDismiss,
      trackMetric,
    ]);

    // Animated styles
    const backdropStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    const containerStyle = useAnimatedStyle(() => {
      const baseStyle = {
        opacity: opacity.value,
      };

      switch (animationType) {
        case 'scale':
        case 'spring':
          return {
            ...baseStyle,
            transform: [{ scale: scale.value }],
          };
        case 'slide':
          return {
            ...baseStyle,
            transform: [{ translateY: translateY.value }],
          };
        default:
          return baseStyle;
      }
    });

    // Handlers
    const handleBackdropPress = useCallback(() => {
      if (closeOnBackdropPress && dismissible && onClose) {
        trackMetric('modal_backdrop_dismissed', 1);
        onClose();
      }
    }, [closeOnBackdropPress, dismissible, onClose, trackMetric]);

    const handleClose = useCallback(() => {
      if (dismissible && onClose) {
        trackMetric('modal_close_button', 1);
        onClose();
      }
    }, [dismissible, onClose, trackMetric]);

    // Dimension calculations
    const modalDimensions = useMemo(() => {
      let modalWidth = width;
      let modalHeight: number | string = 'auto';
      let maxHeight = height * 0.9;

      switch (variant) {
        case 'fullscreen':
          modalWidth = width;
          modalHeight = height;
          maxHeight = height;
          break;
        case 'bottom-sheet':
          modalWidth = width;
          maxHeight = height * 0.8;
          break;
        case 'center':
        case 'alert':
        case 'confirmation':
          modalWidth = width - Spacing.xl * 2;
          break;
        default:
          modalWidth = width - Spacing.lg * 2;
      }

      switch (size) {
        case 'small':
          modalWidth = Math.min(modalWidth, 300);
          maxHeight = height * 0.4;
          break;
        case 'medium':
          modalWidth = Math.min(modalWidth, 400);
          maxHeight = height * 0.6;
          break;
        case 'large':
          modalWidth = Math.min(modalWidth, 600);
          maxHeight = height * 0.8;
          break;
      }

      return { modalWidth, modalHeight, maxHeight };
    }, [variant, size, width, height]);

    // Icon component
    const IconComponent = useMemo(() => {
      if (!icon) return null;

      if (React.isValidElement(icon)) {
        return icon;
      }

      const iconSize = 32;
      const iconProps = { size: iconSize };

      switch (icon) {
        case 'warning':
          return <AlertTriangle {...iconProps} color={colors.warning} />;
        case 'error':
          return <AlertTriangle {...iconProps} color={colors.error} />;
        case 'success':
          return <CheckCircle {...iconProps} color={colors.success} />;
        case 'info':
          return <Info {...iconProps} color={colors.info} />;
        default:
          return null;
      }
    }, [icon, colors]);

    // Header component
    const HeaderComponent = useMemo(() => {
      if (!showHeader && !title && !subtitle) return null;

      return (
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {headerLeft}
            {IconComponent && (
              <View style={styles.iconContainer}>{IconComponent}</View>
            )}
            <View style={styles.titleContainer}>
              {title && (
                <Text
                  style={[styles.title, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {title}
                </Text>
              )}
              {subtitle && (
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                  numberOfLines={3}
                >
                  {subtitle}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.headerRight}>
            {headerRight}
            {showCloseButton && dismissible && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                accessibilityLabel="Close modal"
                accessibilityRole="button"
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }, [
      showHeader,
      title,
      subtitle,
      headerLeft,
      headerRight,
      IconComponent,
      showCloseButton,
      dismissible,
      colors,
      handleClose,
    ]);

    // Actions component
    const ActionsComponent = useMemo(() => {
      const allActions = [...actions];
      if (primaryAction)
        allActions.push({ ...primaryAction, style: 'primary' });
      if (secondaryAction)
        allActions.push({ ...secondaryAction, style: 'secondary' });

      if (allActions.length === 0) return null;

      return (
        <View style={styles.actions}>
          {allActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.actionButton,
                action.style === 'primary' && [
                  styles.primaryButton,
                  { backgroundColor: colors.primary },
                ],
                action.style === 'destructive' && [
                  styles.destructiveButton,
                  { backgroundColor: colors.error },
                ],
                action.style === 'secondary' && [
                  styles.secondaryButton,
                  { borderColor: colors.border },
                ],
                action.disabled && styles.disabledButton,
              ]}
              onPress={() => {
                trackMetric('modal_action', 1, undefined, {
                  action_type: action.style || 'default',
                });
                action.onPress();
              }}
              disabled={action.disabled}
            >
              <Text
                style={[
                  styles.actionButtonText,
                  action.style === 'primary' && [
                    styles.primaryButtonText,
                    { color: colors.white },
                  ],
                  action.style === 'destructive' && [
                    styles.destructiveButtonText,
                    { color: colors.white },
                  ],
                  action.style === 'secondary' && [
                    styles.secondaryButtonText,
                    { color: colors.text },
                  ],
                  action.disabled && [
                    styles.disabledButtonText,
                    { color: colors.textMuted },
                  ],
                ]}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }, [actions, primaryAction, secondaryAction, colors, trackMetric]);

    // Content component
    const ContentComponent = useMemo(() => {
      if (variant === 'alert' || variant === 'confirmation') {
        return (
          <View style={styles.alertContent}>
            {message && (
              <Text style={[styles.message, { color: colors.text }]}>
                {message}
              </Text>
            )}
            {children}
            {content}
          </View>
        );
      }

      return (
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={contentStyle}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {message && (
            <Text style={[styles.message, { color: colors.text }]}>
              {message}
            </Text>
          )}
          {children}
          {content}
        </ScrollView>
      );
    }, [variant, message, children, content, colors, contentStyle]);

    // Main content container
    const MainContent = (
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: backgroundColor || colors.surface,
            width: modalDimensions.modalWidth,
            maxHeight: modalDimensions.maxHeight,
          },
          variant === 'fullscreen' && styles.fullscreenContainer,
          variant === 'bottom-sheet' && styles.bottomSheetContainer,
          (variant === 'center' ||
            variant === 'alert' ||
            variant === 'confirmation') &&
            styles.centerContainer,
          containerStyle,
          style,
        ]}
        testID={testID}
      >
        {HeaderComponent}
        {ContentComponent}
        {ActionsComponent}
      </Animated.View>
    );

    // Wrapper based on variant
    const ModalWrapper = () => {
      const KeyboardWrapper =
        Platform.OS === 'ios' ? KeyboardAvoidingView : View;
      const keyboardProps =
        Platform.OS === 'ios' ? { behavior: 'padding' as const } : {};

      switch (variant) {
        case 'fullscreen':
          return (
            <SafeAreaView style={styles.fullscreenWrapper}>
              <KeyboardWrapper
                style={styles.fullscreenInner}
                {...keyboardProps}
              >
                {MainContent}
              </KeyboardWrapper>
            </SafeAreaView>
          );

        case 'bottom-sheet':
          return (
            <View style={styles.bottomSheetWrapper}>
              <Animated.View
                style={[
                  styles.backdrop,
                  backdropStyle,
                  { backgroundColor: backdropColor },
                ]}
              >
                <Pressable
                  style={styles.backdropPressable}
                  onPress={handleBackdropPress}
                />
              </Animated.View>
              <KeyboardWrapper
                style={styles.bottomSheetInner}
                {...keyboardProps}
              >
                {MainContent}
              </KeyboardWrapper>
            </View>
          );

        case 'center':
        case 'alert':
        case 'confirmation':
        default:
          return (
            <View style={styles.centerWrapper}>
              <Animated.View
                style={[
                  styles.backdrop,
                  backdropStyle,
                  { backgroundColor: backdropColor },
                ]}
              >
                <Pressable
                  style={styles.backdropPressable}
                  onPress={handleBackdropPress}
                />
              </Animated.View>
              <KeyboardWrapper style={styles.centerInner} {...keyboardProps}>
                {MainContent}
              </KeyboardWrapper>
            </View>
          );
      }
    };

    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={handleClose}
        statusBarTranslucent={variant === 'fullscreen'}
        accessibilityLabel={accessibilityLabel}
      >
        <ModalWrapper />
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  // Wrappers
  fullscreenWrapper: {
    flex: 1,
  },
  fullscreenInner: {
    flex: 1,
  },
  bottomSheetWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomSheetInner: {
    justifyContent: 'flex-end',
  },
  centerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  centerInner: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },

  // Backdrop
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdropPressable: {
    flex: 1,
  },

  // Container variants
  container: {
    borderRadius: BorderRadius.lg,
    ...Shadows.lg,
    overflow: 'hidden',
  },
  fullscreenContainer: {
    flex: 1,
    borderRadius: 0,
    width: '100%',
    height: '100%',
  },
  bottomSheetContainer: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  centerContainer: {
    maxWidth: '100%',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: currentColors.border,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  iconContainer: {
    marginRight: Spacing.md,
    marginTop: Spacing.xs,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: Typography.title.fontSize,
    fontWeight: '600',
    lineHeight: Typography.title.lineHeight,
  },
  subtitle: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    marginTop: Spacing.xs,
  },
  closeButton: {
    padding: Spacing.xs,
    marginRight: -Spacing.xs,
    marginTop: -Spacing.xs,
  },

  // Content
  scrollContent: {
    flexGrow: 1,
  },
  alertContent: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  message: {
    fontSize: Typography.body.fontSize,
    lineHeight: Typography.body.lineHeight,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: currentColors.border,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryButton: {
    backgroundColor: currentColors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  destructiveButton: {
    backgroundColor: currentColors.error,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: Typography.body.fontSize,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: currentColors.white,
  },
  secondaryButtonText: {
    color: currentColors.text,
  },
  destructiveButtonText: {
    color: currentColors.white,
  },
  disabledButtonText: {
    color: currentColors.textMuted,
  },
});

UnifiedModal.displayName = 'UnifiedModal';

export { UnifiedModal as Modal };
export default UnifiedModal;
