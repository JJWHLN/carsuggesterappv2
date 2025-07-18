# Phase 2 Integration Guide - Social Features & Real-time Chat

This guide explains how to integrate the Phase 2 social features and real-time chat components into the existing CarSuggester app.

## Overview of Phase 2 Components

### 1. Social Service (`services/socialService.ts`)
- **Purpose**: Comprehensive social interaction service for car marketplace community
- **Features**: 
  - Car reviews and ratings
  - User following system
  - Car comparisons
  - Discussion forums
  - Social activity tracking
  - Marketplace interactions

### 2. Real-time Chat Service (`services/realTimeChatService.ts`)
- **Purpose**: Real-time messaging with car marketplace-specific features
- **Features**:
  - Conversation management
  - Real-time messaging
  - Dealer inquiries
  - Car sharing in chats
  - Price quotes
  - Typing indicators
  - Online presence tracking

### 3. Social Feed Component (`components/SocialFeed.tsx`)
- **Purpose**: Display social activity and community interactions
- **Features**:
  - Activity feed with car-specific content
  - Real-time updates
  - Filtering by activity type
  - User interactions (like, comment, share)

### 4. Car Marketplace Chat (`components/CarMarketplaceChat.tsx`)
- **Purpose**: Real-time chat interface optimized for car marketplace
- **Features**:
  - Message bubbles with car context
  - Dealer communication features
  - Car sharing capabilities
  - Price quote integration
  - Real-time presence indicators

### 5. Enhanced Profile Screen (`components/EnhancedProfileScreen.tsx`)
- **Purpose**: Extended user profile with social features
- **Features**:
  - Social stats (followers, reviews, cars owned)
  - Activity timeline
  - Follow/unfollow functionality
  - Direct messaging

### 6. Enhanced Marketplace Screen (`components/EnhancedMarketplaceScreen.tsx`)
- **Purpose**: Advanced marketplace with social integration
- **Features**:
  - Car listings with social engagement
  - Direct dealer messaging
  - Advanced filtering
  - Market statistics

## Integration Steps

### Step 1: Database Schema Updates

First, ensure your Supabase database has the required tables. Run these SQL commands:

```sql
-- Social profiles extension
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  verified_buyer BOOLEAN DEFAULT FALSE,
  member_since TIMESTAMP DEFAULT NOW(),
  preferred_brands TEXT[],
  cars_owned JSONB DEFAULT '[]'::jsonb,
  social_stats JSONB DEFAULT '{
    "followers_count": 0,
    "following_count": 0,
    "reviews_written": 0,
    "helpful_votes_received": 0,
    "marketplace_interactions": 0
  }'::jsonb,
  total_reviews INTEGER DEFAULT 0,
  average_rating_given DECIMAL(2,1),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Car reviews and ratings
CREATE TABLE IF NOT EXISTS car_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  car_id UUID,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  pros TEXT[],
  cons TEXT[],
  ownership_period TEXT,
  mileage_owned INTEGER,
  verified_owner BOOLEAN DEFAULT FALSE,
  helpful_votes INTEGER DEFAULT 0,
  images TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User following relationships
CREATE TABLE IF NOT EXISTS user_follows (
  follower_id UUID REFERENCES user_profiles(id),
  following_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Social activities
CREATE TABLE IF NOT EXISTS social_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id),
  activity_type TEXT NOT NULL,
  content JSONB,
  target_type TEXT,
  target_id TEXT,
  visibility TEXT DEFAULT 'public',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Real-time chat conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT,
  created_by UUID REFERENCES user_profiles(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id UUID REFERENCES conversations(id),
  user_id UUID REFERENCES user_profiles(id),
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  last_read_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (conversation_id, user_id)
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES user_profiles(id),
  content TEXT,
  message_type TEXT DEFAULT 'text',
  metadata JSONB DEFAULT '{}'::jsonb,
  reply_to UUID REFERENCES chat_messages(id),
  edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE car_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic examples)
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Reviews are viewable by everyone" ON car_reviews
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own reviews" ON car_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE conversation_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE social_activities;
```

