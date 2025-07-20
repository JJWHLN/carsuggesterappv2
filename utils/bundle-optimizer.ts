
/**
 * Advanced Bundle Splitting Strategy
 * Split bundles for optimal loading and caching
 */

// utils/bundle-optimizer.ts
export class BundleOptimizer {
  
  // Core app bundle (critical path)
  static loadCoreBundle = async () => {
    return Promise.all([
      import('@/app/(tabs)/_layout'),
      import('@/components/ui/Button'),
      import('@/components/ui/LoadingSpinner'),
      import('@/utils/ultra-optimized-icons')
    ]);
  };
  
  // Feature bundles (lazy loaded)
  static loadFeatureBundle = async (feature: string) => {
    switch (feature) {
      case 'search':
        return import('@/app/(tabs)/search');
      case 'marketplace':
        return import('@/app/(tabs)/marketplace');
      case 'models':
        return import('@/app/(tabs)/models');
      case 'reviews':
        return import('@/app/(tabs)/reviews');
      case 'profile':
        return import('@/app/(tabs)/profile');
      default:
        throw new Error(`Unknown feature: ${feature}`);
    }
  };
  
  // Vendor bundles (cached separately)
  static loadVendorBundle = async () => {
    return Promise.all([
      import('react'),
      import('react-native'),
      import('@expo/vector-icons')
    ]);
  };
  
  // Utility for progressive loading
  static progressiveLoad = async (priority: 'high' | 'medium' | 'low') => {
    const loadOrder = {
      high: ['core', 'search', 'marketplace'],
      medium: ['models', 'reviews'], 
      low: ['profile', 'auth']
    };
    
    const bundles = loadOrder[priority] || [];
    
    for (const bundle of bundles) {
      try {
        await this.loadFeatureBundle(bundle);
        logger.debug(`✅ Loaded ${bundle} bundle`);
      } catch (error) {
        logger.warn(`⚠️  Failed to load ${bundle} bundle:`, error);
      }
    }
  };
}

// React Native bundle optimization hook
export const useBundleOptimization = () => {
  const [loadedBundles, setLoadedBundles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const loadBundle = useCallback(async (bundleName: string) => {
    if (loadedBundles.includes(bundleName)) {
      return; // Already loaded
    }
    
    setIsLoading(true);
    try {
      await BundleOptimizer.loadFeatureBundle(bundleName);
      setLoadedBundles(prev => [...prev, bundleName]);
      logger.debug(`📦 Bundle loaded: ${bundleName}`);
    } catch (error) {
      logger.error(`❌ Bundle load failed: ${bundleName}`, error);
    } finally {
      setIsLoading(false);
    }
  }, [loadedBundles]);
  
  // Preload bundles based on user behavior
  const preloadNextBundle = useCallback((currentRoute: string) => {
    const preloadMap = {
      '/': 'search',
      '/search': 'marketplace',
      '/marketplace': 'models',
      '/models': 'reviews'
    };
    
    const nextBundle = preloadMap[currentRoute];
    if (nextBundle && !loadedBundles.includes(nextBundle)) {
      setTimeout(() => loadBundle(nextBundle), 1000); // Preload after 1s
    }
  }, [loadBundle, loadedBundles]);
  
  return {
    loadBundle,
    preloadNextBundle,
    loadedBundles,
    isLoading,
    totalBundles: 6,
    loadProgress: loadedBundles.length / 6 * 100
  };
};
