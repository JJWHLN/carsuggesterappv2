
/**
 * Conditional Network Info Loading
 * Reduces bundle size by loading only when needed
 */

let NetInfo: any = null;

export const getNetworkInfo = async () => {
  if (!NetInfo) {
    try {
      NetInfo = await import('@react-native-community/netinfo');
      return await NetInfo.default.fetch();
    } catch (error) {
      logger.warn('NetInfo not available:', error);
      return { isConnected: true }; // Fallback
    }
  }
  return await NetInfo.fetch();
};

export const useNetworkInfo = () => {
  const [isConnected, setIsConnected] = useState(true);
  
  useEffect(() => {
    getNetworkInfo().then(state => {
      setIsConnected(state.isConnected ?? true);
    });
  }, []);
  
  return isConnected;
};
