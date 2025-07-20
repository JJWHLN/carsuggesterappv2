#!/usr/bin/env node

/**
 * Gradual Migration from Lucide to Ultra-Optimized Icons
 * 
 * This script safely migrates components from lucide-react-native to our 
 * ultra-optimized icon system for maximum bundle reduction.
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Migrating to Ultra-Optimized Icons System...\n');

// Mapping of available ultra-optimized icons
const availableIcons = [
  'Search', 'Star', 'Heart', 'Car', 'User', 'Home', 
  'ArrowLeft', 'ArrowRight', 'X', 'Plus', 'Filter', 
  'MapPin', 'DollarSign', 'Calendar', 'Check', 'CheckCircle',
  'Award', 'Sparkles', 'ChevronRight', 'ChevronLeft', 
  'Menu', 'MoreVertical', 'Settings',
  // Additional icons for complete coverage
  'Users', 'Zap', 'Crown', 'TrendingUp', 'SlidersHorizontal',
  'Fuel', 'Gauge', 'Building2', 'Clock'
];

// Files to migrate (start with core app files)
const filesToMigrate = [
  'app/(tabs)/index.tsx',
  'app/(tabs)/search.tsx', 
  'components/ui/SearchBar.tsx',
  'components/CarCard.tsx',
];

console.log('📋 Available optimized icons:', availableIcons.join(', '));
console.log('\n🎯 Migrating core files...\n');

let totalMigrations = 0;

filesToMigrate.forEach(relativeFilePath => {
  const filePath = path.join(process.cwd(), relativeFilePath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${relativeFilePath}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if file imports from our optimized icons or lucide
    const hasOptimizedImport = content.includes("from '@/utils/optimized-icons'");
    const hasIconsImport = content.includes("from '@/utils/icons'");
    const hasLucideImport = content.includes("from 'lucide-react-native'");
    
    if (hasOptimizedImport || hasIconsImport) {
      // Find the import line and extract icons
      const importRegex = /import\s*\{([^}]+)\}\s*from\s*['"]@\/utils\/(optimized-)?icons['"];?/g;
      const matches = [...content.matchAll(importRegex)];
      
      if (matches.length > 0) {
        const importedIcons = matches[0][1]
          .split(',')
          .map(icon => icon.trim())
          .filter(icon => icon && !icon.includes('as')); // Skip aliases for now
        
        // Check which icons are available in ultra-optimized
        const availableInUltra = importedIcons.filter(icon => 
          availableIcons.includes(icon)
        );
        const unavailableIcons = importedIcons.filter(icon => 
          !availableIcons.includes(icon)
        );
        
        if (availableInUltra.length > 0) {
          // Replace import with ultra-optimized version
          const newImport = `import { ${availableInUltra.join(', ')} } from '@/utils/ultra-optimized-icons';`;
          
          if (unavailableIcons.length > 0) {
            // Keep both imports for missing icons
            const fallbackImport = `import { ${unavailableIcons.join(', ')} } from '@/utils/optimized-icons';`;
            content = content.replace(importRegex, `${newImport}\n${fallbackImport}`);
          } else {
            // Replace entirely
            content = content.replace(importRegex, newImport);
          }
          
          modified = true;
          totalMigrations++;
          
          console.log(`✅ ${relativeFilePath}:`);
          console.log(`   ✨ Migrated: ${availableInUltra.join(', ')}`);
          if (unavailableIcons.length > 0) {
            console.log(`   ⏳ Fallback: ${unavailableIcons.join(', ')}`);
          }
        } else {
          console.log(`⚠️  ${relativeFilePath}: No icons available in ultra-optimized set`);
        }
      }
    } else if (hasLucideImport) {
      console.log(`📝 ${relativeFilePath}: Still using direct lucide imports`);
    }
    
    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${relativeFilePath}:`, error.message);
  }
});

console.log(`\n🎉 Migration Summary:`);
console.log(`   Files migrated: ${totalMigrations}`);
console.log(`   Available icons: ${availableIcons.length}`);

if (totalMigrations > 0) {
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Test the migrated components`);
  console.log(`   2. Add more icons to ultra-optimized-icons.tsx as needed`);
  console.log(`   3. Run bundle analysis to measure impact`);
} else {
  console.log(`\n💡 No files were migrated. Consider:`);
  console.log(`   1. Adding more icons to the ultra-optimized set`);
  console.log(`   2. Checking file paths and import patterns`);
}

console.log(`\n🏁 Migration complete!`);
