import { Alert, AlertButton, AlertOptions } from 'react-native';

export interface NotificationConfig {
  title: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  buttons?: AlertButton[];
  options?: AlertOptions;
  duration?: number; // For future toast implementations
}

/**
 * Unified notification system that consolidates Alert.alert usage
 * Provides consistent messaging and error handling across the app
 */
class UnifiedNotificationService {
  // Show a generic notification
  show(config: NotificationConfig) {
    const { title, message, buttons, options } = config;
    Alert.alert(title, message, buttons, options);
  }

  // Show success message
  success(title: string, message?: string, onPress?: () => void) {
    const buttons: AlertButton[] = onPress 
      ? [{ text: 'OK', onPress }] 
      : [{ text: 'OK' }];
    
    Alert.alert(title, message, buttons);
  }

  // Show error message
  error(title: string = 'Error', message?: string, onRetry?: () => void) {
    const buttons: AlertButton[] = [];
    
    if (onRetry) {
      buttons.push({ text: 'Retry', onPress: onRetry });
    }
    buttons.push({ text: 'OK', style: 'cancel' });
    
    Alert.alert(title, message, buttons);
  }

  // Show warning message
  warning(title: string, message?: string, onConfirm?: () => void) {
    const buttons: AlertButton[] = [];
    
    if (onConfirm) {
      buttons.push({ text: 'Cancel', style: 'cancel' });
      buttons.push({ text: 'Continue', onPress: onConfirm });
    } else {
      buttons.push({ text: 'OK' });
    }
    
    Alert.alert(title, message, buttons);
  }

  // Show confirmation dialog
  confirm(
    title: string, 
    message?: string, 
    onConfirm?: () => void, 
    onCancel?: () => void,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel'
  ) {
    const buttons: AlertButton[] = [
      { text: cancelText, style: 'cancel', onPress: onCancel },
      { text: confirmText, onPress: onConfirm },
    ];
    
    Alert.alert(title, message, buttons);
  }

  // Show coming soon message
  comingSoon(feature: string) {
    Alert.alert(
      'Coming Soon',
      `${feature} feature is coming soon! Stay tuned for updates.`,
      [{ text: 'OK' }]
    );
  }

  // Show access denied message
  accessDenied(message: string = 'You do not have permission to perform this action.') {
    Alert.alert('Access Denied', message, [{ text: 'OK' }]);
  }

  // Show sign-in required message
  signInRequired(message: string = 'Please sign in to continue.', onSignIn?: () => void) {
    const buttons: AlertButton[] = [];
    
    if (onSignIn) {
      buttons.push({ text: 'Cancel', style: 'cancel' });
      buttons.push({ text: 'Sign In', onPress: onSignIn });
    } else {
      buttons.push({ text: 'OK' });
    }
    
    Alert.alert('Sign In Required', message, buttons);
  }

  // Show validation error
  validationError(message: string = 'Please check your input and try again.') {
    Alert.alert('Validation Error', message, [{ text: 'OK' }]);
  }

  // Show network error
  networkError(onRetry?: () => void) {
    const buttons: AlertButton[] = [];
    
    if (onRetry) {
      buttons.push({ text: 'Retry', onPress: onRetry });
    }
    buttons.push({ text: 'OK', style: 'cancel' });
    
    Alert.alert(
      'Network Error',
      'Please check your internet connection and try again.',
      buttons
    );
  }

  // Show delete confirmation
  confirmDelete(
    itemName: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) {
    this.confirm(
      'Delete Confirmation',
      `Are you sure you want to delete this ${itemName}? This action cannot be undone.`,
      onConfirm,
      onCancel,
      'Delete',
      'Cancel'
    );
  }

  // Show logout confirmation
  confirmLogout(onConfirm: () => void, onCancel?: () => void) {
    this.confirm(
      'Sign Out',
      'Are you sure you want to sign out?',
      onConfirm,
      onCancel,
      'Sign Out',
      'Cancel'
    );
  }

  // Auth-specific notifications
  auth = {
    signInSuccess: () => {
      this.success('Welcome!', 'You have been signed in successfully.');
    },

    signUpSuccess: () => {
      this.success(
        'Account Created!', 
        'Your account has been created successfully. Please check your email for verification.'
      );
    },

    passwordResetSent: () => {
      this.success(
        'Reset Email Sent',
        'Please check your email for password reset instructions.'
      );
    },

    signOutSuccess: () => {
      this.success('Signed Out', 'You have been signed out successfully.');
    },

    invalidCredentials: () => {
      this.error(
        'Invalid Credentials',
        'The email or password you entered is incorrect. Please try again.'
      );
    },

    emailAlreadyInUse: () => {
      this.error(
        'Email Already in Use',
        'An account with this email already exists. Please use a different email or sign in.'
      );
    },

    weakPassword: () => {
      this.error(
        'Weak Password',
        'Please choose a stronger password with at least 8 characters.'
      );
    },

    emailNotVerified: () => {
      this.warning(
        'Email Not Verified',
        'Please verify your email address before continuing.'
      );
    },
  };

  // Car-related notifications
  car = {
    savedSuccess: () => {
      this.success('Car Saved', 'This car has been added to your saved cars.');
    },

    removedSuccess: () => {
      this.success('Car Removed', 'This car has been removed from your saved cars.');
    },

    addedSuccess: () => {
      this.success('Car Added', 'Your car listing has been added successfully.');
    },

    updatedSuccess: () => {
      this.success('Car Updated', 'Your car listing has been updated successfully.');
    },

    deletedSuccess: () => {
      this.success('Car Deleted', 'Your car listing has been deleted.');
    },

    contactDealer: (dealerName: string, onContact: () => void) => {
      this.confirm(
        'Contact Dealer',
        `Would you like to contact ${dealerName} about this car?`,
        onContact,
        undefined,
        'Contact',
        'Cancel'
      );
    },
  };

  // Review-related notifications
  review = {
    submitted: () => {
      this.success(
        'Review Submitted',
        'Thank you for your review! It will be published after moderation.'
      );
    },

    updated: () => {
      this.success('Review Updated', 'Your review has been updated successfully.');
    },

    deleted: () => {
      this.success('Review Deleted', 'Your review has been deleted.');
    },

    flagged: () => {
      this.success(
        'Review Flagged',
        'Thank you for reporting this review. We will investigate shortly.'
      );
    },
  };
}

// Export singleton instance
export const notifications = new UnifiedNotificationService();

// Export class for custom instances if needed
export { UnifiedNotificationService };