### Step 2: Navigation Updates

Update your navigation to include the new screens:

```typescript
// In your navigation configuration
import { EnhancedProfileScreen } from '@/components/EnhancedProfileScreen';
import { EnhancedMarketplaceScreen } from '@/components/EnhancedMarketplaceScreen';
import { CarMarketplaceChat } from '@/components/CarMarketplaceChat';

// Add to your tab navigator or stack navigator
const TabNavigator = createBottomTabNavigator({
  Home: HomeScreen,
  Search: SearchScreen,
  Marketplace: EnhancedMarketplaceScreen, // Replace existing marketplace
  Profile: EnhancedProfileScreen, // Replace existing profile
  // ... other screens
});

// Add chat screen to stack navigator
const MainStack = createStackNavigator({
  Tabs: TabNavigator,
  Chat: CarMarketplaceChat,
  // ... other modal screens
});
```

### Step 3: Environment Configuration

Add these environment variables to your `.env` file:

```env
# Supabase Real-time Configuration
EXPO_PUBLIC_SUPABASE_REALTIME_ENABLED=true

# Social Features Configuration
EXPO_PUBLIC_SOCIAL_FEATURES_ENABLED=true
EXPO_PUBLIC_CHAT_FEATURES_ENABLED=true

# Image Upload Configuration (for car photos, avatars)
EXPO_PUBLIC_MAX_IMAGE_SIZE=5242880  # 5MB
EXPO_PUBLIC_ALLOWED_IMAGE_TYPES=jpg,jpeg,png,webp
```

### Step 4: Update App Layout

Modify your main app layout to initialize the services:

```typescript
// In App.tsx or your main layout component
import { socialService } from '@/services/socialService';
import { realTimeChatService } from '@/services/realTimeChatService';
import { useAuth } from '@/contexts/AuthContext';

export default function App() {
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      // Initialize services when user logs in
      socialService.initialize(user.id);
      realTimeChatService.initialize(user.id);
      
      // Setup real-time subscriptions
      const cleanup = realTimeChatService.subscribeToUserConversations(user.id, (conversations) => {
        // Handle real-time conversation updates
        console.log('Conversations updated:', conversations);
      });
      
      return cleanup;
    }
  }, [user]);

  return (
    // Your app content
  );
}
```

### Step 5: Update Existing Screens

#### Update Home Screen
Add social feed integration:

```typescript
// In app/(tabs)/index.tsx
import { SocialFeed } from '@/components/SocialFeed';

export default function HomeScreen() {
  return (
    <ScrollView>
      {/* Existing home content */}
      
      {/* Add social feed section */}
      <View style={styles.socialSection}>
        <Text style={styles.sectionTitle}>Community Activity</Text>
        <SocialFeed
          filterType="following"
          maxItems={5}
          showHeader={false}
        />
      </View>
    </ScrollView>
  );
}
```

#### Update Car Detail Screen
Add review integration:

```typescript
// In app/car/[id].tsx
import { socialService } from '@/services/socialService';

export default function CarDetailScreen({ route }) {
  const { carId } = route.params;
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // Load car reviews
    const loadReviews = async () => {
      try {
        const carReviews = await socialService.getCarReviews(carId);
        setReviews(carReviews);
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    };

    loadReviews();
  }, [carId]);

  return (
    <ScrollView>
      {/* Existing car details */}
      
      {/* Add reviews section */}
      <View style={styles.reviewsSection}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </View>
    </ScrollView>
  );
}
```

### Step 6: Add Chat Integration

Create a chat button component for easy integration:

```typescript
// components/ChatButton.tsx
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { MessageCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface ChatButtonProps {
  recipientId: string;
  carId?: string;
  dealerId?: string;
  conversationType?: 'direct' | 'dealer_inquiry';
}

export const ChatButton: React.FC<ChatButtonProps> = ({
  recipientId,
  carId,
  dealerId,
  conversationType = 'direct',
}) => {
  const navigation = useNavigation();

  const handleChatPress = () => {
    navigation.navigate('Chat', {
      recipientId,
      carId,
      dealerId,
      conversationType,
    });
  };

  return (
    <TouchableOpacity onPress={handleChatPress}>
      <MessageCircle size={20} />
      <Text>Message</Text>
    </TouchableOpacity>
  );
};
```

