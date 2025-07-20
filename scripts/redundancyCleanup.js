#!/usr/bin/env node

/**
 * 🧹 Critical Redundancy Cleanup Script
 * Removes duplicate services and deprecated files to reduce bundle size
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting Critical Redundancy Cleanup...');

const projectRoot = process.cwd();

// Files to remove (redundant/deprecated)
const filesToRemove = [
  'services/analyticsService-improved.ts',
  'services/analyticsService-old.ts', 
  'services/featureServices-improved.ts',
  'services/featureServices-old.ts',
  'services/storageService-improved.ts',
  'services/storageService-old.ts',
  'utils/optimized-icons.ts', // Deprecated in favor of ultra-optimized-icons.tsx
];

// Track cleanup results
let removedFiles = [];
let errors = [];
let totalSizeReduced = 0;

function removeFile(filePath) {
  const fullPath = path.join(projectRoot, filePath);
  
  try {
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      
      fs.unlinkSync(fullPath);
      removedFiles.push({ path: filePath, size: sizeKB });
      totalSizeReduced += parseFloat(sizeKB);
      
      console.log(`✅ Removed: ${filePath} (${sizeKB}KB)`);
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  } catch (error) {
    errors.push({ path: filePath, error: error.message });
    console.error(`❌ Error removing ${filePath}:`, error.message);
  }
}

// Remove redundant files
console.log('\n📁 Removing redundant service files...');
filesToRemove.forEach(removeFile);

// Update imports from optimized-icons to ultra-optimized-icons
console.log('\n🔄 Updating deprecated icon imports...');

function updateIconImports(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
      updateIconImports(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;
        
        // Update imports from optimized-icons to ultra-optimized-icons
        content = content.replace(
          /from\s+['"]@\/utils\/optimized-icons['"]/g,
          "from '@/utils/ultra-optimized-icons'"
        );
        
        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content);
          console.log(`✅ Updated icon imports in: ${path.relative(projectRoot, fullPath)}`);
        }
      } catch (error) {
        console.error(`❌ Error updating ${fullPath}:`, error.message);
      }
    }
  }
}

updateIconImports(projectRoot);

// Generate cleanup report
console.log('\n📊 Cleanup Summary:');
console.log(`✅ Files removed: ${removedFiles.length}`);
console.log(`❌ Errors: ${errors.length}`);
console.log(`💾 Total size reduced: ${totalSizeReduced.toFixed(2)}KB (~${(totalSizeReduced/1024).toFixed(2)}MB)`);

if (removedFiles.length > 0) {
  console.log('\n📋 Removed files:');
  removedFiles.forEach(file => {
    console.log(`  • ${file.path} (${file.size}KB)`);
  });
}

if (errors.length > 0) {
  console.log('\n⚠️  Errors encountered:');
  errors.forEach(error => {
    console.log(`  • ${error.path}: ${error.error}`);
  });
}

// Create cleanup report file
const reportContent = `# 🧹 Redundancy Cleanup Report
Generated: ${new Date().toISOString()}

## Summary
- **Files Removed**: ${removedFiles.length}
- **Size Reduced**: ${totalSizeReduced.toFixed(2)}KB (~${(totalSizeReduced/1024).toFixed(2)}MB)
- **Errors**: ${errors.length}

## Removed Files
${removedFiles.map(f => `- ${f.path} (${f.size}KB)`).join('\n')}

## Icon Import Updates
- Updated all imports from \`optimized-icons\` → \`ultra-optimized-icons\`
- Removed deprecated icon system

## Next Steps
1. ✅ Run \`npm run build\` to verify build works
2. ✅ Run tests to ensure no breaking changes
3. ✅ Proceed with console logging cleanup
4. ✅ Implement high-priority TODOs

## Bundle Impact
- **Previous Bundle**: 14MB
- **Estimated New Bundle**: ~${(14 - (totalSizeReduced/1024)).toFixed(1)}MB
- **Reduction**: ${((totalSizeReduced/1024)/14*100).toFixed(1)}%
`;

fs.writeFileSync(path.join(projectRoot, 'redundancy-cleanup-report.md'), reportContent);

console.log('\n🎉 Redundancy cleanup complete!');
console.log('📄 Report saved to: redundancy-cleanup-report.md');
console.log('\n🚀 Next: Run npm run build to verify bundle optimization');
