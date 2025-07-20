#!/usr/bin/env node

/**
 * Complete Migration to Ultra-Optimized Icons
 * 
 * This script migrates ALL components from lucide-react-native and 
 * optimized-icons to our ultra-optimized icon system for maximum bundle reduction.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🚀 Complete Migration to Ultra-Optimized Icons...\n');

// Comprehensive mapping of available ultra-optimized icons
const availableIcons = [
  'Search', 'Star', 'Heart', 'Car', 'User', 'Home', 
  'ArrowLeft', 'ArrowRight', 'X', 'Plus', 'Filter', 
  'MapPin', 'DollarSign', 'Calendar', 'Check', 'CheckCircle',
  'Award', 'Sparkles', 'ChevronRight', 'ChevronLeft', 
  'Menu', 'MoreVertical', 'Settings',
  // Additional icons
  'Users', 'Zap', 'Crown', 'TrendingUp', 'SlidersHorizontal',
  'Fuel', 'Gauge', 'Building2', 'Clock',
  // Auth & UI
  'AlertTriangle', 'Mail', 'Lock', 'Eye', 'EyeOff', 
  'Grid', 'List', 'MessageCircle', 'Minus', 
  'ShoppingCart', 'Truck', 'Wind', 'Leaf'
];

console.log('📋 Available ultra-optimized icons:', availableIcons.length, 'icons');
console.log('   ', availableIcons.join(', '));

// Find all TypeScript/TSX files that might have icon imports
const patterns = [
  'app/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'utils/**/*.{ts,tsx}'
];

console.log('\n🔍 Finding files with icon imports...\n');

let allFiles = [];
patterns.forEach(pattern => {
  const files = glob.sync(pattern, { ignore: ['**/*.test.*', '**/*.spec.*'] });
  allFiles = allFiles.concat(files);
});

let totalMigrations = 0;
let totalFiles = 0;

allFiles.forEach(relativeFilePath => {
  const filePath = path.join(process.cwd(), relativeFilePath);
  
  if (!fs.existsSync(filePath)) {
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check for any icon imports
    const hasOptimizedImport = content.includes("from '@/utils/optimized-icons'");
    const hasIconsImport = content.includes("from '@/utils/icons'");
    const hasLucideImport = content.includes("from 'lucide-react-native'");
    
    if (hasOptimizedImport || hasIconsImport || hasLucideImport) {
      totalFiles++;
      
      // Extract all icon imports using comprehensive regex
      const importPatterns = [
        /import\s*\{([^}]+)\}\s*from\s*['"]@\/utils\/(optimized-)?icons['"];?/g,
        /import\s*\{([^}]+)\}\s*from\s*['"]lucide-react-native['"];?/g
      ];
      
      let allImportedIcons = [];
      let hasAnyImport = false;
      
      importPatterns.forEach(regex => {
        const matches = [...content.matchAll(regex)];
        matches.forEach(match => {
          hasAnyImport = true;
          const iconList = match[1]
            .split(',')
            .map(icon => icon.trim())
            .filter(icon => icon && !icon.includes('as')); // Skip aliases for now
          allImportedIcons = allImportedIcons.concat(iconList);
        });
      });
      
      if (hasAnyImport) {
        // Remove duplicates
        allImportedIcons = [...new Set(allImportedIcons)];
        
        // Check which icons are available in ultra-optimized
        const availableInUltra = allImportedIcons.filter(icon => 
          availableIcons.includes(icon)
        );
        const unavailableIcons = allImportedIcons.filter(icon => 
          !availableIcons.includes(icon)
        );
        
        if (availableInUltra.length > 0) {
          // Replace ALL icon imports with ultra-optimized version
          let newContent = content;
          
          // Remove all existing icon imports
          importPatterns.forEach(regex => {
            newContent = newContent.replace(regex, '');
          });
          
          // Add new ultra-optimized import
          const importStatement = `import { ${availableInUltra.join(', ')} } from '@/utils/ultra-optimized-icons';`;
          
          // Find a good place to insert the import (after other imports)
          const importRegex = /^import.*from.*['"'];?$/gm;
          const imports = [...newContent.matchAll(importRegex)];
          
          if (imports.length > 0) {
            // Insert after the last import
            const lastImport = imports[imports.length - 1];
            const insertIndex = lastImport.index + lastImport[0].length;
            newContent = 
              newContent.slice(0, insertIndex) + 
              '\n' + importStatement + 
              newContent.slice(insertIndex);
          } else {
            // Insert at the top
            newContent = importStatement + '\n\n' + newContent;
          }
          
          // Clean up multiple empty lines
          newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');
          
          content = newContent;
          modified = true;
          totalMigrations++;
          
          console.log(`✅ ${relativeFilePath}:`);
          console.log(`   ✨ Migrated: ${availableInUltra.join(', ')}`);
          if (unavailableIcons.length > 0) {
            console.log(`   ❌ Missing: ${unavailableIcons.join(', ')}`);
          }
        } else if (unavailableIcons.length > 0) {
          console.log(`⚠️  ${relativeFilePath}: Missing icons - ${unavailableIcons.join(', ')}`);
        }
      }
    }
    
    // Write back if modified
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${relativeFilePath}:`, error.message);
  }
});

console.log(`\n🎉 Complete Migration Summary:`);
console.log(`   Files scanned: ${allFiles.length}`);
console.log(`   Files with icon imports: ${totalFiles}`);
console.log(`   Files migrated: ${totalMigrations}`);
console.log(`   Available icons: ${availableIcons.length}`);

if (totalMigrations > 0) {
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Test all migrated components`);
  console.log(`   2. Add any missing icons to ultra-optimized-icons.tsx`);
  console.log(`   3. Run bundle analysis to measure ~16MB savings`);
  console.log(`   4. Delete old optimized-icons.ts file`);
} else {
  console.log(`\n💡 No files were migrated. All files may already be optimized.`);
}

console.log(`\n🏁 Complete migration finished!`);

// Check if we can remove old files
const oldFiles = [
  'utils/optimized-icons.ts',
  'utils/icons.ts'
];

console.log(`\n🗑️  Old icon files that can be removed:`);
oldFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ${file} (safe to delete after verification)`);
  }
});
