/**
 * Elite Design System - Visual Analysis & Strategy
 * 
 * COMPETITIVE ANALYSIS: Current market leaders and their visual DNA
 * 
 * 1. AIRBNB - Premium marketplace aesthetic
 *    - Clean, white space with strategic color accents
 *    - High-quality photography as hero elements
 *    - Rounded corners and soft shadows
 *    - Trustworthy typography and clear pricing
 * 
 * 2. UBER - Sophisticated service platform
 *    - Dark mode excellence with premium feel
 *    - Minimal interface with maximum functionality
 *    - Real-time status indicators
 *    - Professional color palette (black, white, green accents)
 * 
 * 3. SPOTIFY - AI-powered discovery interface
 *    - Dynamic gradients and vibrant colors
 *    - Personalized content sections
 *    - Card-based browsing with rich media
 *    - Dark UI with colorful accents
 * 
 * 4. INSTAGRAM - Visual-first engagement
 *    - Stories and feed integration
 *    - Rich media with engagement overlays
 *    - Clean typography with bold call-to-actions
 *    - White UI with black text, strategic color pops
 * 
 * 5. ZILLOW - Real estate marketplace excellence
 *    - Map integration with list view toggle
 *    - Price-forward display with key details
 *    - Clean search filters and sorting
 *    - Professional photography with overlay data
 * 
 * 6. TIKTOK - Engagement-maximized interface
 *    - Full-screen media consumption
 *    - Floating action buttons
 *    - Infinite scroll optimization
 *    - Bold typography with high contrast
 * 
 * 7. NETFLIX - AI recommendation mastery
 *    - Row-based content discovery
 *    - Sophisticated categorization
 *    - Rich preview experiences
 *    - Dark theme with strategic red accents
 * 
 * CARSUGGESTER VISUAL STRATEGY:
 * 
 * MARKETPLACE SIDE (Zillow + Airbnb DNA):
 * - Premium photography with data overlays
 * - Clean search and filtering
 * - Trust indicators and verification badges
 * - Price-forward design with clear hierarchy
 * 
 * REVIEWS SIDE (Instagram + Yelp DNA):
 * - Visual review cards with user photos
 * - Star ratings with rich context
 * - User-generated content showcase
 * - Social proof and engagement metrics
 * 
 * AI FUNCTIONALITY (Netflix + Spotify DNA):
 * - Personalized recommendation rows
 * - AI confidence indicators
 * - Smart categorization and discovery
 * - Predictive search and suggestions
 * 
 * CORE VISUAL PRINCIPLES:
 * 1. Photography-first approach (car images are heroes)
 * 2. Premium typography and spacing
 * 3. Strategic use of color (trust, excitement, professionalism)
 * 4. Micro-interactions and smooth animations
 * 5. Dark/light mode excellence
 * 6. Accessibility and inclusive design
 */

export interface EliteDesignSystem {
  // Core Brand Colors (inspired by premium automotive brands)
  colors: {
    // Primary palette - automotive luxury
    automotive: {
      platinum: '#E5E7EB',    // Premium silver
      carbonFiber: '#1F2937', // Deep carbon black
      racingRed: '#EF4444',   // Performance red
      electricBlue: '#3B82F6', // Electric vehicle blue
      premiumGold: '#F59E0B',  // Luxury gold accent
    },
    
    // Semantic colors - trust and performance
    success: {
      primary: '#10B981',     // Verified/approved green
      light: '#D1FAE5',       // Success background
      dark: '#065F46',        // Deep success
    },
    
    error: {
      primary: '#EF4444',     // Alert/warning red
      light: '#FEE2E2',       // Error background
      dark: '#991B1B',        // Deep error
    },
    
    warning: {
      primary: '#F59E0B',     // Attention amber
      light: '#FEF3C7',       // Warning background
      dark: '#92400E',        // Deep warning
    },
    
    // Marketplace colors - trust and professionalism
    marketplace: {
      primary: '#1E40AF',     // Deep trustworthy blue
      secondary: '#7C3AED',   // Premium purple
      accent: '#059669',      // Success green
      neutral: '#6B7280',     // Professional gray
    },
    
    // Review system colors - engagement and social
    reviews: {
      star: '#FBBF24',        // Star rating gold
      like: '#EF4444',        // Like heart red
      verified: '#10B981',    // Verified badge green
      trending: '#8B5CF6',    // Trending purple
    },
    
    // AI/Tech colors - innovation and intelligence
    ai: {
      neural: '#6366F1',      // AI neural network blue
      prediction: '#8B5CF6',  // Prediction purple
      learning: '#EC4899',    // Machine learning pink
      data: '#06B6D4',        // Data cyan
    }
  },
  