### Step 7: Testing Phase 2 Features

#### Test Social Features
1. **User Profiles**: Test profile creation, editing, and viewing
2. **Following System**: Test following/unfollowing users
3. **Reviews**: Test creating, editing, and viewing car reviews
4. **Social Feed**: Test activity feed updates and interactions

#### Test Chat Features
1. **Direct Messages**: Test user-to-user messaging
2. **Dealer Inquiries**: Test car marketplace conversations
3. **Real-time Updates**: Test message delivery and typing indicators
4. **Car Sharing**: Test sharing car details in chat

#### Test Integration
1. **Navigation**: Test navigation between screens
2. **Real-time Updates**: Test live updates across components
3. **Offline Handling**: Test behavior when offline
4. **Performance**: Test with multiple conversations and activities

## Performance Optimization

### Real-time Optimization
```typescript
// Optimize real-time subscriptions
const optimizeRealTimeSubscriptions = () => {
  // Only subscribe to active conversations
  // Implement pagination for chat history
  // Use message batching for bulk updates
  // Implement connection pooling
};
```

### Caching Strategy
```typescript
// Implement caching for social data
const socialCache = {
  profiles: new Map(),
  reviews: new Map(),
  conversations: new Map(),
};

// Use React Query or SWR for data fetching
import { useQuery } from 'react-query';

const useUserProfile = (userId: string) => {
  return useQuery(
    ['profile', userId],
    () => socialService.getUserProfile(userId),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );
};
```

## Security Considerations

### Row Level Security Policies
Ensure proper RLS policies are in place:

```sql
-- Example: Users can only read their own messages
CREATE POLICY "Users can read own messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = chat_messages.conversation_id
      AND cp.user_id = auth.uid()
    )
  );
```

### Input Validation
```typescript
// Validate chat messages
const validateMessage = (content: string) => {
  if (!content || content.trim().length === 0) {
    throw new Error('Message content is required');
  }
  if (content.length > 2000) {
    throw new Error('Message too long');
  }
  return content.trim();
};
```

## Monitoring and Analytics

Add analytics for Phase 2 features:

```typescript
// Track social interactions
const trackSocialEvent = (eventType: string, data: any) => {
  // Your analytics service
  Analytics.track(eventType, {
    ...data,
    timestamp: new Date().toISOString(),
    phase: 'phase_2',
  });
};

// Usage examples
trackSocialEvent('user_followed', { followedUserId });
trackSocialEvent('review_created', { carId, rating });
trackSocialEvent('message_sent', { conversationType, recipientType });
```

## Troubleshooting Common Issues

### Real-time Connection Issues
```typescript
// Debug real-time connection
const debugRealTime = () => {
  console.log('Supabase connection status:', supabase.channel('debug').state);
  
  // Test connection
  supabase
    .channel('debug')
    .on('presence', { event: 'sync' }, () => {
      console.log('Real-time connection active');
    })
    .subscribe();
};
```

### Performance Issues
- Check real-time subscription cleanup
- Optimize database queries with proper indexes
- Implement pagination for large datasets
- Use React.memo for expensive components

### UI/UX Issues
- Test on different screen sizes
- Verify accessibility features
- Test dark mode compatibility
- Validate form inputs

## Next Steps: Phase 3 Preparation

Phase 2 sets the foundation for Phase 3 advanced features:
- AR car visualization integration
- Advanced AI recommendations
- Enhanced service provider connections
- Advanced marketplace features

The social and chat infrastructure from Phase 2 will support these advanced features in Phase 3.

## Support and Documentation

For additional help:
1. Check the component documentation in each file
2. Review the service method implementations
3. Test with the provided mock data
4. Use TypeScript for better development experience

The Phase 2 implementation provides a solid foundation for car marketplace social features and real-time communication, setting up the app for advanced Phase 3 capabilities.
