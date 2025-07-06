import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AddCarScreen from '@/app/add-car';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock services
const mockStorageService = {
  uploadCarImages: jest.fn()
};

const mockVehicleListingService = {
  createListing: jest.fn()
};

jest.mock('@/services/storageService', () => ({
  StorageService: mockStorageService
}));

jest.mock('@/services/featureServices', () => ({
  VehicleListingService: mockVehicleListingService
}));

// Mock expo-router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: mockRouter,
  useRouter: () => mockRouter,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');
jest.spyOn(Alert, 'prompt');

describe('Car Listing Form Integration Tests', () => {
  const renderWithAuth = (component: React.ReactElement) => {
    return render(
      <AuthProvider>
        {component}
      </AuthProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Form Validation', () => {
    it('should validate required fields', async () => {
      const { getByText } = renderWithAuth(<AddCarScreen />);

      // Try to submit without filling required fields
      fireEvent.press(getByText('Submit Listing'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Errors',
          expect.stringContaining('required')
        );
      });
    });

    it('should validate make field', async () => {
      const { getByText, getAllByText } = renderWithAuth(<AddCarScreen />);

      // Find and tap Make field
      const makeFields = getAllByText('Make');
      fireEvent.press(makeFields[0]);

      // Mock the prompt response with invalid data
      const mockPromptCall = jest.mocked(Alert.prompt).mock.calls[0];
      const onTextCallback = mockPromptCall[2] as (text: string) => void;
      onTextCallback('X'); // Too short

      // Try to submit
      fireEvent.press(getByText('Submit Listing'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Errors',
          expect.stringContaining('must be at least 2 characters')
        );
      });
    });

    it('should validate year field', async () => {
      const { getByText, getAllByText } = renderWithAuth(<AddCarScreen />);

      // Find and tap Year field
      const yearFields = getAllByText('Year');
      fireEvent.press(yearFields[0]);

      // Mock the prompt response with invalid year
      const mockPromptCall = jest.mocked(Alert.prompt).mock.calls[0];
      const onTextCallback = mockPromptCall[2] as (text: string) => void;
      onTextCallback('1800'); // Too old

      // Try to submit
      fireEvent.press(getByText('Submit Listing'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Errors',
          expect.stringContaining('must be at least 1900')
        );
      });
    });

    it('should validate price field', async () => {
      const { getByText, getAllByText } = renderWithAuth(<AddCarScreen />);

      // Find and tap Price field
      const priceFields = getAllByText('Price');
      fireEvent.press(priceFields[0]);

      // Mock the prompt response with negative price
      const mockPromptCall = jest.mocked(Alert.prompt).mock.calls[0];
      const onTextCallback = mockPromptCall[2] as (text: string) => void;
      onTextCallback('-1000');

      // Try to submit
      fireEvent.press(getByText('Submit Listing'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Errors',
          expect.stringContaining('must be at least 0')
        );
      });
    });

    it('should accept valid form data', async () => {
      const { getByText, getAllByText } = renderWithAuth(<AddCarScreen />);

      // Fill out all required fields with valid data
      const fields = [
        { label: 'Make', value: 'Toyota' },
        { label: 'Model', value: 'Camry' },
        { label: 'Year', value: '2020' },
        { label: 'Price', value: '25000' },
        { label: 'Mileage', value: '30000' },
        { label: 'Location', value: 'Los Angeles, CA' },
      ];

      for (const field of fields) {
        const fieldElements = getAllByText(field.label);
        fireEvent.press(fieldElements[0]);

        const mockPromptCall = jest.mocked(Alert.prompt).mock.calls.slice(-1)[0];
        const onTextCallback = mockPromptCall[2] as (text: string) => void;
        onTextCallback(field.value);
      }

      // Select condition
      const conditionFields = getAllByText('Condition');
      fireEvent.press(conditionFields[0]);

      // Mock Alert.alert for condition selection
      const mockAlertCall = jest.mocked(Alert.alert).mock.calls.slice(-1)[0];
      const conditionOptions = mockAlertCall[2] as any[];
      const excellentOption = conditionOptions.find(opt => opt.text === 'Excellent');
      excellentOption.onPress();

      // Mock successful API calls
      mockStorageService.uploadCarImages.mockResolvedValue(['image1.jpg']);
      mockVehicleListingService.createListing.mockResolvedValue({ id: '123' });

      // Submit form
      fireEvent.press(getByText('Submit Listing'));

      await waitFor(() => {
        expect(mockVehicleListingService.createListing).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            make: 'Toyota',
            model: 'Camry',
            year: 2020,
            price: 25000,
            mileage: 30000,
            location_city: 'Los Angeles',
            location_state: 'CA',
            condition: 'excellent'
          })
        );
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Success!',
          'Your car listing has been created successfully.',
          expect.any(Array)
        );
      });
    });
  });

  describe('Image Upload', () => {
    it('should handle image upload errors gracefully', async () => {
      const { getByText } = renderWithAuth(<AddCarScreen />);

      // Add an image
      fireEvent.press(getByText('Add Photos'));

      // Mock camera option
      const mockAlertCall = jest.mocked(Alert.alert).mock.calls.slice(-1)[0];
      const alertOptions = mockAlertCall[2] as any[];
      const cameraOption = alertOptions.find(opt => opt.text === 'Camera');
      cameraOption.onPress();

      // Fill out required fields quickly for this test
      const { getAllByText } = renderWithAuth(<AddCarScreen />);
      const fields = [
        { label: 'Make', value: 'Toyota' },
        { label: 'Model', value: 'Camry' },
        { label: 'Year', value: '2020' },
        { label: 'Price', value: '25000' },
        { label: 'Location', value: 'Los Angeles, CA' },
      ];

      for (const field of fields) {
        const fieldElements = getAllByText(field.label);
        fireEvent.press(fieldElements[0]);

        const mockPromptCall = jest.mocked(Alert.prompt).mock.calls.slice(-1)[0];
        const onTextCallback = mockPromptCall[2] as (text: string) => void;
        onTextCallback(field.value);
      }

      // Mock failed image upload but successful listing creation
      mockStorageService.uploadCarImages.mockRejectedValue(new Error('Upload failed'));
      mockVehicleListingService.createListing.mockResolvedValue({ id: '123' });

      // Submit form
      fireEvent.press(getByText('Submit Listing'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Upload Warning',
          'Some images failed to upload. The listing will be created without images.'
        );
      });

      await waitFor(() => {
        expect(mockVehicleListingService.createListing).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            images: [] // Should be empty due to upload failure
          })
        );
      });
    });

    it('should limit maximum number of images', async () => {
      const { getByText } = renderWithAuth(<AddCarScreen />);

      // Mock that we already have 8 images (maximum)
      const screen = render(<AddCarScreen />);
      
      // Simulate adding 9th image
      fireEvent.press(getByText('Add Photos'));

      // Should show maximum photos alert
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Maximum Photos',
          'You can upload up to 8 photos.'
        );
      });
    });
  });

  describe('Authentication Requirements', () => {
    it('should require authentication before listing', async () => {
      // Mock unauthenticated state
      const unauthenticatedContext = {
        session: null,
        user: null,
        role: null,
        loading: false,
        isNewUser: false,
        signInWithPassword: jest.fn(),
        signUpWithPassword: jest.fn(),
        signOut: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        markOnboardingComplete: jest.fn(),
      };

      const { getByText } = render(<AddCarScreen />);

      // Try to submit without authentication
      fireEvent.press(getByText('Submit Listing'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Authentication Required',
          'You need to sign in to list a car.',
          expect.arrayContaining([
            expect.objectContaining({ text: 'Sign In' }),
            expect.objectContaining({ text: 'Cancel' })
          ])
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle listing creation failures', async () => {
      const { getByText, getAllByText } = renderWithAuth(<AddCarScreen />);

      // Fill out required fields
      const fields = [
        { label: 'Make', value: 'Toyota' },
        { label: 'Model', value: 'Camry' },
        { label: 'Year', value: '2020' },
        { label: 'Price', value: '25000' },
        { label: 'Location', value: 'Los Angeles, CA' },
      ];

      for (const field of fields) {
        const fieldElements = getAllByText(field.label);
        fireEvent.press(fieldElements[0]);

        const mockPromptCall = jest.mocked(Alert.prompt).mock.calls.slice(-1)[0];
        const onTextCallback = mockPromptCall[2] as (text: string) => void;
        onTextCallback(field.value);
      }

      // Mock failed listing creation
      mockVehicleListingService.createListing.mockRejectedValue(
        new Error('Server error')
      );

      // Submit form
      fireEvent.press(getByText('Submit Listing'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'Server error'
        );
      });
    });
  });
});
