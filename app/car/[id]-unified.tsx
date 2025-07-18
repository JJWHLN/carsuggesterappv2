import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { UnifiedDetailScreen } from '@/components/ui/UnifiedDetailScreen';
import { useComprehensiveTheme } from '@/hooks/useComprehensiveTheme';
import { notifications } from '@/services/notifications';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';

// Mock API call
const fetchCarDetails = async (id: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Mock car data
  return {
    id,
    name: `Car Model ${id}`,
    brand: 'Toyota',
    year: 2023,
    price: 25000,
    description: 'A reliable and efficient car perfect for daily commuting.',
    images: ['https://example.com/car1.jpg', 'https://example.com/car2.jpg'],
    specifications: {
      engine: '2.0L 4-cylinder',
      transmission: 'CVT',
      fuelType: 'Gasoline',
      mileage: '32 mpg',
    },
    dealer: {
      name: 'Premium Auto',
      phone: '(555) 123-4567',
      location: 'Downtown',
    },
    isSaved: false,
  };
};

export default function CarDetailScreen() {
  const { theme } = useComprehensiveTheme();

  const renderCarHeader = (car: any) => (
    <View style={styles.headerContainer}>
      <Image 
        source={{ uri: car.images[0] }} 
        style={styles.carImage}
        defaultSource={require('@/assets/images/car-placeholder.png')}
      />
      <View style={styles.headerInfo}>
        <Text style={[styles.carName, { color: theme.colors.onSurface }]}>
          {car.name}
        </Text>
        <Text style={[styles.carBrand, { color: theme.colors.onSurfaceVariant }]}>
          {car.brand} • {car.year}
        </Text>
        <Text style={[styles.carPrice, { color: theme.colors.primary }]}>
          ${car.price.toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const renderCarActions = (car: any) => (
    <View style={styles.actionsContainer}>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => notifications.car.savedSuccess()}
      >
        <Ionicons 
          name={car.isSaved ? 'heart' : 'heart-outline'} 
          size={24} 
          color={theme.colors.primary} 
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => notifications.comingSoon('Share')}
      >
        <Ionicons 
          name="share-outline" 
          size={24} 
          color={theme.colors.onSurface} 
        />
      </TouchableOpacity>
    </View>
  );

  const renderCarContent = (car: any) => (
    <View style={styles.contentContainer}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Description
        </Text>
        <Text style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
          {car.description}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Specifications
        </Text>
        {Object.entries(car.specifications).map(([key, value]) => (
          <View key={key} style={styles.specRow}>
            <Text style={[styles.specLabel, { color: theme.colors.onSurfaceVariant }]}>
              {key.charAt(0).toUpperCase() + key.slice(1)}:
            </Text>
            <Text style={[styles.specValue, { color: theme.colors.onSurface }]}>
              {value as string}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
          Dealer Information
        </Text>
        <Text style={[styles.dealerName, { color: theme.colors.onSurface }]}>
          {car.dealer.name}
        </Text>
        <Text style={[styles.dealerInfo, { color: theme.colors.onSurfaceVariant }]}>
          {car.dealer.location}
        </Text>
        <Text style={[styles.dealerInfo, { color: theme.colors.onSurfaceVariant }]}>
          {car.dealer.phone}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <Button
          title="Contact Dealer"
          onPress={() => notifications.car.contactDealer(car.dealer.name, () => {
            notifications.comingSoon('Contact Dealer');
          })}
          style={styles.contactButton}
        />
        <Button
          title="Schedule Test Drive"
          variant="outline"
          onPress={() => notifications.comingSoon('Schedule Test Drive')}
          style={styles.testDriveButton}
        />
      </View>
    </View>
  );

  const styles = StyleSheet.create({
    headerContainer: {
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    carImage: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginBottom: 12,
    },
    headerInfo: {
      alignItems: 'center',
    },
    carName: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    carBrand: {
      fontSize: 16,
      marginBottom: 8,
    },
    carPrice: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    iconButton: {
      padding: 8,
      borderRadius: 20,
    },
    contentContainer: {
      gap: 24,
    },
    section: {
      gap: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    description: {
      fontSize: 14,
      lineHeight: 20,
    },
    specRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    specLabel: {
      fontSize: 14,
      flex: 1,
    },
    specValue: {
      fontSize: 14,
      fontWeight: '500',
      flex: 1,
      textAlign: 'right',
    },
    dealerName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    dealerInfo: {
      fontSize: 14,
    },
    actionButtons: {
      gap: 12,
      paddingTop: 16,
    },
    contactButton: {
      marginBottom: 0,
    },
    testDriveButton: {
      marginBottom: 0,
    },
  });

  return (
    <UnifiedDetailScreen
      fetchData={fetchCarDetails}
      renderHeader={renderCarHeader}
      renderActions={renderCarActions}
      renderContent={renderCarContent}
      title="Car Details"
      loadingText="Loading car details..."
      errorTitle="Car Not Found"
      errorMessage="The car you're looking for could not be found."
      onDataLoaded={(car) => {
        console.log('Car loaded:', car.name);
      }}
    />
  );
}
