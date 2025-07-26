import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  BellOff,
  Plus,
  Edit3,
  Trash2,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Clock,
  Mail,
  Smartphone,
  Check,
  X,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '../auth/AuthContext';
import {
  fetchUserPriceAlerts,
  createPriceAlert,
  updatePriceAlert,
  deletePriceAlert,
} from './api';
import { PriceAlert, PriceNotification } from './types';
import { formatCurrency, formatRelativeTime } from '../../../utils/formatters';

interface PriceAlertsProps {
  carId?: string;
  currentPrice?: number;
}

interface CreateAlertModalProps {
  visible: boolean;
  onClose: () => void;
  carId?: string;
  currentPrice?: number;
}

interface AlertCardProps {
  alert: PriceAlert;
  onEdit: (alert: PriceAlert) => void;
  onDelete: (alertId: string) => void;
  onToggle: (alertId: string, isActive: boolean) => void;
}

const CreateAlertModal: React.FC<CreateAlertModalProps> = ({
  visible,
  onClose,
  carId = 'default-car',
  currentPrice = 25000,
}) => {
  const { state } = useAuth();
  const queryClient = useQueryClient();
  const [targetPrice, setTargetPrice] = useState(currentPrice.toString());
  const [alertType, setAlertType] = useState<
    'below' | 'above' | 'drop' | 'increase'
  >('below');
  const [frequency, setFrequency] = useState<'immediate' | 'daily' | 'weekly'>(
    'immediate',
  );

  const createMutation = useMutation(createPriceAlert, {
    onSuccess: () => {
      queryClient.invalidateQueries(['priceAlerts']);
      Alert.alert('Success', 'Price alert created successfully!');
      onClose();
      resetForm();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to create price alert. Please try again.');
    },
  });

  const resetForm = () => {
    setTargetPrice(currentPrice.toString());
    setAlertType('below');
    setFrequency('immediate');
  };

  const handleCreate = () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price amount.');
      return;
    }

    if (!state.user?.id) {
      Alert.alert('Error', 'Please sign in to create price alerts.');
      return;
    }

    createMutation.mutate({
      userId: state.user.id,
      carId,
      targetPrice: price,
      alertType,
      frequency,
      isActive: true,
    });
  };

  const AlertTypeButton: React.FC<{
    type: typeof alertType;
    label: string;
    description: string;
    icon: React.ComponentType<any>;
  }> = ({ type, label, description, icon: IconComponent }) => (
    <TouchableOpacity
      onPress={() => setAlertType(type)}
      className={`p-4 border-2 rounded-lg mb-3 ${
        alertType === type
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <View className="flex-row items-center mb-2">
        <IconComponent
          size={20}
          className={alertType === type ? 'text-blue-600' : 'text-gray-600'}
        />
        <Text
          className={`ml-2 font-semibold ${
            alertType === type ? 'text-blue-900' : 'text-gray-900'
          }`}
        >
          {label}
        </Text>
      </View>
      <Text
        className={`text-sm ${
          alertType === type ? 'text-blue-700' : 'text-gray-600'
        }`}
      >
        {description}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="bg-white border-b border-gray-200 px-4 py-4 pt-12">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900">
              Create Price Alert
            </Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <X size={24} className="text-gray-600" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Target Price */}
          <View className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Target Price
            </Text>

            <View className="relative">
              <DollarSign
                size={20}
                className="absolute left-3 top-3 text-gray-400 z-10"
              />
              <TextInput
                value={targetPrice}
                onChangeText={setTargetPrice}
                placeholder="Enter target price"
                keyboardType="numeric"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <Text className="text-sm text-gray-600 mt-2">
              Current price: {formatCurrency(currentPrice)}
            </Text>
          </View>

          {/* Alert Type */}
          <View className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Alert Type
            </Text>

            <AlertTypeButton
              type="below"
              label="Price Below Target"
              description="Notify when the price drops below your target"
              icon={TrendingDown}
            />

            <AlertTypeButton
              type="above"
              label="Price Above Target"
              description="Notify when the price rises above your target"
              icon={TrendingUp}
            />

            <AlertTypeButton
              type="drop"
              label="Any Price Drop"
              description="Notify on any price decrease"
              icon={TrendingDown}
            />

            <AlertTypeButton
              type="increase"
              label="Any Price Increase"
              description="Notify on any price increase"
              icon={TrendingUp}
            />
          </View>

          {/* Frequency */}
          <View className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Notification Frequency
            </Text>

            <View className="space-y-3">
              {(['immediate', 'daily', 'weekly'] as const).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  onPress={() => setFrequency(freq)}
                  className="flex-row items-center p-3 bg-gray-50 rounded-lg"
                >
                  <View
                    className={`w-5 h-5 border-2 rounded-full mr-3 ${
                      frequency === freq
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}
                  >
                    {frequency === freq && (
                      <View className="w-full h-full rounded-full bg-white scale-50" />
                    )}
                  </View>
                  <Text className="flex-1 font-medium text-gray-900 capitalize">
                    {freq}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {freq === 'immediate'
                      ? 'Instant notifications'
                      : freq === 'daily'
                        ? 'Once per day'
                        : 'Weekly summary'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View className="bg-white border-t border-gray-200 p-4">
          <TouchableOpacity
            onPress={handleCreate}
            disabled={createMutation.isLoading}
            className={`w-full py-4 rounded-lg flex-row items-center justify-center ${
              createMutation.isLoading ? 'bg-gray-300' : 'bg-blue-500'
            }`}
          >
            {createMutation.isLoading ? (
              <Text className="text-white font-semibold">Creating...</Text>
            ) : (
              <>
                <Bell size={20} className="text-white mr-2" />
                <Text className="text-white font-semibold text-lg">
                  Create Alert
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onEdit,
  onDelete,
  onToggle,
}) => {
  const getAlertTypeConfig = () => {
    switch (alert.alertType) {
      case 'below':
        return {
          icon: TrendingDown,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          label: 'Below Target',
        };
      case 'above':
        return {
          icon: TrendingUp,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          label: 'Above Target',
        };
      case 'drop':
        return {
          icon: TrendingDown,
          color: 'text-blue-600',
          bgColor: 'bg-blue-100',
          label: 'Any Drop',
        };
      case 'increase':
        return {
          icon: TrendingUp,
          color: 'text-orange-600',
          bgColor: 'bg-orange-100',
          label: 'Any Increase',
        };
    }
  };

  const config = getAlertTypeConfig();
  const IconComponent = config.icon;

  return (
    <View className="bg-white rounded-lg border border-gray-200 shadow-sm mb-4">
      {/* Alert Header */}
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center flex-1">
            <View
              className={`w-10 h-10 ${config.bgColor} rounded-full items-center justify-center mr-3`}
            >
              <IconComponent size={20} className={config.color} />
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">
                {config.label}
              </Text>
              <Text className="text-sm text-gray-600">
                Target: {formatCurrency(alert.targetPrice)}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-2">
            <Switch
              value={alert.isActive}
              onValueChange={(value) => onToggle(alert.id, value)}
              trackColor={{ false: '#D1D5DB', true: '#3B82F6' }}
              thumbColor={alert.isActive ? '#FFFFFF' : '#FFFFFF'}
            />
            <TouchableOpacity
              onPress={() => onEdit(alert)}
              className="p-2 bg-gray-100 rounded-full"
            >
              <Edit3 size={16} className="text-gray-600" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(alert.id)}
              className="p-2 bg-red-100 rounded-full"
            >
              <Trash2 size={16} className="text-red-600" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Alert Details */}
        <View className="flex-row items-center space-x-4">
          <View className="flex-row items-center">
            <Clock size={14} className="text-gray-400 mr-1" />
            <Text className="text-sm text-gray-600 capitalize">
              {alert.frequency}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Bell size={14} className="text-gray-400 mr-1" />
            <Text className="text-sm text-gray-600">
              Created {formatRelativeTime(alert.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Last Triggered */}
      {alert.lastTriggered && (
        <View className="px-4 py-3 bg-yellow-50">
          <View className="flex-row items-center">
            <AlertCircle size={16} className="text-yellow-600 mr-2" />
            <Text className="text-sm text-yellow-800">
              Last triggered {formatRelativeTime(alert.lastTriggered)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const NotificationCard: React.FC<{ notification: PriceNotification }> = ({
  notification,
}) => {
  const isPositive = notification.priceChange < 0; // Price drop is positive for buyers

  return (
    <View
      className={`p-4 rounded-lg border ${
        notification.read
          ? 'bg-gray-50 border-gray-200'
          : 'bg-blue-50 border-blue-200'
      } mb-3`}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1">
          <Text
            className={`font-semibold ${
              notification.read ? 'text-gray-900' : 'text-blue-900'
            }`}
          >
            {notification.message}
          </Text>
          <Text className="text-sm text-gray-600 mt-1">
            {formatRelativeTime(notification.triggeredAt)}
          </Text>
        </View>

        <View className="items-end">
          <Text
            className={`text-lg font-bold ${
              isPositive ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {notification.priceChange < 0 ? '' : '+'}
            {formatCurrency(notification.priceChange)}
          </Text>
          <Text className="text-sm text-gray-600">
            {formatCurrency(notification.oldPrice)} →{' '}
            {formatCurrency(notification.newPrice)}
          </Text>
        </View>
      </View>

      {!notification.read && (
        <View className="w-2 h-2 bg-blue-500 rounded-full absolute top-4 right-4" />
      )}
    </View>
  );
};

export const PriceAlerts: React.FC<PriceAlertsProps> = ({
  carId,
  currentPrice,
}) => {
  const { state } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'alerts' | 'notifications'>(
    'alerts',
  );

  const { data: alertsData, isLoading } = useQuery(
    ['priceAlerts', state.user?.id],
    () => fetchUserPriceAlerts(state.user?.id || ''),
    {
      enabled: !!state.user?.id,
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  );

  const updateMutation = useMutation(
    ({ alertId, updates }: { alertId: string; updates: Partial<PriceAlert> }) =>
      updatePriceAlert(alertId, updates),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['priceAlerts']);
      },
    },
  );

  const deleteMutation = useMutation(deletePriceAlert, {
    onSuccess: () => {
      queryClient.invalidateQueries(['priceAlerts']);
    },
  });

  const handleToggleAlert = (alertId: string, isActive: boolean) => {
    updateMutation.mutate({ alertId, updates: { isActive } });
  };

  const handleEditAlert = (alert: PriceAlert) => {
    // For now, just show an alert. In a real app, you'd open an edit modal
    Alert.alert('Edit Alert', 'Edit functionality would be implemented here.');
  };

  const handleDeleteAlert = (alertId: string) => {
    Alert.alert(
      'Delete Alert',
      'Are you sure you want to delete this price alert?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(alertId),
        },
      ],
    );
  };

  const TabButton: React.FC<{
    tab: typeof activeTab;
    label: string;
    count?: number;
  }> = ({ tab, label, count }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`flex-1 py-3 border-b-2 ${
        activeTab === tab ? 'border-blue-500' : 'border-gray-200'
      }`}
    >
      <View className="flex-row items-center justify-center">
        <Text
          className={`font-medium ${
            activeTab === tab ? 'text-blue-600' : 'text-gray-600'
          }`}
        >
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View className="ml-2 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
            <Text className="text-white text-xs font-bold">{count}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-gray-50">
        <Bell size={48} className="text-gray-400 mb-4" />
        <Text className="text-gray-600">Loading your price alerts...</Text>
      </View>
    );
  }

  const alerts = alertsData?.alerts || [];
  const notifications = alertsData?.recentNotifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">Price Alerts</Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            className="flex-row items-center px-4 py-2 bg-blue-500 rounded-lg"
          >
            <Plus size={16} className="text-white mr-2" />
            <Text className="text-white font-semibold">New Alert</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View className="bg-white border-b border-gray-200">
        <View className="flex-row">
          <TabButton tab="alerts" label={`Alerts (${alerts.length})`} />
          <TabButton tab="notifications" label="Recent" count={unreadCount} />
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {activeTab === 'alerts' && (
          <>
            {alerts.length === 0 ? (
              <View className="flex-1 justify-center items-center py-12">
                <BellOff size={48} className="text-gray-400 mb-4" />
                <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  No Price Alerts
                </Text>
                <Text className="text-gray-600 text-center mb-6 px-8 leading-6">
                  Set up price alerts to get notified when car prices change
                  according to your preferences.
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCreateModal(true)}
                  className="flex-row items-center px-6 py-3 bg-blue-500 rounded-lg"
                >
                  <Plus size={16} className="text-white mr-2" />
                  <Text className="text-white font-semibold">
                    Create Your First Alert
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onEdit={handleEditAlert}
                    onDelete={handleDeleteAlert}
                    onToggle={handleToggleAlert}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {activeTab === 'notifications' && (
          <>
            {notifications.length === 0 ? (
              <View className="flex-1 justify-center items-center py-12">
                <Mail size={48} className="text-gray-400 mb-4" />
                <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">
                  No Notifications
                </Text>
                <Text className="text-gray-600 text-center px-8 leading-6">
                  You'll see price change notifications here when your alerts
                  are triggered.
                </Text>
              </View>
            ) : (
              <View>
                {notifications.map((notification) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      <CreateAlertModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        carId={carId}
        currentPrice={currentPrice}
      />
    </View>
  );
};
