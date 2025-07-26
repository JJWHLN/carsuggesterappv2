# CarSuggester Mobile App 🚗

A professional React Native mobile app for CarSuggester.com, built with Expo, TypeScript, and Supabase.

## 🏗️ Architecture

### Tech Stack
- **Framework**: React Native with Expo SDK 52
- **Language**: TypeScript (strict mode)
- **Database**: Supabase
- **Styling**: Unified Design System with Tailwind-inspired utilities
- **State Management**: Zustand stores
- **Performance**: Code splitting with lazy loading

### Design System
The app uses a consolidated styling approach with:
- **Unified utilities** (`tw` object) for consistent styling
- **Theme-aware colors** with light/dark mode support
- **Responsive spacing** scale (xs: 4px → xxxl: 64px)
- **Typography system** with semantic sizing
- **Component patterns** for common UI elements

```typescript
// Example usage
<View style={[tw.flex, tw['items-center'], tw['p-md']]}>
  <Text style={[tw['text-lg'], tw['font-bold'], tw['text-primary']]}>
    Welcome to CarSuggester
  </Text>
</View>
```

## ✨ Features

### 🏠 **Home Screen**

- Welcome dashboard with platform overview
- Quick access to all main features
- Real-time database connection status
- Platform statistics and highlights

### 🔍 **AI Search**

- Natural language car search (coming soon)
- Smart search suggestions and examples
- Advanced filtering capabilities
- Search history and recommendations

### 🚗 **Browse Cars**

- Comprehensive car model database
- Advanced search and filtering
- Detailed model information pages
- Category-based browsing

### 🏪 **Marketplace**

- Car listings from verified dealers
- Dealer profiles and ratings
- Advanced search and filtering
- Transparent pricing information

## 🛠 Tech Stack

- **Frontend**: React Native with Expo SDK 52
- **Language**: TypeScript (strict mode)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Navigation**: Expo Router 4.0
- **Icons**: Lucide React Native
- **Styling**: StyleSheet with design system

## 🎨 Design System

### Colors

- **Primary**: Forest Green (#228B22) - matching carsuggester.com
- **Secondary**: Professional grays and blues
- **Accent**: Warm amber for highlights
- **Success/Error**: Standard semantic colors

### Typography

- **Headings**: Bold, clear hierarchy
- **Body**: Readable 16px base size
- **Captions**: 12px for metadata

### Spacing

- **8px grid system** for consistent spacing
- **Responsive padding** based on screen size
- **Proper touch targets** (44px minimum)

## 📱 Navigation Structure

```
CarSuggester App
├── Home (index)
│   ├── Platform overview
│   ├── Quick actions
│   └── Feature highlights
├── AI Search
│   ├── Natural language search
│   ├── Search examples
│   └── Coming soon features
├── Browse Cars (models)
│   ├── Car model listings
│   ├── Search & filter
│   ├── Category browsing
│   └── Model detail pages
└── Marketplace
    ├── Dealer listings
    ├── Car for sale (coming soon)
    ├── Dealer profiles
    └── Marketplace features
```

## 🚀 Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open in Expo Go or simulator**
   - Scan QR code with Expo Go app
   - Press `i` for iOS simulator
   - Press `a` for Android emulator

## 🗄 Database Integration

The app connects to Supabase with the following main tables:

- **car_models**: Vehicle model information
- **brands**: Car manufacturer data
- **reviews**: Expert reviews and ratings
- **vehicle_listings**: Marketplace listings
- **dealers**: Verified dealer information

## 🔧 Configuration

### Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### App Configuration

- **Name**: CarSuggester
- **Scheme**: carsuggester://
- **Platform**: Web-first with mobile support
- **SDK**: Expo 52.0.0

## 📦 Key Components

### UI Components

- **LoadingSpinner**: Consistent loading states
- **ErrorState**: Error handling with retry
- **EmptyState**: Empty state messaging

### Screens

- **HomeScreen**: Dashboard and overview
- **SearchScreen**: AI search interface
- **ModelsScreen**: Car model browsing
- **MarketplaceScreen**: Dealer and listings
- **ModelDetailScreen**: Individual model pages

## 🎯 Future Enhancements

### Phase 1 (Current)

- ✅ Core navigation and screens
- ✅ Database integration
- ✅ Professional design system
- ✅ Model browsing and details

### Phase 2 (Next)

- 🔄 AI-powered search implementation
- 🔄 User authentication
- 🔄 Marketplace listings
- 🔄 Review system integration

### Phase 3 (Future)

- 📋 User profiles and preferences
- 📋 Saved cars and favorites
- 📋 Push notifications
- 📋 Offline support

## 🤝 Contributing

1. Follow the established design system
2. Maintain TypeScript strict mode
3. Test on both iOS and Android
4. Ensure accessibility compliance
5. Match carsuggester.com branding

## 📄 License

This project is part of the CarSuggester platform.

---

**Built with ❤️ for the CarSuggester community**
