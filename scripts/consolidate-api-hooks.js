#!/usr/bin/env node

/**
 * API Hook Consolidation Script
 * 
 * This script consolidates duplicate API hooks by:
 * 1. Replacing useApi, useDataFetching, useSimpleDataFetching with useUnifiedDataFetching
 * 2. Updating import statements
 * 3. Adjusting hook usage patterns
 */

const fs = require('fs');
const path = require('path');

const WORKSPACE_ROOT = 'f:\\carsuggester code\\carsuggesterapp-main v2';
const SEARCH_PATTERNS = /\.(tsx|ts|jsx|js)$/;
const EXCLUDE_PATTERNS = ['node_modules', '.git', 'build', 'dist', 'scripts'];

// Hook replacement mappings
const HOOK_REPLACEMENTS = {
  'useApi': {
    newHook: 'useUnifiedDataFetching',
    newImport: "import { useUnifiedDataFetching } from '@/hooks/useUnifiedDataFetching'",
    oldImports: [
      "import { useApi } from '@/hooks/useApi'",
      "import { useApi } from '../hooks/useApi'",
      "import { useApi } from './useApi'",
    ],
    transform: (code) => {
      // Transform useApi(apiFunction, deps) to useUnifiedDataFetching(apiFunction, deps, { initialLoad: true })
      return code.replace(
        /useApi\s*\(\s*([^,]+),?\s*([^\)]*)\)/g,
        'useUnifiedDataFetching($1, $2, { initialLoad: true, enabled: true })'
      );
    }
  },
  'useDataFetching': {
    newHook: 'useUnifiedDataFetching',
    newImport: "import { useUnifiedDataFetching } from '@/hooks/useUnifiedDataFetching'",
    oldImports: [
      "import { useDataFetching } from '@/hooks/useDataFetching'",
      "import { useDataFetching } from '../hooks/useDataFetching'",
    ],
    transform: (code) => {
      // Transform useDataFetching with pagination options
      return code.replace(
        /useDataFetching\s*\(\s*([^,]+),?\s*([^,]*),?\s*([^\)]*)\)/g,
        'useUnifiedDataFetching($1, $2, { enablePagination: true, enableSearch: true, ...$3 })'
      );
    }
  },
  'useSimpleDataFetching': {
    newHook: 'useUnifiedDataFetching',
    newImport: "import { useUnifiedDataFetching } from '@/hooks/useUnifiedDataFetching'",
    oldImports: [
      "import { useSimpleDataFetching } from '@/hooks/useDataFetching'",
    ],
    transform: (code) => {
      return code.replace(
        /useSimpleDataFetching\s*\(\s*([^,]+),?\s*([^,]*),?\s*([^\)]*)\)/g,
        'useUnifiedDataFetching($1, $2, { initialLoad: true })'
      );
    }
  }
};

// Utility functions
function getAllFiles(dir, filePattern) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  
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
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;
    let updatedImports = new Set();

    // Check and replace each hook
    for (const [hookName, config] of Object.entries(HOOK_REPLACEMENTS)) {
      // Check if file uses this hook
      const hasHook = new RegExp(`\\b${hookName}\\s*\\(`).test(content);
      
      if (hasHook) {
        // Replace old imports
        for (const oldImport of config.oldImports) {
          if (content.includes(oldImport)) {
            content = content.replace(oldImport, '');
            hasChanges = true;
          }
        }
        
        // Transform hook usage
        const newContent = config.transform(content);
        if (newContent !== content) {
          content = newContent;
          hasChanges = true;
          updatedImports.add(config.newImport);
        }
      }
    }

    // Add new imports at the top if needed
    if (updatedImports.size > 0) {
      const imports = Array.from(updatedImports).join('\n');
      
      // Find the best place to insert imports
      const lines = content.split('\n');
      let insertIndex = 0;
      
      // Find last import statement
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ')) {
          insertIndex = i + 1;
        } else if (lines[i].trim() === '' && insertIndex > 0) {
          insertIndex = i;
          break;
        }
      }
      
      lines.splice(insertIndex, 0, imports);
      content = lines.join('\n');
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content);
      return true;
    }
  } catch (error) {
    console.error(`Error updating file ${filePath}:`, error);
  }
  
  return false;
}

function generateReport() {
  console.log('🔄 API Hook Consolidation Report\n');
  
  const files = getAllFiles(WORKSPACE_ROOT, SEARCH_PATTERNS);
  let totalFilesUpdated = 0;
  const updatedFiles = [];
  
  for (const file of files) {
    if (updateFileImports(file)) {
      totalFilesUpdated++;
      updatedFiles.push(path.relative(WORKSPACE_ROOT, file));
    }
  }
  
  console.log(`📊 Summary:`);
  console.log(`   - ${totalFilesUpdated} files updated`);
  console.log(`   - ${Object.keys(HOOK_REPLACEMENTS).length} hooks consolidated`);
  
  if (updatedFiles.length > 0) {
    console.log('\n📂 Updated Files:');
    updatedFiles.forEach(file => console.log(`   - ${file}`));
  }
  
  console.log('\n✅ API hook consolidation complete!');
  console.log('\n🗑️  Ready to remove old hook files:');
  console.log('   - hooks/useApi.ts');
  console.log('   - hooks/useDataFetching.ts (remove useSimpleDataFetching)');
}

// CLI interface
const command = process.argv[2];

switch (command) {
  case 'report':
  case 'analyze':
    console.log('Analyzing API hook usage...');
    generateReport();
    break;
  case 'execute':
  case 'run':
    console.log('Executing API hook consolidation...');
    generateReport();
    break;
  default:
    console.log('API Hook Consolidation Tool\n');
    console.log('Usage: node consolidate-api-hooks.js <command>\n');
    console.log('Commands:');
    console.log('  analyze    - Analyze current hook usage');
    console.log('  execute    - Run the consolidation process');
    break;
}

module.exports = {
  HOOK_REPLACEMENTS,
  updateFileImports,
  generateReport,
};
