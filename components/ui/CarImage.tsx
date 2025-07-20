import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ImageProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/hooks/useTheme';

interface CarImageProps extends Omit<ImageProps, 'source'> {
  uri?: string;
  style?: any;
  showLabel?: boolean;
  placeholderSize?: 'small' | 'medium' | 'large';
}

export const CarImage: React.FC<CarImageProps> = ({ 
  uri, 
  style, 
  showLabel = true,
  placeholderSize = 'medium',
  ...imageProps 
}) => {
  const [imageError, setImageError] = useState(false);
  const { colors } = useThemeColors();

  const getIconSize = () => {
    switch (placeholderSize) {
      case 'small': return 24;
      case 'large': return 64;
      default: return 48;
    }
  };

  const getFontSize = () => {
    switch (placeholderSize) {
      case 'small': return 10;
      case 'large': return 14;
      default: return 12;
    }
  };

  if (!uri || imageError) {
    return (
      <View style={[
        style, 
        styles.placeholder,
        { backgroundColor: colors.surface }
      ]}>
        <Ionicons 
          name="car-outline" 
          size={getIconSize()} 
          color={colors.textSecondary} 
        />
        {showLabel && (
          <Text style={[
            styles.placeholderText,
            { 
              color: colors.textSecondary,
              fontSize: getFontSize()
            }
          ]}>
            No Image
          </Text>
        )}
      </View>
    );
  }

  return (
    <Image 
      source={{ uri }} 
      style={style}
      onError={() => setImageError(true)}
      {...imageProps}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  placeholderText: {
    fontWeight: '500',
    marginTop: 6,
  },
});

export default CarImage;
