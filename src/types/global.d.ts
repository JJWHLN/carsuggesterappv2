/**
 * Global type declarations and module augmentations
 * This file provides ambient types and extends existing modules
 */

// ======================
// Asset Module Declarations
// ======================

declare module '*.png' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.jpg' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.jpeg' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.gif' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.webp' {
  const value: import('react-native').ImageSourcePropType;
  export default value;
}

declare module '*.svg' {
  const value: React.ComponentType<import('react-native-svg').SvgProps>;
  export default value;
}

declare module '*.json' {
  const value: any;
  export default value;
}

// ======================
// Environment Variables
// ======================

declare module '@env' {
  export const EXPO_PUBLIC_SUPABASE_URL: string;
  export const EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
  export const EXPO_PUBLIC_OPENAI_API_KEY: string;
  export const EXPO_PUBLIC_API_BASE_URL: string;
  export const EXPO_PUBLIC_ENVIRONMENT:
    | 'development'
    | 'staging'
    | 'production';
  export const EXPO_PUBLIC_SENTRY_DSN: string;
  export const EXPO_PUBLIC_ANALYTICS_ENABLED: string;
  export const EXPO_PUBLIC_DEBUG_ENABLED: string;
}

// ======================
// Expo Module Augmentations
// ======================

declare module 'expo-constants' {
  export interface Constants {
    readonly expoConfig: {
      readonly name: string;
      readonly slug: string;
      readonly version: string;
      readonly extra?: {
        readonly eas?: {
          readonly projectId: string;
        };
      };
    };
  }
}

// ======================
// React Native Module Augmentations
// ======================

declare module 'react-native' {
  interface ProcessedColorValue {
    readonly platform?: string;
  }
}

// ======================
// Third-party Library Types
// ======================

declare module '@react-native-async-storage/async-storage' {
  export interface AsyncStorageStatic {
    readonly getItem: (key: string) => Promise<string | null>;
    readonly setItem: (key: string, value: string) => Promise<void>;
    readonly removeItem: (key: string) => Promise<void>;
    readonly multiGet: (
      keys: readonly string[],
    ) => Promise<readonly [string, string | null][]>;
    readonly multiSet: (
      keyValuePairs: readonly [string, string][],
    ) => Promise<void>;
    readonly multiRemove: (keys: readonly string[]) => Promise<void>;
    readonly clear: () => Promise<void>;
    readonly getAllKeys: () => Promise<readonly string[]>;
  }
  const AsyncStorage: AsyncStorageStatic;
  export default AsyncStorage;
}

declare module 'react-native-vector-icons/MaterialIcons' {
  import { IconProps } from 'react-native-vector-icons/Icon';
  import { Component } from 'react';

  export default class MaterialIcons extends Component<IconProps> {}
}

declare module 'react-native-vector-icons/Ionicons' {
  import { IconProps } from 'react-native-vector-icons/Icon';
  import { Component } from 'react';

  export default class Ionicons extends Component<IconProps> {}
}

// ======================
// Global Type Utilities
// ======================

declare global {
  // Console extensions for debugging
  interface Console {
    readonly tron?: {
      readonly log: (...args: any[]) => void;
      readonly warn: (...args: any[]) => void;
      readonly error: (...args: any[]) => void;
      readonly display: (config: {
        name: string;
        value: any;
        preview?: string;
      }) => void;
    };
  }

  // Global error types
  interface GlobalError extends Error {
    readonly code?: string;
    readonly statusCode?: number;
    readonly context?: Record<string, unknown>;
  }

  // Performance measurement
  interface Performance {
    readonly now: () => number;
    readonly mark: (name: string) => void;
    readonly measure: (
      name: string,
      startMark?: string,
      endMark?: string,
    ) => void;
  }

  // Network information (for offline support)
  interface Navigator {
    readonly connection?: {
      readonly effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
      readonly downlink: number;
      readonly rtt: number;
      readonly saveData: boolean;
    };
  }

  // Device information
  interface DeviceInfo {
    readonly platform: 'ios' | 'android' | 'web';
    readonly version: string;
    readonly model: string;
    readonly brand: string;
    readonly isTablet: boolean;
    readonly hasNotch: boolean;
    readonly screenWidth: number;
    readonly screenHeight: number;
  }

  // App state
  interface AppState {
    readonly currentState: 'active' | 'background' | 'inactive';
    readonly isBackground: boolean;
    readonly isActive: boolean;
  }
}

// ======================
// Utility Types
// ======================

/**
 * Makes all properties in T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends readonly (infer U)[]
      ? readonly DeepPartial<U>[]
      : T[P] extends object
        ? DeepPartial<T[P]>
        : T[P];
};

/**
 * Makes all properties in T required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends (infer U)[]
    ? DeepRequired<U>[]
    : T[P] extends readonly (infer U)[]
      ? readonly DeepRequired<U>[]
      : T[P] extends object
        ? DeepRequired<T[P]>
        : T[P];
};

/**
 * Extracts the return type of a Promise
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Creates a type with all properties optional except the specified keys
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Creates a union type from an array of strings
 */
export type ArrayElement<T extends readonly unknown[]> =
  T extends readonly (infer U)[] ? U : never;

/**
 * Creates a readonly version of an object type
 */
export type ReadonlyDeep<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? readonly ReadonlyDeep<U>[]
    : T[P] extends object
      ? ReadonlyDeep<T[P]>
      : T[P];
};

/**
 * Excludes functions from a type
 */
export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

/**
 * Creates a type that represents either a value or a function that returns that value
 */
export type ValueOrFunction<T> = T | (() => T);

/**
 * Creates a type that represents a nullable value
 */
export type Nullable<T> = T | null;

/**
 * Creates a type that represents an optional value
 */
export type Optional<T> = T | undefined;

/**
 * Creates a type that represents a value that can be null or undefined
 */
export type Maybe<T> = T | null | undefined;

// Export everything for consumption
export {};
