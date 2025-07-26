import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface Modal {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'confirm' | 'custom';
  title: string;
  content: string | React.ReactNode;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  closable?: boolean;
  backdropClosable?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  component?: React.ComponentType<any>;
  props?: any;
}

export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  duration?: number; // in milliseconds, 0 = no auto-dismiss
  action?: {
    label: string;
    action: () => void;
  };
  persistent?: boolean;
}

export interface LoadingState {
  id: string;
  message?: string;
  progress?: number; // 0-100
  cancelable?: boolean;
  onCancel?: () => void;
}

export interface Navigation {
  currentRoute: string;
  previousRoute: string | null;
  navigationHistory: string[];
  canGoBack: boolean;
  params: Record<string, any>;
}

export interface AppState {
  isOnline: boolean;
  isAppActive: boolean;
  orientation: 'portrait' | 'landscape';
  keyboardVisible: boolean;
  safeAreaInsets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface UIPreferences {
  theme: 'light' | 'dark' | 'auto';
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  gridView: boolean;
  compactMode: boolean;
}

interface UIStore {
  // Modal Management
  modals: Modal[];
  activeModal: string | null;

  // Toast Management
  toasts: Toast[];
  maxToasts: number;

  // Loading States
  loadingStates: LoadingState[];
  globalLoading: boolean;

  // Navigation State
  navigation: Navigation;

  // App State
  appState: AppState;

  // UI Preferences
  uiPreferences: UIPreferences;

  // Component States
  sidebarOpen: boolean;
  searchBarFocused: boolean;
  filtersVisible: boolean;
  comparisonDrawerOpen: boolean;

  // Form States
  formData: Record<string, any>;
  formErrors: Record<string, Record<string, string[]>>;
  formTouched: Record<string, Record<string, boolean>>;

  // Actions - Modal Management
  showModal: (modal: Omit<Modal, 'id'>) => string;
  hideModal: (id: string) => void;
  hideAllModals: () => void;
  updateModal: (id: string, updates: Partial<Modal>) => void;

  // Actions - Toast Management
  showToast: (toast: Omit<Toast, 'id'>) => string;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;

  // Actions - Loading Management
  showLoading: (loading: Omit<LoadingState, 'id'>) => string;
  hideLoading: (id: string) => void;
  hideAllLoading: () => void;
  updateLoading: (id: string, updates: Partial<LoadingState>) => void;
  setGlobalLoading: (loading: boolean) => void;

  // Actions - Navigation
  setCurrentRoute: (route: string, params?: Record<string, any>) => void;
  goBack: () => boolean;
  clearNavigationHistory: () => void;

  // Actions - App State
  setAppState: (state: Partial<AppState>) => void;
  setOnlineStatus: (online: boolean) => void;
  setAppActive: (active: boolean) => void;
  setOrientation: (orientation: 'portrait' | 'landscape') => void;
  setKeyboardVisible: (visible: boolean) => void;
  setSafeAreaInsets: (insets: Partial<AppState['safeAreaInsets']>) => void;

  // Actions - UI Preferences
  setUIPreferences: (preferences: Partial<UIPreferences>) => void;
  toggleTheme: () => void;
  setTheme: (theme: UIPreferences['theme']) => void;
  toggleGridView: () => void;
  toggleCompactMode: () => void;

  // Actions - Component States
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSearchBarFocused: (focused: boolean) => void;
  setFiltersVisible: (visible: boolean) => void;
  toggleFilters: () => void;
  setComparisonDrawerOpen: (open: boolean) => void;
  toggleComparisonDrawer: () => void;

  // Actions - Form Management
  setFormData: (formId: string, data: any) => void;
  updateFormField: (formId: string, field: string, value: any) => void;
  setFormErrors: (formId: string, errors: Record<string, string[]>) => void;
  setFormTouched: (formId: string, field: string, touched: boolean) => void;
  clearForm: (formId: string) => void;
  resetAllForms: () => void;

  // Utility Actions
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
  ) => string;
  showAlert: (
    title: string,
    message: string,
    type?: 'info' | 'warning' | 'error' | 'success',
  ) => string;
  showSuccess: (message: string, title?: string) => string;
  showError: (message: string, title?: string) => string;
  showWarning: (message: string, title?: string) => string;
  showInfo: (message: string, title?: string) => string;

  // Accessibility Actions
  announceForScreenReader: (message: string) => void;
  setFocusedElement: (elementId: string) => void;

  // Performance Actions
  reportPerformanceMetric: (metric: string, value: number) => void;
  trackUserInteraction: (interaction: string, data?: any) => void;
}

const defaultUIPreferences: UIPreferences = {
  theme: 'auto',
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  gridView: false,
  compactMode: false,
};

