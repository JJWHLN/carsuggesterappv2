import { Dimensions, PixelRatio } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export const optimizeImageUrl = (
  url: string,
  quality: 'low' | 'medium' | 'high' = 'medium',
): string => {
  if (!url || typeof url !== 'string') return url;

  const pixelRatio = PixelRatio.get();

  let targetWidth: number;
  switch (quality) {
    case 'low':
      targetWidth = Math.min(screenWidth * 0.7, 400);
      break;
    case 'medium':
      targetWidth = Math.min(screenWidth * pixelRatio * 0.8, 800);
      break;
    case 'high':
      targetWidth = Math.min(screenWidth * pixelRatio, 1200);
      break;
  }

  const separator = url.includes('?') ? '&' : '?';
  const qualityParam = quality === 'low' ? 70 : quality === 'medium' ? 85 : 95;

  return `${url}${separator}w=${Math.round(targetWidth)}&q=${qualityParam}&f=webp`;
};
