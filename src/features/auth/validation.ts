import { z } from 'zod';

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Email validation schema
const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

// Login form validation
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

// Signup form validation
export const signupSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters')
      .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes'),
    acceptTerms: z
      .boolean()
      .refine(val => val === true, 'You must accept the terms and conditions'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Password reset validation
export const passwordResetSchema = z.object({
  email: emailSchema,
});

// New password validation (for reset flow)
export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    token: z.string().min(1, 'Reset token is required'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// Profile update validation
export const profileUpdateSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'First name is required')
      .max(50, 'First name must be less than 50 characters'),
    lastName: z
      .string()
      .min(1, 'Last name is required')
      .max(50, 'Last name must be less than 50 characters'),
    email: emailSchema,
    currentPassword: z.string().optional(),
    newPassword: passwordSchema.optional(),
    confirmNewPassword: z.string().optional(),
  })
  .refine(
    data => {
      if (data.newPassword) {
        return data.currentPassword && data.currentPassword.length > 0;
      }
      return true;
    },
    {
      message: 'Current password is required to change password',
      path: ['currentPassword'],
    }
  )
  .refine(
    data => {
      if (data.newPassword && data.confirmNewPassword) {
        return data.newPassword === data.confirmNewPassword;
      }
      return true;
    },
    {
      message: 'New passwords do not match',
      path: ['confirmNewPassword'],
    }
  );

// Preferences validation
export const preferencesSchema = z.object({
  budget: z.object({
    min: z
      .number()
      .min(0, 'Minimum budget must be at least $0')
      .max(1000000, 'Minimum budget cannot exceed $1,000,000'),
    max: z
      .number()
      .min(0, 'Maximum budget must be at least $0')
      .max(1000000, 'Maximum budget cannot exceed $1,000,000'),
  }).refine(data => data.min <= data.max, {
    message: 'Minimum budget cannot be greater than maximum budget',
    path: ['min'],
  }),
  
  bodyStyles: z
    .array(z.string())
    .min(1, 'Please select at least one body style')
    .max(10, 'Cannot select more than 10 body styles'),
  
  fuelTypes: z
    .array(z.string())
    .min(1, 'Please select at least one fuel type')
    .max(5, 'Cannot select more than 5 fuel types'),
  
  makes: z
    .array(z.string())
    .max(20, 'Cannot select more than 20 makes'),
  
  yearRange: z.object({
    min: z
      .number()
      .min(1990, 'Minimum year cannot be earlier than 1990')
      .max(new Date().getFullYear() + 1, 'Minimum year cannot be in the future'),
    max: z
      .number()
      .min(1990, 'Maximum year cannot be earlier than 1990')
      .max(new Date().getFullYear() + 1, 'Maximum year cannot be in the future'),
  }).refine(data => data.min <= data.max, {
    message: 'Minimum year cannot be greater than maximum year',
    path: ['min'],
  }),
  
  location: z.object({
    city: z
      .string()
      .min(1, 'City is required')
      .max(100, 'City name must be less than 100 characters'),
    state: z
      .string()
      .min(2, 'State is required')
      .max(50, 'State name must be less than 50 characters'),
    radius: z
      .number()
      .min(5, 'Search radius must be at least 5 miles')
      .max(500, 'Search radius cannot exceed 500 miles'),
  }),
  
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    priceDrops: z.boolean(),
    newListings: z.boolean(),
    savedSearchAlerts: z.boolean(),
  }),
});

// Saved search validation
export const savedSearchSchema = z.object({
  name: z
    .string()
    .min(1, 'Search name is required')
    .max(100, 'Search name must be less than 100 characters'),
  query: z.string().max(500, 'Query must be less than 500 characters'),
  filters: z.any(), // Will be validated separately
  alertsEnabled: z.boolean().default(false),
  frequency: z.enum(['daily', 'weekly', 'immediate']).default('weekly'),
});

// Rate limiting validation
export const rateLimitSchema = z.object({
  attempts: z.number().min(0).max(10),
  lastAttempt: z.date().optional(),
  isBlocked: z.boolean().default(false),
  blockUntil: z.date().optional(),
});

// Token validation
export const tokenSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.number().min(0),
  tokenType: z.string().default('Bearer'),
});

// Social login validation
export const socialLoginSchema = z.object({
  provider: z.enum(['google', 'facebook', 'apple']),
  token: z.string().min(1, 'Social login token is required'),
  userData: z.object({
    email: emailSchema,
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    avatar: z.string().url().optional(),
  }),
});

// Type inference from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type PasswordResetFormData = z.infer<typeof passwordResetSchema>;
export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type PreferencesFormData = z.infer<typeof preferencesSchema>;
export type SavedSearchFormData = z.infer<typeof savedSearchSchema>;
export type SocialLoginData = z.infer<typeof socialLoginSchema>;
