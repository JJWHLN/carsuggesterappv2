import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  Car,
  DollarSign,
  Zap,
  Shield,
  MapPin,
  Users,
  Fuel,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react-native';
import { useAuth } from '../auth/AuthContext';

const { width } = Dimensions.get('window');

interface OnboardingQuizProps {
  navigation?: any;
  onComplete?: () => void;
}

interface QuizQuestion {
  id: string;
  title: string;
  subtitle: string;
  type: 'single' | 'multiple' | 'range';
  options?: QuizOption[];
  min?: number;
  max?: number;
  step?: number;
  required: boolean;
}

interface QuizOption {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  color?: string;
  description?: string;
}

interface QuizAnswers {
  [questionId: string]: string | string[] | number;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'budget',
    title: "What's your budget?",
    subtitle: 'This helps us show you cars in your price range',
    type: 'single',
    required: true,
    options: [
      {
        id: 'under15k',
        label: 'Under $15,000',
        icon: DollarSign,
        color: 'bg-green-100 text-green-700',
      },
      {
        id: '15k-25k',
        label: '$15,000 - $25,000',
        icon: DollarSign,
        color: 'bg-blue-100 text-blue-700',
      },
      {
        id: '25k-40k',
        label: '$25,000 - $40,000',
        icon: DollarSign,
        color: 'bg-purple-100 text-purple-700',
      },
      {
        id: '40k-60k',
        label: '$40,000 - $60,000',
        icon: DollarSign,
        color: 'bg-orange-100 text-orange-700',
      },
      {
        id: 'over60k',
        label: 'Over $60,000',
        icon: DollarSign,
        color: 'bg-red-100 text-red-700',
      },
    ],
  },
  {
    id: 'bodyStyle',
    title: 'What type of car do you prefer?',
    subtitle: 'Select all that interest you',
    type: 'multiple',
    required: true,
    options: [
      {
        id: 'sedan',
        label: 'Sedan',
        icon: Car,
        description: 'Comfortable and fuel-efficient',
      },
      {
        id: 'suv',
        label: 'SUV',
        icon: Car,
        description: 'Spacious with higher seating',
      },
      {
        id: 'hatchback',
        label: 'Hatchback',
        icon: Car,
        description: 'Compact and practical',
      },
      {
        id: 'truck',
        label: 'Truck',
        icon: Car,
        description: 'Powerful with cargo space',
      },
      {
        id: 'coupe',
        label: 'Coupe',
        icon: Car,
        description: 'Sporty two-door design',
      },
      {
        id: 'convertible',
        label: 'Convertible',
        icon: Car,
        description: 'Open-air driving experience',
      },
    ],
  },
  {
    id: 'primaryUse',
    title: 'How will you primarily use your car?',
    subtitle: 'This helps us prioritize features',
    type: 'single',
    required: true,
    options: [
      {
        id: 'commuting',
        label: 'Daily Commuting',
        icon: MapPin,
        description: 'City driving and highways',
      },
      {
        id: 'family',
        label: 'Family Transportation',
        icon: Users,
        description: 'School runs and errands',
      },
      {
        id: 'weekend',
        label: 'Weekend Adventures',
        icon: Car,
        description: 'Road trips and recreation',
      },
      {
        id: 'work',
        label: 'Business Use',
        icon: Car,
        description: 'Professional needs',
      },
    ],
  },
  {
    id: 'fuelEfficiency',
    title: 'How important is fuel efficiency?',
    subtitle: 'Rate from 1 (not important) to 5 (very important)',
    type: 'range',
    min: 1,
    max: 5,
    step: 1,
    required: true,
  },
  {
    id: 'features',
    title: 'Which features are must-haves?',
    subtitle: 'Select all features you consider essential',
    type: 'multiple',
    required: false,
    options: [
      { id: 'awd', label: 'All-Wheel Drive', icon: Car },
      { id: 'sunroof', label: 'Sunroof/Moonroof', icon: Car },
      { id: 'leather', label: 'Leather Seats', icon: Car },
      { id: 'navigation', label: 'Navigation System', icon: MapPin },
      { id: 'backup_camera', label: 'Backup Camera', icon: Car },
      { id: 'bluetooth', label: 'Bluetooth', icon: Car },
      { id: 'heated_seats', label: 'Heated Seats', icon: Car },
      { id: 'keyless', label: 'Keyless Entry', icon: Car },
      { id: 'carplay', label: 'Apple CarPlay/Android Auto', icon: Car },
    ],
  },
  {
    id: 'safety',
    title: 'How important is safety rating?',
    subtitle: 'Rate from 1 (not important) to 5 (very important)',
    type: 'range',
    min: 1,
    max: 5,
    step: 1,
    required: true,
  },
  {
    id: 'brands',
    title: 'Any preferred car brands?',
    subtitle: 'Select brands you trust or are interested in',
    type: 'multiple',
    required: false,
    options: [
      { id: 'toyota', label: 'Toyota' },
      { id: 'honda', label: 'Honda' },
      { id: 'ford', label: 'Ford' },
      { id: 'chevrolet', label: 'Chevrolet' },
      { id: 'nissan', label: 'Nissan' },
      { id: 'bmw', label: 'BMW' },
      { id: 'mercedes', label: 'Mercedes-Benz' },
      { id: 'audi', label: 'Audi' },
      { id: 'mazda', label: 'Mazda' },
      { id: 'subaru', label: 'Subaru' },
      { id: 'hyundai', label: 'Hyundai' },
      { id: 'kia', label: 'Kia' },
    ],
  },
];

