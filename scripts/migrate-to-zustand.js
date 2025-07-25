#!/usr/bin/env node

/**
 * Migration script to update components from Context API to Zustand stores
 * This script will:
 * 1. Replace Context imports with store imports
 * 2. Update state access patterns
 * 3. Update action calls
 * 4. Remove provider wrappers
 */

const fs = require('fs');
const path = require('path');

const STORE_MIGRATIONS = {
  // Comparison Context Migration
  'ComparisonProvider': {
    remove: true
  },
  'useComparison': {
    newImport: "import { useComparison } from '@/stores';",
    oldImports: [
      "import { ComparisonProvider, useComparison } from './ComparisonContext';",
      "import { useComparison } from './ComparisonContext';",
      "import { ComparisonProvider, useComparison } from '../ComparisonContext';"
    ],
    replacements: [
      {
        from: "const { state, actions } = useComparison();",
        to: "const comparison = useComparison();"
      },
      {
        from: "state.cars",
        to: "comparison.comparisonCars"
      },
      {
        from: "state.maxCars",
        to: "comparison.maxComparisons"
      },
      {
        from: "actions.addCar",
        to: "comparison.addToComparison"
      },
      {
        from: "actions.removeCar",
        to: "comparison.removeFromComparison"
      },
      {
        from: "actions.clearComparison",
        to: "comparison.clearComparison"
      },
      {
        from: "actions.reorderCars",
        to: "comparison.reorderComparison"
      }
    ]
  },
  
  // Auth Context Migration
  'AuthProvider': {
    keep: true, // Keep Auth provider for now
    note: 'Auth context will be migrated to essential-only'
  },
  
  // Component State Migrations
  'useState': {
    migrations: [
      {
        pattern: "const [.*Loading, set.*Loading] = useState(false);",
        suggestion: "Consider using useLoading() from UI store"
      },
      {
        pattern: "const [.*Error, set.*Error] = useState(null);",
        suggestion: "Consider using error state from relevant store"
      },
      {
        pattern: "const [.*Modal, set.*Modal] = useState(false);",
        suggestion: "Consider using useModals() from UI store"
      }
    ]
  }
};

function migrateFile(filePath) {
  console.log(`Migrating: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  // Replace imports
  Object.entries(STORE_MIGRATIONS).forEach(([key, migration]) => {
    if (migration.oldImports && migration.newImport) {
      migration.oldImports.forEach(oldImport => {
        if (content.includes(oldImport)) {
          content = content.replace(oldImport, migration.newImport);
          hasChanges = true;
          console.log(`  ✓ Updated import: ${key}`);
        }
      });
    }
  });

  // Apply replacements
  Object.entries(STORE_MIGRATIONS).forEach(([key, migration]) => {
    if (migration.replacements) {
      migration.replacements.forEach(replacement => {
        if (content.includes(replacement.from)) {
          content = content.replace(new RegExp(replacement.from.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'g'), replacement.to);
          hasChanges = true;
          console.log(`  ✓ Replaced: ${replacement.from} -> ${replacement.to}`);
        }
      });
    }
  });

  // Remove provider wrappers
  Object.entries(STORE_MIGRATIONS).forEach(([key, migration]) => {
    if (migration.remove) {
      const providerPattern = new RegExp(`<${key}>([\\\\s\\\\S]*?)</${key}>`, 'g');
      if (providerPattern.test(content)) {
        content = content.replace(providerPattern, '$1');
        hasChanges = true;
        console.log(`  ✓ Removed provider wrapper: ${key}`);
      }
    }
  });

  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ File updated: ${filePath}`);
  } else {
    console.log(`  ⏭️  No changes needed: ${filePath}`);
  }
}

function findReactFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts')) && !item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    });
  }
  
  traverse(dir);
  return files;
}

// Main execution
const workspaceRoot = process.cwd();
console.log('🚀 Starting Context to Zustand migration...');
console.log(`📁 Workspace: ${workspaceRoot}`);

// Find all React files
const reactFiles = findReactFiles(workspaceRoot);
console.log(`📄 Found ${reactFiles.length} React files to check`);

// Filter files that likely use contexts
const contextFiles = reactFiles.filter(file => {
  const content = fs.readFileSync(file, 'utf8');
  return Object.keys(STORE_MIGRATIONS).some(key => content.includes(key));
});

console.log(`🎯 Found ${contextFiles.length} files using contexts`);

// Migrate each file
contextFiles.forEach(migrateFile);

console.log('✅ Migration complete!');
console.log('');
console.log('📋 Next steps:');
console.log('1. Review the changes and test the application');
console.log('2. Update any remaining manual state management');
console.log('3. Remove unused context files');
console.log('4. Update imports to use the new store structure');

module.exports = { migrateFile, STORE_MIGRATIONS };
