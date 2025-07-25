#!/usr/bin/env node

/**
 * Component Consolidation Script
 * 
 * This script helps automate the process of consolidating duplicate components
 * by updating imports throughout the codebase.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const WORKSPACE_ROOT = 'f:\\carsuggester code\\carsuggesterapp-main v2';
const SEARCH_PATTERNS = ['**/*.tsx', '**/*.ts', '**/*.js', '**/*.jsx'];
const EXCLUDE_PATTERNS = ['node_modules', '.git', 'build', 'dist'];

// Component mappings
const COMPONENT_MAPPINGS = {
  // Search components
  'SearchBar': {
    newImport: "import { UnifiedSearchComponent as SearchBar } from '@/components/ui/unified'",
    propMigration: (props) => `{...${props}, mode: 'basic'}`,
    oldImports: [
      "import { SearchBar } from '@/components/ui/SearchBar'",
      "import { SearchBar } from '../components/ui/SearchBar'",
      "import { SearchBar } from './SearchBar'",
    ]
  },
  
  'DebouncedSearch': {
    newImport: "import { UnifiedSearchComponent as DebouncedSearch } from '@/components/ui/unified'",
    propMigration: (props) => `{...${props}, mode: 'debounced'}`,
    oldImports: [
      "import { DebouncedSearch } from '@/components/ui/DebouncedSearch'",
      "import { DebouncedSearch } from '../components/ui/DebouncedSearch'",
    ]
  },
  
  // Car card components
  'CarCard': {
    newImport: "import { UnifiedCarCard as CarCard } from '@/components/ui/unified'",
    propMigration: (props) => `{...${props}, variant: 'standard'}`,
    oldImports: [
      "import { CarCard } from '@/components/CarCard'",
      "import { CarCard } from '../components/CarCard'",
      "import { CarCard } from './CarCard'",
    ]
  },
  
  'PremiumCarCard': {
    newImport: "import { UnifiedCarCard as PremiumCarCard } from '@/components/ui/unified'",
    propMigration: (props) => `{...${props}, variant: 'premium', showFeatures: true}`,
    oldImports: [
      "import { PremiumCarCard } from '@/components/PremiumCarCard'",
      "import { PremiumCarCard } from '../components/PremiumCarCard'",
    ]
  },
  
  'OptimizedCarCard': {
    newImport: "import { UnifiedCarCard as OptimizedCarCard } from '@/components/ui/unified'",
    propMigration: (props) => `{...${props}, variant: 'optimized'}`,
    oldImports: [
      "import { OptimizedCarCard } from '@/components/ui/OptimizedCarCard'",
      "import { OptimizedCarCard } from '../components/ui/OptimizedCarCard'",
    ]
  },
  
  // Filter components
  'FilterPanel': {
    newImport: "import { UnifiedFilterPanel as FilterPanel } from '@/components/ui/unified'",
    propMigration: (props) => `{...${props}, variant: 'modal'}`,
    oldImports: [
      "import { FilterPanel } from '@/src/components/Filters/FilterPanel'",
      "import { FilterPanel } from '../components/Filters/FilterPanel'",
    ]
  },
  
  // Modal components
  'ContactDealerModal': {
    newImport: "import { UnifiedModal as ContactDealerModal } from '@/components/ui/unified'",
    propMigration: (props) => `{...${props}, variant: 'default', title: 'Contact Dealer'}`,
    oldImports: [
      "import { ContactDealerModal } from '@/components/ui/ContactDealerModal'",
      "import { ContactDealerModal } from '../components/ui/ContactDealerModal'",
    ]
  },
  
  'PriceAlertModal': {
    newImport: "import { UnifiedModal as PriceAlertModal } from '@/components/ui/unified'",
    propMigration: (props) => `{...${props}, variant: 'default', title: 'Set Price Alert'}`,
    oldImports: [
      "import { PriceAlertModal } from '@/components/ui/PriceAlertModal'",
      "import { PriceAlertModal } from '../components/ui/PriceAlertModal'",
    ]
  },
};

// Utility functions
function getAllFiles(dir, filePattern) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !EXCLUDE_PATTERNS.includes(entry.name)) {
      files.push(...getAllFiles(fullPath, filePattern));
    } else if (entry.isFile() && filePattern.test(entry.name)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function updateFileImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  const changes = [];
  
  for (const [componentName, mapping] of Object.entries(COMPONENT_MAPPINGS)) {
    // Check if any old imports exist
    for (const oldImport of mapping.oldImports) {
      if (content.includes(oldImport)) {
        content = content.replace(oldImport, mapping.newImport);
        hasChanges = true;
        changes.push(`Updated ${componentName} import`);
      }
    }
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated ${filePath}:`);
    changes.forEach(change => console.log(`   - ${change}`));
  }
  
  return hasChanges;
}

function findDuplicateComponents() {
  const searchPattern = /\.(tsx|ts|jsx|js)$/;
  const files = getAllFiles(WORKSPACE_ROOT, searchPattern);
  
  const duplicates = {};
  
  for (const componentName of Object.keys(COMPONENT_MAPPINGS)) {
    const componentFiles = files.filter(file => 
      path.basename(file, path.extname(file)) === componentName ||
      path.basename(file, path.extname(file)).includes(componentName)
    );
    
    if (componentFiles.length > 1) {
      duplicates[componentName] = componentFiles;
    }
  }
  
  return duplicates;
}

function generateMigrationReport() {
  console.log('🔍 Component Consolidation Analysis\\n');
  
  // Find duplicate components
  const duplicates = findDuplicateComponents();
  
  if (Object.keys(duplicates).length > 0) {
    console.log('📋 Duplicate Components Found:\\n');
    for (const [component, files] of Object.entries(duplicates)) {
      console.log(`${component}:`);
      files.forEach(file => console.log(`   - ${path.relative(WORKSPACE_ROOT, file)}`));
      console.log('');
    }
  }
  
  // Find files using old imports
  const searchPattern = /\.(tsx|ts|jsx|js)$/;
  const files = getAllFiles(WORKSPACE_ROOT, searchPattern);
  let totalFilesNeedingUpdate = 0;
  
  console.log('📂 Files Needing Import Updates:\\n');
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const oldImports = [];
      
      for (const [componentName, mapping] of Object.entries(COMPONENT_MAPPINGS)) {
        for (const oldImport of mapping.oldImports) {
          if (content.includes(oldImport)) {
            oldImports.push(`${componentName}: ${oldImport}`);
          }
        }
      }
      
      if (oldImports.length > 0) {
        totalFilesNeedingUpdate++;
        const relativePath = path.relative(WORKSPACE_ROOT, file);
        console.log(`${relativePath}:`);
        oldImports.forEach(imp => console.log(`   - ${imp}`));
        console.log('');
      }
    } catch (error) {
      // Skip files that can't be read
    }
  }
  
  console.log(`\\n📊 Summary:`);
  console.log(`   - ${Object.keys(duplicates).length} duplicate component types found`);
  console.log(`   - ${totalFilesNeedingUpdate} files need import updates`);
  console.log(`   - ${Object.keys(COMPONENT_MAPPINGS).length} components can be consolidated`);
}

function executeConsolidation() {
  console.log('🚀 Starting Component Consolidation...\\n');
  
  const searchPattern = /\.(tsx|ts|jsx|js)$/;
  const files = getAllFiles(WORKSPACE_ROOT, searchPattern);
  let updatedFiles = 0;
  
  for (const file of files) {
    try {
      if (updateFileImports(file)) {
        updatedFiles++;
      }
    } catch (error) {
      console.error(`❌ Error updating ${file}: ${error.message}`);
    }
  }
  
  console.log(`\\n✅ Consolidation Complete!`);
  console.log(`   - ${updatedFiles} files updated`);
  console.log(`\\n📋 Next Steps:`);
  console.log(`   1. Review the updated imports`);
  console.log(`   2. Update component usage to use new props where needed`);
  console.log(`   3. Test the application thoroughly`);
  console.log(`   4. Remove old component files after verification`);
}

function deleteOldComponents() {
  console.log('🗑️  Starting Old Component Cleanup...\\n');
  
  const filesToDelete = [
    // Search components (keep one as reference)
    'components/ui/ModernSearchBar.tsx',
    'components/ui/EnhancedSearchBar.tsx',
    'components/SmartSearchBar.tsx',
    'components/AdvancedSearchSystem.tsx',
    'components/ZillowStyleSearch.tsx',
    
    // Car card components (keep one as reference)
    'components/PremiumCarCard.tsx',
    'components/ModernCarCard.tsx',
    'components/UltraPremiumCarCard.tsx',
    'components/EnhancedCarCard.tsx',
    'components/UnifiedCarCard.tsx',
    
    // Filter components
    'components/AdvancedSearchFilters.tsx',
    'components/SmartFilters.tsx',
    'components/advanced-search/SmartFilterSystem.tsx',
    
    // Modal components
    // Note: Keep functional modals for now, just update their imports
  ];
  
  let deletedCount = 0;
  
  for (const file of filesToDelete) {
    const fullPath = path.join(WORKSPACE_ROOT, file);
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`✅ Deleted: ${file}`);
        deletedCount++;
      }
    } catch (error) {
      console.error(`❌ Error deleting ${file}: ${error.message}`);
    }
  }
  
  console.log(`\\n🎉 Cleanup Complete! Deleted ${deletedCount} redundant component files.`);
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'analyze':
  case 'report':
    generateMigrationReport();
    break;
  case 'consolidate':
  case 'migrate':
    executeConsolidation();
    break;
  case 'cleanup':
  case 'delete':
    deleteOldComponents();
    break;
  case 'all':
    generateMigrationReport();
    console.log('\\n' + '='.repeat(50) + '\\n');
    executeConsolidation();
    console.log('\\n' + '='.repeat(50) + '\\n');
    deleteOldComponents();
    break;
  default:
    console.log('Component Consolidation Tool\\n');
    console.log('Usage: node consolidate-components.js <command>\\n');
    console.log('Commands:');
    console.log('  analyze    - Generate migration report');
    console.log('  consolidate - Update imports to use unified components');
    console.log('  cleanup    - Delete redundant component files');
    console.log('  all        - Run all commands in sequence\\n');
    console.log('Examples:');
    console.log('  node consolidate-components.js analyze');
    console.log('  node consolidate-components.js consolidate');
    break;
}

module.exports = {
  COMPONENT_MAPPINGS,
  updateFileImports,
  findDuplicateComponents,
  generateMigrationReport,
  executeConsolidation,
  deleteOldComponents,
};