  // Typography system - premium and readable
  typography: {
    // Headings - impact and hierarchy
    display: {
      fontSize: 36,
      fontWeight: '800',
      lineHeight: 44,
      letterSpacing: -0.02,
    },
    h1: {
      fontSize: 30,
      fontWeight: '700',
      lineHeight: 38,
      letterSpacing: -0.01,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
      letterSpacing: 0,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
      letterSpacing: 0,
    },
    h4: {
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 26,
      letterSpacing: 0,
    },
    
    // Body text - readability and hierarchy
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodyMedium: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      letterSpacing: 0,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 18,
      letterSpacing: 0.01,
    },
    
    // Specialized text - calls to action and labels
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 20,
      letterSpacing: 0.01,
    },
    caption: {
      fontSize: 11,
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 0.02,
    },
    overline: {
      fontSize: 10,
      fontWeight: '700',
      lineHeight: 14,
      letterSpacing: 0.05,
    }
  },
  
  // Spacing system - consistent rhythm
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },
  
  // Elevation and shadows - premium depth
  elevation: {
    low: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    high: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    premium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
      elevation: 12,
    }
  },
  
  // Border radius system - modern and consistent
  borderRadius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 999,
  },
  
  // Animation system - smooth and premium
  animations: {
    fast: 150,
    normal: 250,
    slow: 350,
    spring: {
      damping: 15,
      stiffness: 150,
    }
  }
}

// Component-specific design patterns
export interface ComponentDesignPatterns {
  // Car cards - marketplace hero elements
  carCard: {
    aspectRatio: number;
    borderRadius: number;
    shadow: string;
    imageOverlay: boolean;
    pricePosition: string;
    actionsPosition: string;
    gradientOverlay: string;
  };
  
  // Review cards - social proof elements
  reviewCard: {
    aspectRatio: number;
    borderRadius: number;
    shadow: string;
    userAvatar: string;
    rating: string;
    content: string;
  };
  
  // Search interface - discovery optimization
  searchInterface: {
    searchBar: string;
    filters: string;
    results: string;
    sorting: string;
    viewToggle: string;
  };
  
  // AI recommendations - personalization showcase
  aiRecommendations: {
    layout: string;
    confidence: string;
    explanation: string;
    refresh: string;
  };
}

export const ELITE_DESIGN_SYSTEM: EliteDesignSystem = {
  colors: {
    automotive: {
      platinum: '#E5E7EB',
      carbonFiber: '#1F2937',
      racingRed: '#EF4444',
      electricBlue: '#3B82F6',
      premiumGold: '#F59E0B',
    },
    success: {
      primary: '#10B981',
      light: '#D1FAE5',
      dark: '#065F46',
    },
    error: {
      primary: '#EF4444',
      light: '#FEE2E2',
      dark: '#991B1B',
    },
    warning: {
      primary: '#F59E0B',
      light: '#FEF3C7',
      dark: '#92400E',
    },
    marketplace: {
      primary: '#1E40AF',
      secondary: '#7C3AED',
      accent: '#059669',
      neutral: '#6B7280',
    },
    reviews: {
      star: '#FBBF24',
      like: '#EF4444',
      verified: '#10B981',
      trending: '#8B5CF6',
    },
    ai: {
      neural: '#6366F1',
      prediction: '#8B5CF6',
      learning: '#EC4899',
      data: '#06B6D4',
    }
  },
  typography: {
    display: { fontSize: 36, fontWeight: '800', lineHeight: 44, letterSpacing: -0.02 },
    h1: { fontSize: 30, fontWeight: '700', lineHeight: 38, letterSpacing: -0.01 },
    h2: { fontSize: 24, fontWeight: '600', lineHeight: 32, letterSpacing: 0 },
    h3: { fontSize: 20, fontWeight: '600', lineHeight: 28, letterSpacing: 0 },
    h4: { fontSize: 18, fontWeight: '500', lineHeight: 26, letterSpacing: 0 },
    bodyLarge: { fontSize: 16, fontWeight: '400', lineHeight: 24, letterSpacing: 0 },
    bodyMedium: { fontSize: 14, fontWeight: '400', lineHeight: 20, letterSpacing: 0 },
    bodySmall: { fontSize: 12, fontWeight: '400', lineHeight: 18, letterSpacing: 0.01 },
    button: { fontSize: 16, fontWeight: '600', lineHeight: 20, letterSpacing: 0.01 },
    caption: { fontSize: 11, fontWeight: '500', lineHeight: 16, letterSpacing: 0.02 },
    overline: { fontSize: 10, fontWeight: '700', lineHeight: 14, letterSpacing: 0.05 },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48, xxxl: 64 },
  elevation: {
    low: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    medium: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
    high: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 8 },
    premium: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12 }
  },
  borderRadius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, xxl: 24, round: 999 },
  animations: {
    fast: 150,
    normal: 250,
    slow: 350,
    spring: { damping: 15, stiffness: 150 }
  }
};

export default ELITE_DESIGN_SYSTEM;