export const OnboardingQuiz: React.FC<OnboardingQuizProps> = ({
  navigation,
  onComplete,
}) => {
  const { actions } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === QUIZ_QUESTIONS.length - 1;
  const canGoNext =
    !currentQuestion.required || answers[currentQuestion.id] !== undefined;

  const handleSingleAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  const handleMultipleAnswer = (questionId: string, optionId: string) => {
    setAnswers((prev) => {
      const currentAnswers = (prev[questionId] as string[]) || [];
      const isSelected = currentAnswers.includes(optionId);

      return {
        ...prev,
        [questionId]: isSelected
          ? currentAnswers.filter((id) => id !== optionId)
          : [...currentAnswers, optionId],
      };
    });
  };

  const handleRangeAnswer = (questionId: string, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const goToNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Transform answers to user preferences format
      const preferences = {
        budget: getBudgetRange(answers.budget as string),
        bodyStyles: (answers.bodyStyle as string[]) || [],
        primaryUse: answers.primaryUse as string,
        fuelEfficiencyImportance: answers.fuelEfficiency as number,
        requiredFeatures: (answers.features as string[]) || [],
        safetyImportance: answers.safety as number,
        preferredBrands: (answers.brands as string[]) || [],
      };

      await actions.updatePreferences(preferences);

      Alert.alert(
        'Setup Complete!',
        "Your preferences have been saved. We'll use this to personalize your car recommendations.",
        [
          {
            text: 'Get Started',
            onPress: () => {
              onComplete?.();
              navigation?.navigate('Home');
            },
          },
        ],
      );
    } catch (error) {
      console.error('Failed to save preferences:', error);
      Alert.alert(
        'Error',
        'Failed to save your preferences. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBudgetRange = (budgetId: string): { min: number; max: number } => {
    switch (budgetId) {
      case 'under15k':
        return { min: 0, max: 15000 };
      case '15k-25k':
        return { min: 15000, max: 25000 };
      case '25k-40k':
        return { min: 25000, max: 40000 };
      case '40k-60k':
        return { min: 40000, max: 60000 };
      case 'over60k':
        return { min: 60000, max: 200000 };
      default:
        return { min: 0, max: 50000 };
    }
  };

  const renderSingleChoice = () => (
    <View className="space-y-3">
      {currentQuestion.options?.map((option) => {
        const isSelected = answers[currentQuestion.id] === option.id;
        const IconComponent = option.icon;

        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => handleSingleAnswer(currentQuestion.id, option.id)}
            className={`p-4 border-2 rounded-lg ${
              isSelected
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <View className="flex-row items-center">
              {IconComponent && (
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    option.color || 'bg-gray-100'
                  }`}
                >
                  <IconComponent size={20} />
                </View>
              )}
              <View className="flex-1">
                <Text
                  className={`font-semibold ${
                    isSelected ? 'text-green-900' : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </Text>
                {option.description && (
                  <Text
                    className={`text-sm mt-1 ${
                      isSelected ? 'text-green-700' : 'text-gray-600'
                    }`}
                  >
                    {option.description}
                  </Text>
                )}
              </View>
              {isSelected && (
                <CheckCircle size={24} className="text-green-500" />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderMultipleChoice = () => (
    <View className="space-y-3">
      {currentQuestion.options?.map((option) => {
        const selectedAnswers = (answers[currentQuestion.id] as string[]) || [];
        const isSelected = selectedAnswers.includes(option.id);
        const IconComponent = option.icon;

        return (
          <TouchableOpacity
            key={option.id}
            onPress={() => handleMultipleAnswer(currentQuestion.id, option.id)}
            className={`p-4 border-2 rounded-lg ${
              isSelected
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <View className="flex-row items-center">
              {IconComponent && (
                <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
                  <IconComponent size={20} />
                </View>
              )}
              <View className="flex-1">
                <Text
                  className={`font-semibold ${
                    isSelected ? 'text-green-900' : 'text-gray-900'
                  }`}
                >
                  {option.label}
                </Text>
                {option.description && (
                  <Text
                    className={`text-sm mt-1 ${
                      isSelected ? 'text-green-700' : 'text-gray-600'
                    }`}
                  >
                    {option.description}
                  </Text>
                )}
              </View>
              <View
                className={`w-6 h-6 border-2 rounded ${
                  isSelected
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300 bg-white'
                } items-center justify-center`}
              >
                {isSelected && <CheckCircle size={16} className="text-white" />}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderRangeChoice = () => {
    const currentValue =
      (answers[currentQuestion.id] as number) || currentQuestion.min || 1;

    return (
      <View className="items-center">
        <View className="w-full bg-gray-200 h-2 rounded-full mb-6">
          <View
            className="bg-green-500 h-2 rounded-full"
            style={{
              width: `${((currentValue - (currentQuestion.min || 1)) / ((currentQuestion.max || 5) - (currentQuestion.min || 1))) * 100}%`,
            }}
          />
        </View>

        <Text className="text-4xl font-bold text-green-600 mb-4">
          {currentValue}
        </Text>

        <View className="flex-row justify-between w-full px-4 mb-8">
          {Array.from(
            {
              length:
                (currentQuestion.max || 5) - (currentQuestion.min || 1) + 1,
            },
            (_, i) => {
              const value = (currentQuestion.min || 1) + i;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => handleRangeAnswer(currentQuestion.id, value)}
                  className={`w-12 h-12 rounded-full items-center justify-center ${
                    currentValue === value ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`font-bold ${
                      currentValue === value ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {value}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </View>

        <View className="flex-row justify-between w-full px-4">
          <Text className="text-sm text-gray-600">Not Important</Text>
          <Text className="text-sm text-gray-600">Very Important</Text>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4 pt-12">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-2xl font-bold text-gray-900">
            Car Preferences
          </Text>
          <Text className="text-sm text-gray-600">
            {currentQuestionIndex + 1} of {QUIZ_QUESTIONS.length}
          </Text>
        </View>

        {/* Progress Bar */}
        <View className="w-full bg-gray-200 h-2 rounded-full">
          <View
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentQuestionIndex + 1) / QUIZ_QUESTIONS.length) * 100}%`,
            }}
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <View className="py-6">
          {/* Question */}
          <View className="mb-8">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              {currentQuestion.title}
            </Text>
            <Text className="text-gray-600 text-lg leading-6">
              {currentQuestion.subtitle}
            </Text>
          </View>

          {/* Answer Options */}
          <View className="mb-8">
            {currentQuestion.type === 'single' && renderSingleChoice()}
            {currentQuestion.type === 'multiple' && renderMultipleChoice()}
            {currentQuestion.type === 'range' && renderRangeChoice()}
          </View>
        </View>
      </ScrollView>

      {/* Navigation */}
      <View className="bg-white border-t border-gray-200 px-4 py-4">
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={goToPrevious}
            disabled={currentQuestionIndex === 0}
            className={`flex-row items-center px-4 py-3 rounded-lg ${
              currentQuestionIndex === 0 ? 'opacity-50' : ''
            }`}
          >
            <ArrowLeft size={20} className="text-gray-600 mr-2" />
            <Text className="text-gray-600 font-medium">Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToNext}
            disabled={!canGoNext || isSubmitting}
            className={`flex-row items-center px-6 py-3 rounded-lg ${
              canGoNext && !isSubmitting ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text
                  className={`font-semibold mr-2 ${
                    canGoNext ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {isLastQuestion ? 'Complete Setup' : 'Next'}
                </Text>
                <ArrowRight
                  size={20}
                  className={canGoNext ? 'text-white' : 'text-gray-500'}
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
