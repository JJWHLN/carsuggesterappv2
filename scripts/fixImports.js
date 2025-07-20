#!/usr/bin/env node

/**
 * 🔧 Import Fixer
 * Fixes incorrect logger imports that are placed inside methods
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing import issues...');

const projectRoot = process.cwd();

function fixImports(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && 
        !file.name.startsWith('.') && 
        !['node_modules', '__tests__', 'scripts'].includes(file.name)) {
      fixImports(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;
        
        // Check if file already has logger import at top
        const hasLoggerImport = content.match(/^import.*logger.*from.*@\/utils\/logger/m);
        
        // Find incorrect imports inside functions/methods
        const incorrectImports = content.match(/^[ \t]*import { logger } from '@\/utils\/logger';/gm);
        
        if (incorrectImports && incorrectImports.length > 0) {
          // Remove incorrect imports
          content = content.replace(/^[ \t]*import { logger } from '@\/utils\/logger';\n?/gm, '');
          
          // Add correct import at top if not already present
          if (!hasLoggerImport) {
            // Find the last import statement
            const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
            if (importLines.length > 0) {
              const lastImportLine = importLines[importLines.length - 1];
              const lastImportIndex = content.indexOf(lastImportLine);
              const endOfLastImport = content.indexOf('\n', lastImportIndex);
              
              content = content.slice(0, endOfLastImport + 1) + 
                        "import { logger } from '@/utils/logger';\n" +
                        content.slice(endOfLastImport + 1);
            } else {
              content = "import { logger } from '@/utils/logger';\n" + content;
            }
          }
          
          if (content !== originalContent) {
            fs.writeFileSync(fullPath, content);
            console.log(`✅ Fixed imports in: ${path.relative(projectRoot, fullPath)}`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${fullPath}:`, error.message);
      }
    }
  }
}

fixImports(projectRoot);
console.log('🎉 Import fixes complete!');