const defaultAppState: AppState = {
  isOnline: true,
  isAppActive: true,
  orientation: 'portrait',
  keyboardVisible: false,
  safeAreaInsets: {
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

const defaultNavigation: Navigation = {
  currentRoute: '/',
  previousRoute: null,
  navigationHistory: ['/'],
  canGoBack: false,
  params: {},
};

const useUIStore = create<UIStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    modals: [],
    activeModal: null,
    toasts: [],
    maxToasts: 5,
    loadingStates: [],
    globalLoading: false,
    navigation: defaultNavigation,
    appState: defaultAppState,
    uiPreferences: defaultUIPreferences,
    sidebarOpen: false,
    searchBarFocused: false,
    filtersVisible: false,
    comparisonDrawerOpen: false,
    formData: {},
    formErrors: {},
    formTouched: {},

    // Modal Management
    showModal: (modal) => {
      const id = Date.now().toString();
      const newModal = { ...modal, id };

      set((state) => ({
        modals: [...state.modals, newModal],
        activeModal: id,
      }));

      return id;
    },

    hideModal: (id) =>
      set((state) => {
        const updatedModals = state.modals.filter((modal) => modal.id !== id);
        return {
          modals: updatedModals,
          activeModal:
            updatedModals.length > 0
              ? updatedModals[updatedModals.length - 1].id
              : null,
        };
      }),

    hideAllModals: () => set({ modals: [], activeModal: null }),

    updateModal: (id, updates) =>
      set((state) => ({
        modals: state.modals.map((modal) =>
          modal.id === id ? { ...modal, ...updates } : modal,
        ),
      })),

    // Toast Management
    showToast: (toast) => {
      const id = Date.now().toString();
      const newToast = { ...toast, id };

      set((state) => {
        const updatedToasts = [...state.toasts, newToast];
        if (updatedToasts.length > state.maxToasts) {
          updatedToasts.shift(); // Remove oldest toast
        }
        return { toasts: updatedToasts };
      });

      // Auto-hide toast if duration is specified
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          get().hideToast(id);
        }, toast.duration);
      }

      return id;
    },

    hideToast: (id) =>
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      })),

    hideAllToasts: () => set({ toasts: [] }),

    // Loading Management
    showLoading: (loading) => {
      const id = Date.now().toString();
      const newLoading = { ...loading, id };

      set((state) => ({
        loadingStates: [...state.loadingStates, newLoading],
      }));

      return id;
    },

    hideLoading: (id) =>
      set((state) => ({
        loadingStates: state.loadingStates.filter(
          (loading) => loading.id !== id,
        ),
      })),

    hideAllLoading: () => set({ loadingStates: [] }),

    updateLoading: (id, updates) =>
      set((state) => ({
        loadingStates: state.loadingStates.map((loading) =>
          loading.id === id ? { ...loading, ...updates } : loading,
        ),
      })),

    setGlobalLoading: (loading) => set({ globalLoading: loading }),

    // Navigation
    setCurrentRoute: (route, params = {}) =>
      set((state) => {
        const history = [...state.navigation.navigationHistory];
        if (history[history.length - 1] !== route) {
          history.push(route);
        }

        return {
          navigation: {
            currentRoute: route,
            previousRoute: state.navigation.currentRoute,
            navigationHistory: history,
            canGoBack: history.length > 1,
            params,
          },
        };
      }),

    goBack: () => {
      const state = get();
      if (!state.navigation.canGoBack) return false;

      const history = [...state.navigation.navigationHistory];
      history.pop(); // Remove current route
      const previousRoute = history[history.length - 1];

      set({
        navigation: {
          ...state.navigation,
          currentRoute: previousRoute,
          previousRoute: state.navigation.currentRoute,
          navigationHistory: history,
          canGoBack: history.length > 1,
          params: {},
        },
      });

      return true;
    },

    clearNavigationHistory: () =>
      set((state) => ({
        navigation: {
          ...state.navigation,
          navigationHistory: [state.navigation.currentRoute],
          canGoBack: false,
        },
      })),

    // App State
    setAppState: (appState) =>
      set((state) => ({
        appState: { ...state.appState, ...appState },
      })),

    setOnlineStatus: (online) =>
      set((state) => ({
        appState: { ...state.appState, isOnline: online },
      })),

    setAppActive: (active) =>
      set((state) => ({
        appState: { ...state.appState, isAppActive: active },
      })),

    setOrientation: (orientation) =>
      set((state) => ({
        appState: { ...state.appState, orientation },
      })),

    setKeyboardVisible: (visible) =>
      set((state) => ({
        appState: { ...state.appState, keyboardVisible: visible },
      })),

    setSafeAreaInsets: (insets) =>
      set((state) => ({
        appState: {
          ...state.appState,
          safeAreaInsets: { ...state.appState.safeAreaInsets, ...insets },
        },
      })),

    // UI Preferences
    setUIPreferences: (preferences) =>
      set((state) => ({
        uiPreferences: { ...state.uiPreferences, ...preferences },
      })),

    toggleTheme: () =>
      set((state) => {
        const currentTheme = state.uiPreferences.theme;
        const newTheme =
          currentTheme === 'light'
            ? 'dark'
            : currentTheme === 'dark'
              ? 'auto'
              : 'light';
        return {
          uiPreferences: { ...state.uiPreferences, theme: newTheme },
        };
      }),

    setTheme: (theme) =>
      set((state) => ({
        uiPreferences: { ...state.uiPreferences, theme },
      })),

    toggleGridView: () =>
      set((state) => ({
        uiPreferences: {
          ...state.uiPreferences,
          gridView: !state.uiPreferences.gridView,
        },
      })),

    toggleCompactMode: () =>
      set((state) => ({
        uiPreferences: {
          ...state.uiPreferences,
          compactMode: !state.uiPreferences.compactMode,
        },
      })),

    // Component States
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    setSearchBarFocused: (focused) => set({ searchBarFocused: focused }),
    setFiltersVisible: (visible) => set({ filtersVisible: visible }),
    toggleFilters: () =>
      set((state) => ({ filtersVisible: !state.filtersVisible })),
    setComparisonDrawerOpen: (open) => set({ comparisonDrawerOpen: open }),
    toggleComparisonDrawer: () =>
      set((state) => ({ comparisonDrawerOpen: !state.comparisonDrawerOpen })),

    // Form Management
    setFormData: (formId, data) =>
      set((state) => ({
        formData: { ...state.formData, [formId]: data },
      })),

    updateFormField: (formId, field, value) =>
      set((state) => ({
        formData: {
          ...state.formData,
          [formId]: { ...state.formData[formId], [field]: value },
        },
      })),

    setFormErrors: (formId, errors) =>
      set((state) => ({
        formErrors: { ...state.formErrors, [formId]: errors },
      })),

    setFormTouched: (formId, field, touched) =>
      set((state) => {
        const currentForm = state.formTouched[formId] || {};
        return {
          formTouched: {
            ...state.formTouched,
            [formId]: { ...currentForm, [field]: touched } as Record<
              string,
              boolean
            >,
          },
        };
      }),

    clearForm: (formId) =>
      set((state) => {
        const { [formId]: _, ...restFormData } = state.formData;
        const { [formId]: __, ...restFormErrors } = state.formErrors;
        const { [formId]: ___, ...restFormTouched } = state.formTouched;

        return {
          formData: restFormData,
          formErrors: restFormErrors,
          formTouched: restFormTouched,
        };
      }),

    resetAllForms: () =>
      set({
        formData: {},
        formErrors: {},
        formTouched: {},
      }),

    // Utility Actions
    showConfirm: (title, message, onConfirm, onCancel) => {
      return get().showModal({
        type: 'confirm',
        title,
        content: message,
        actions: [
          {
            label: 'Cancel',
            action: onCancel || (() => {}),
            variant: 'secondary',
          },
          {
            label: 'Confirm',
            action: onConfirm,
            variant: 'primary',
          },
        ],
      });
    },

    showAlert: (title, message, type = 'info') => {
      return get().showModal({
        type,
        title,
        content: message,
        actions: [
          {
            label: 'OK',
            action: () => {},
            variant: 'primary',
          },
        ],
      });
    },

    showSuccess: (message, title = 'Success') => {
      return get().showToast({
        type: 'success',
        title,
        message,
        duration: 4000,
      });
    },

    showError: (message, title = 'Error') => {
      return get().showToast({
        type: 'error',
        title,
        message,
        duration: 6000,
      });
    },

    showWarning: (message, title = 'Warning') => {
      return get().showToast({
        type: 'warning',
        title,
        message,
        duration: 5000,
      });
    },

    showInfo: (message, title = 'Info') => {
      return get().showToast({
        type: 'info',
        title,
        message,
        duration: 4000,
      });
    },

    // Accessibility
    announceForScreenReader: (message) => {
      // TODO: Implement screen reader announcement
      console.log('Screen reader announcement:', message);
    },

    setFocusedElement: (elementId) => {
      // TODO: Implement focus management
      console.log('Focus set to:', elementId);
    },

    // Performance
    reportPerformanceMetric: (metric, value) => {
      // TODO: Implement performance tracking
      console.log('Performance metric:', metric, value);
    },

    trackUserInteraction: (interaction, data) => {
      // TODO: Implement interaction tracking
      console.log('User interaction:', interaction, data);
    },
  })),
);

export default useUIStore;
