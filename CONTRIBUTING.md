# Contributing to Car Suggester App

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Expo CLI
- React Native development environment

### Development Setup
```bash
npm install
npx expo start
```

## 📋 Coding Standards

### TypeScript
- **Strict mode enabled** - All code must pass TypeScript strict checks
- **Explicit types** - Prefer explicit typing over `any`
- **Interface over type** - Use interfaces for object shapes

### Styling Guidelines
- **Unified Design System** - Use `tw` utilities from `src/styles/designSystem.ts`
- **No StyleSheet.create()** - Use consolidated tw utilities instead
- **Consistent spacing** - Use design system spacing tokens (xs, sm, md, lg, xl)

```typescript
// ✅ Good - Using consolidated design system
<View style={[tw.flex, tw['items-center'], tw['p-md']]}>
  <Text style={[tw['text-lg'], tw['font-bold'], tw['text-primary']]}>
    Title
  </Text>
</View>

// ❌ Bad - Using StyleSheet.create()
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 16 }
});
```

### Component Standards
- **Functional components** with hooks
- **React.memo()** for performance optimization
- **Proper TypeScript interfaces** for all props
- **Error boundaries** for robust error handling

### File Organization
```
src/
  components/
    common/          # Reusable UI components
    features/        # Feature-specific components
  styles/
    designSystem.ts  # Unified styling utilities
  utils/
  hooks/
  services/
```

### Import Standards
```typescript
// ✅ Absolute imports for src files
import { tw } from '../../styles/designSystem';

// ✅ Group imports logically
import React from 'react';
import { View, Text } from 'react-native';
import { tw, currentColors } from '../../styles/designSystem';
```

## 🧪 Testing
- Write tests for utility functions
- Test component behavior, not implementation
- Use React Native Testing Library

## 📱 Performance Guidelines
- **Lazy loading** - Use `createLazyComponent` for code splitting
- **Memoization** - React.memo for expensive components
- **Optimistic updates** - Update UI before API confirmation
- **Image optimization** - Use OptimizedImage component

## 🎨 Design System Usage

### Colors
```typescript
// Use currentColors for theme-aware colors
color: currentColors.primary
backgroundColor: currentColors.surface

// Use tw utilities for common colors  
tw['bg-primary'], tw['text-primary']
```

### Spacing
```typescript
// Use consistent spacing scale
tw['p-xs']    // 4px
tw['p-sm']    // 8px  
tw['p-md']    // 16px
tw['p-lg']    // 24px
tw['p-xl']    // 32px
```

### Typography
```typescript
tw['text-xs']    // 12px
tw['text-sm']    // 14px
tw['text-base']  // 16px
tw['text-lg']    // 18px
tw['text-xl']    // 20px
```

## 🔄 Git Workflow
1. Create feature branch from `main`
2. Make focused, atomic commits
3. Write descriptive commit messages
4. Submit PR with clear description
5. Address review feedback promptly

### Commit Message Format
```
feat: add car comparison feature
fix: resolve search filter bug  
docs: update API documentation
style: consolidate button styling
refactor: optimize search performance
```

## 🚫 Code Quality Rules

### Forbidden Patterns
- ❌ `console.log()` in production code
- ❌ `StyleSheet.create()` - use tw utilities
- ❌ Hardcoded colors/spacing
- ❌ `any` type without justification
- ❌ TODO comments without GitHub issues

### Required Patterns
- ✅ Error boundaries for components
- ✅ Loading and error states
- ✅ Accessibility props
- ✅ TypeScript strict mode compliance
- ✅ Performance optimizations

## 📖 Documentation
- Update README.md for architectural changes
- Document complex business logic
- Add JSDoc comments for utility functions
- Keep inline comments focused and valuable

## 🎯 Pull Request Checklist
- [ ] TypeScript compilation passes
- [ ] ESLint warnings resolved
- [ ] Code formatted with Prettier
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Performance impact considered
- [ ] Accessibility tested
- [ ] Design system standards followed
