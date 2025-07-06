# CarSuggester - Role-Based Security Implementation

## 🔒 Security Features Overview

This implementation provides comprehensive role-based access control using **Supabase Auth** and **Row-Level Security (RLS)** policies.

## 🎭 User Roles & Permissions

### 1. **Public (Not Signed In)**
- ✅ **READ** car listings and models
- ✅ **READ** car reviews  
- ✅ **BROWSE** marketplace and dealers
- ❌ Cannot post cars
- ❌ Cannot write reviews
- ❌ Cannot use AI Assistant
- ❌ Cannot bookmark cars

### 2. **User (Default Role)**
- ✅ **All public permissions**
- ✅ **ACCESS** AI assistant (`/search`)
- ✅ **BOOKMARK** cars and save favorites
- ❌ Cannot post cars for sale
- ❌ Cannot write reviews (only admins can write reviews)

### 3. **Dealer**
- ✅ **All user permissions**
- ✅ **POST** cars for sale (`cars.insert` with RLS)
- ✅ **MANAGE** their own listings
- ❌ Cannot write reviews (conflict of interest)

### 4. **Admin**
- ✅ **ALL ACCESS** - complete platform control
- ✅ **WRITE** reviews (`reviews.insert` with RLS)
- ✅ **POST** cars
- ✅ **MODERATE** all content
- ✅ **MANAGE** user roles
- ✅ **ACCESS** admin dashboard

## 🗄️ Database Schema & RLS

### Tables with RLS Enabled:
- `profiles` - User profile and role management
- `reviews` - Car reviews (admin-only creation)
- `vehicle_listings` - Car listings (dealer+ creation)
- `bookmarks` - User favorites (authenticated only)

### Key RLS Policies:

```sql
-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Only dealers and admins can create listings
CREATE POLICY "Dealers and admins can create listings" ON vehicle_listings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role IN ('dealer', 'admin')
    )
  );

-- Only admins can create reviews
CREATE POLICY "Only admins can create reviews" ON reviews
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Users can only bookmark for themselves
CREATE POLICY "Users can create bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 🛠️ Implementation Files

### Core Security Services:
- `services/securityService.ts` - Role checking and permissions
- `services/featureServices.ts` - Role-protected feature implementations
- `services/adminService.ts` - Admin-only operations

### UI Components:
- `components/ui/RoleProtection.tsx` - Role-based component protection
- `components/CarCard.tsx` - Bookmark functionality with role checks

### Authentication:
- `contexts/AuthContext.tsx` - Role fetching and management
- `database/migrations/001_add_role_based_access.sql` - Database setup

## 🔧 Usage Examples

### Protecting Routes with Roles:
```tsx
import { RoleGate } from '@/components/ui/RoleProtection';

// Only dealers and admins can access
<RoleGate requiredRoles={['dealer', 'admin']} requireAuth={true}>
  <AddCarScreen />
</RoleGate>

// Admin only
<RoleGate requiredRoles={['admin']} requireAuth={true}>
  <AdminDashboard />
</RoleGate>
```

### Checking Permissions in Components:
```tsx
import { useCanPerformAction } from '@/components/ui/RoleProtection';

function MyComponent() {
  const canPostCars = useCanPerformAction('postCars');
  const canBookmark = useCanPerformAction('bookmarkCars');
  
  return (
    <View>
      {canPostCars && <Button title="Post Car" />}
      {canBookmark && <BookmarkButton />}
    </View>
  );
}
```

### Service-Level Protection:
```tsx
import { BookmarkService } from '@/services/featureServices';

// Automatically checks if user can bookmark
await BookmarkService.addBookmark(userId, { carModelId: 123 });

// Throws error if user doesn't have permission
await VehicleListingService.createListing(userId, listingData);
```

## 🚀 Setup Instructions

### 1. Database Setup
Run the migration script in Supabase SQL Editor:
```sql
-- Run: database/migrations/001_add_role_based_access.sql
```

### 2. Environment Configuration
Ensure Supabase configuration is set up in `lib/supabase.ts`

### 3. User Role Assignment
- New users default to `'user'` role
- Admins can upgrade users to `'dealer'` or `'admin'`
- Use the admin panel (coming soon) or direct database updates

## 🎯 UI/UX Features

### Navigation:
- **Tab bar** shows different content based on role
- **AI tab** shows "Sign In for AI" for public users
- **Profile screen** shows role-specific quick actions

### Role Indicators:
- **Profile badge** shows current user role
- **Role-specific menu items** in profile screen
- **Permission-based UI** hiding/showing features

### Security Feedback:
- **Clear error messages** for insufficient permissions
- **Sign-in prompts** for protected features
- **Role upgrade guidance** for users wanting dealer access

## 🔍 Testing Role-Based Access

### Test User Roles:
1. **Sign out** to test public access
2. **Sign in as user** to test basic authenticated features
3. **Upgrade to dealer** (via admin) to test car posting
4. **Upgrade to admin** to test all features

### Key Test Cases:
- ✅ Public users can browse cars but not bookmark
- ✅ Users can bookmark but not post cars
- ✅ Dealers can post cars but not write reviews
- ✅ Admins can do everything
- ✅ RLS policies block unauthorized database access

## 📱 App-Side vs Database-Side Security

### App-Side (UI/UX):
- **Navigation protection** with RoleGate components
- **Feature hiding** based on permissions
- **User feedback** for access denials

### Database-Side (Supabase RLS):
- **Row-level security** policies
- **Server-side enforcement** that cannot be bypassed
- **Database-level protection** regardless of client code

## 🎨 Design Philosophy

### Anonymous-First Experience:
- **Public browsing** without barriers
- **Progressive feature unlock** through authentication
- **Clear value proposition** for signing up

### Role-Based Progressive Enhancement:
- **Users**: Basic features + AI + bookmarks
- **Dealers**: User features + car posting
- **Admins**: Full platform control

### Security Through Multiple Layers:
1. **UI-level** role checks for UX
2. **Service-level** permission validation
3. **Database-level** RLS enforcement
4. **Authentication** requirement for protected features

## 🔮 Future Enhancements

- **Admin Dashboard** for user/role management
- **Dealer Verification** workflow
- **Role-based Analytics** and insights
- **Advanced Permissions** (e.g., regional dealers)
- **API Rate Limiting** by role
- **Content Moderation** tools for admins

---

## 🧪 Development Notes

The implementation follows these principles:
- **Fail securely** - deny access by default
- **Defense in depth** - multiple security layers
- **User experience** - clear feedback and guidance
- **Scalability** - easy to add new roles/permissions
- **Maintainability** - centralized permission logic

All role-based features are now integrated into the app with proper UI feedback, database protection, and a smooth user experience that guides users through the permission system.
