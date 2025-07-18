#!/usr/bin/env node

/**
 * Migration utility to help convert components from old theme patterns to new consolidated patterns
 * 
 * Usage: node migrate-component.js <component-file-path>
 * 
 * This script helps automate the migration from:
 * - Old theme hooks to consolidated theme hooks
 * - getThemedStyles pattern to useThemedStyles
 * - Redundant style definitions to common themed styles
 */

const fs = require('fs');
const path = require('path');

class ComponentMigrator {
  constructor() {
    this.replacements = [
      // Theme hook replacements
      {
        pattern: /import.*useThemeColors.*from.*['"]@\/hooks\/useTheme['"];?\n/g,
        replacement: "import { useColors } from '@/hooks/useConsolidatedTheme';\n"
      },
      {
        pattern: /import.*useTheme.*from.*['"]@\/theme\/ThemeContext['"];?\n/g,
        replacement: "import { useTheme } from '@/hooks/useConsolidatedTheme';\n"
      },
      
      // Hook usage replacements
      {
        pattern: /const\s+{\s*colors\s*}\s*=\s*useThemeColors\(\);?/g,
        replacement: "const colors = useColors();"
      },
      {
        pattern: /const\s+{\s*colors\s*}\s*=\s*useTheme\(\);?/g,
        replacement: "const colors = useColors();"
      },
      
      // Style pattern replacements
      {
        pattern: /const\s+getThemedStyles\s*=\s*\(colors:\s*[^)]+\)\s*=>\s*StyleSheet\.create\(/g,
        replacement: "// Migrated to useThemedStyles\n  const styles = useThemedStyles((colors) => ({"
      },
      {
        pattern: /const\s+styles\s*=\s*useMemo\(\(\)\s*=>\s*getThemedStyles\(colors\),\s*\[colors\]\);?/g,
        replacement: "// Styles now handled by useThemedStyles hook above"
      },
      
      // Import additions for new hooks
      {
        pattern: /(import.*from ['"]@\/hooks\/useConsolidatedTheme['"];?\n)/,
        replacement: "$1import { useThemedStyles, useCommonThemedStyles } from '@/hooks/useThemedStyles';\n"
      }
    ];
    
    this.stylePatterns = [
      // Common container patterns
      {
        pattern: /container:\s*{\s*flex:\s*1,\s*backgroundColor:\s*colors\.background,?\s*}/g,
        replacement: "// Use commonStyles.container instead"
      },
      {
        pattern: /loadingContainer:\s*{\s*flex:\s*1,\s*justifyContent:\s*['"]center['"],\s*alignItems:\s*['"]center['"],.*?}/gs,
        replacement: "// Use commonStyles.loadingContainer instead"
      }
    ];
  }

  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const analysis = {
      hasOldThemePattern: false,
      hasGetThemedStyles: false,
      hasRedundantStyles: false,
      suggestions: []
    };

    // Check for old theme patterns
    if (content.includes('useThemeColors') || content.includes('getThemedStyles')) {
      analysis.hasOldThemePattern = true;
      analysis.suggestions.push('Migrate to consolidated theme hooks');
    }

    // Check for getThemedStyles pattern
    if (content.includes('getThemedStyles')) {
      analysis.hasGetThemedStyles = true;
      analysis.suggestions.push('Replace getThemedStyles with useThemedStyles');
    }

    // Check for common redundant patterns
    const redundantPatterns = [
      'flex: 1,\\s*backgroundColor: colors.background',
      'justifyContent: [\'"]center[\'"],\\s*alignItems: [\'"]center[\'"]',
      'fontSize: \\d+,\\s*color: colors.text'
    ];

    redundantPatterns.forEach(pattern => {
      if (new RegExp(pattern).test(content)) {
        analysis.hasRedundantStyles = true;
        analysis.suggestions.push('Use common themed styles for standard patterns');
      }
    });

    return analysis;
  }

  generateMigrationPlan(filePath) {
    const analysis = this.analyzeFile(filePath);
    const fileName = path.basename(filePath);
    
    console.log(`\n📋 Migration Plan for ${fileName}`);
    console.log('═'.repeat(50));
    
    if (analysis.suggestions.length === 0) {
      console.log('✅ No migration needed - component already follows best practices');
      return;
    }

    console.log('🔍 Issues Found:');
    analysis.suggestions.forEach((suggestion, index) => {
      console.log(`   ${index + 1}. ${suggestion}`);
    });

    console.log('\n🛠️ Recommended Changes:');
    
    if (analysis.hasOldThemePattern) {
      console.log(`
   📦 Update Imports:
   - Replace: import { useThemeColors } from '@/hooks/useTheme'
   - With:    import { useColors } from '@/hooks/useConsolidatedTheme'
   - Add:     import { useThemedStyles } from '@/hooks/useThemedStyles'`);
    }

    if (analysis.hasGetThemedStyles) {
      console.log(`
   🎨 Update Style Pattern:
   - Replace getThemedStyles function with useThemedStyles hook
   - Remove useMemo for style memoization (handled automatically)
   - Example:
     Before: const styles = useMemo(() => getThemedStyles(colors), [colors]);
     After:  const styles = useThemedStyles((colors) => ({ ... }));`);
    }

    if (analysis.hasRedundantStyles) {
      console.log(`
   🧹 Use Common Styles:
   - Add: const commonStyles = useCommonThemedStyles();
   - Replace standard patterns with commonStyles.container, etc.
   - Reduces boilerplate code significantly`);
    }

    console.log('\n📖 Reference Examples:');
    console.log('   - See: /app/+not-found.tsx (simple example)');
    console.log('   - See: /app/compare-improved.tsx (complex example)');
    console.log('   - See: /IMPROVEMENTS_REPORT.md (detailed guide)');
  }

  migrateSyntax(filePath, outputPath = null) {
    const content = fs.readFileSync(filePath, 'utf8');
    let migratedContent = content;

    // Apply all replacements
    this.replacements.forEach(({ pattern, replacement }) => {
      migratedContent = migratedContent.replace(pattern, replacement);
    });

    // Apply style pattern updates
    this.stylePatterns.forEach(({ pattern, replacement }) => {
      migratedContent = migratedContent.replace(pattern, replacement);
    });

    // Write to output file
    const outputFilePath = outputPath || filePath.replace('.tsx', '-migrated.tsx');
    fs.writeFileSync(outputFilePath, migratedContent);
    
    console.log(`\n✅ Syntax migration complete: ${path.basename(outputFilePath)}`);
    console.log('⚠️  Manual review required for complex patterns');
  }

  scanProject(projectDir) {
    console.log('🔍 Scanning project for migration opportunities...\n');
    
    const scanDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      entries.forEach(entry => {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          scanDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts'))) {
          const analysis = this.analyzeFile(fullPath);
          if (analysis.suggestions.length > 0) {
            console.log(`📄 ${path.relative(projectDir, fullPath)}`);
            analysis.suggestions.forEach(suggestion => {
              console.log(`   • ${suggestion}`);
            });
            console.log('');
          }
        }
      });
    };

    scanDir(projectDir);
  }
}

// CLI Usage
if (require.main === module) {
  const migrator = new ComponentMigrator();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🚀 Component Migration Tool

Usage:
  node migrate-component.js analyze <file-path>     - Analyze a single file
  node migrate-component.js migrate <file-path>     - Migrate a single file
  node migrate-component.js scan <project-dir>      - Scan entire project
  
Examples:
  node migrate-component.js analyze ./app/profile.tsx
  node migrate-component.js migrate ./app/profile.tsx
  node migrate-component.js scan ./app
    `);
    process.exit(1);
  }

  const [command, filePath] = args;

  switch (command) {
    case 'analyze':
      if (!fs.existsSync(filePath)) {
        console.error('❌ File not found:', filePath);
        process.exit(1);
      }
      migrator.generateMigrationPlan(filePath);
      break;
      
    case 'migrate':
      if (!fs.existsSync(filePath)) {
        console.error('❌ File not found:', filePath);
        process.exit(1);
      }
      migrator.migrateSyntax(filePath);
      break;
      
    case 'scan':
      if (!fs.existsSync(filePath)) {
        console.error('❌ Directory not found:', filePath);
        process.exit(1);
      }
      migrator.scanProject(filePath);
      break;
      
    default:
      console.error('❌ Unknown command:', command);
      process.exit(1);
  }
}

module.exports = ComponentMigrator;
