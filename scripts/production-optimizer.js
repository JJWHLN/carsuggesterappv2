#!/usr/bin/env node

/**
 * 🧹 Production Cleanup Script
 * Removes development artifacts and optimizes for production
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const DEVELOPMENT_PATTERNS = {
  // Console statements to remove
  consolePatterns: [
    /console\.(log|debug|info|warn|trace)\([^)]*\);?\s*\n?/g,
    /console\.(error)\([^)]*\);?\s*(?=\/\/|$)/g, // Keep errors but remove standalone ones
    /debugger;?\s*\n?/g,
  ],
  
  // Comment patterns to remove
  commentPatterns: [
    /\/\/ DEBUG:.*\n/g,
    /\/\/ TODO:.*\n/g,  // Optional: remove TODOs
    /\/\/ FIXME:.*\n/g,
    /\/\* DEBUG[\s\S]*?\*\//g,
    /\/\*\* @debug[\s\S]*?\*\//g,
  ],

  // Development files to remove
  devFiles: [
    'DebugPanel.tsx',
    'DevTools.tsx', 
    'TestComponent.tsx',
    'MockData.ts',
    'testData.json',
    'dummyData.ts',
    '*.test.ts',
    '*.test.tsx',
    '*.spec.ts',
    '*.spec.tsx',
    'storybook/',
    '__tests__/',
    '__mocks__/',
  ],

  // Development dependencies to analyze
  devDependencies: [
    '@storybook/',
    'jest',
    'testing-library',
    'enzyme',
    'debug',
    'why-did-you-render',
  ]
};

class ProductionOptimizer {
  constructor() {
    this.srcDir = path.join(process.cwd(), 'src');
    this.appDir = path.join(process.cwd(), 'app');
    this.componentsDir = path.join(process.cwd(), 'components');
    this.packagesRemoved = [];
    this.filesProcessed = 0;
    this.linesRemoved = 0;
  }

  async optimize() {
    console.log('🚀 Starting production optimization...\n');

    try {
      // Phase 1: Remove console statements and debug code
      await this.removeConsoleStatements();
      
      // Phase 2: Clean comments and debug annotations
      await this.cleanComments();
      
      // Phase 3: Remove development files
      await this.removeDevFiles();
      
      // Phase 4: Analyze and suggest dependency cleanup
      await this.analyzeDependencies();
      
      // Phase 5: Generate optimization report
      await this.generateReport();

      console.log('\n✅ Production optimization complete!');
      
    } catch (error) {
      console.error('❌ Optimization failed:', error.message);
      process.exit(1);
    }
  }

  async removeConsoleStatements() {
    console.log('🔍 Removing console statements...');
    
    const dirs = [this.srcDir, this.appDir, this.componentsDir].filter(dir => 
      fs.access(dir).then(() => true).catch(() => false)
    );

    for (const dir of await Promise.all(dirs)) {
      if (dir) {
        await this.processDirectory(dir, this.removeConsoleFromFile.bind(this));
      }
    }
  }

  async removeConsoleFromFile(filePath) {
    if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) return;

    try {
      let content = await fs.readFile(filePath, 'utf8');
      const originalLines = content.split('\n').length;
      
      // Apply console removal patterns
      for (const pattern of DEVELOPMENT_PATTERNS.consolePatterns) {
        content = content.replace(pattern, '');
      }

      // Remove empty lines created by removals
      content = content.replace(/\n\n\n+/g, '\n\n');

      const newLines = content.split('\n').length;
      if (newLines < originalLines) {
        await fs.writeFile(filePath, content);
        this.linesRemoved += (originalLines - newLines);
        console.log(`  ✓ Cleaned: ${path.relative(process.cwd(), filePath)}`);
      }

    } catch (error) {
      console.error(`  ❌ Failed to process ${filePath}:`, error.message);
    }
  }

  async cleanComments() {
    console.log('\n🧽 Cleaning development comments...');
    
    const dirs = [this.srcDir, this.appDir, this.componentsDir].filter(Boolean);
    
    for (const dir of dirs) {
      await this.processDirectory(dir, this.cleanCommentsFromFile.bind(this));
    }
  }

  async cleanCommentsFromFile(filePath) {
    if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) return;

    try {
      let content = await fs.readFile(filePath, 'utf8');
      const originalLength = content.length;

      // Apply comment removal patterns
      for (const pattern of DEVELOPMENT_PATTERNS.commentPatterns) {
        content = content.replace(pattern, '');
      }

      if (content.length < originalLength) {
        await fs.writeFile(filePath, content);
        console.log(`  ✓ Comments cleaned: ${path.relative(process.cwd(), filePath)}`);
      }

    } catch (error) {
      console.error(`  ❌ Failed to clean comments in ${filePath}:`, error.message);
    }
  }

  async removeDevFiles() {
    console.log('\n🗑️  Removing development files...');
    
    const allDirs = [this.srcDir, this.appDir, this.componentsDir, process.cwd()];
    
    for (const dir of allDirs) {
      try {
        await this.processDirectory(dir, this.checkAndRemoveDevFile.bind(this));
      } catch (error) {
        // Directory might not exist, continue
      }
    }
  }

  async checkAndRemoveDevFile(filePath) {
    const fileName = path.basename(filePath);
    const shouldRemove = DEVELOPMENT_PATTERNS.devFiles.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('*', '.*'));
        return regex.test(fileName);
      }
      return fileName === pattern;
    });

    if (shouldRemove) {
      try {
        const stats = await fs.stat(filePath);
        if (stats.isDirectory()) {
          await fs.rmdir(filePath, { recursive: true });
          console.log(`  ✓ Removed directory: ${path.relative(process.cwd(), filePath)}`);
        } else {
          await fs.unlink(filePath);
          console.log(`  ✓ Removed file: ${path.relative(process.cwd(), filePath)}`);
        }
      } catch (error) {
        // File might not exist, continue
      }
    }
  }

  async processDirectory(dir, processor) {
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          await this.processDirectory(fullPath, processor);
        } else if (item.isFile()) {
          await processor(fullPath);
          this.filesProcessed++;
        }
      }
    } catch (error) {
      // Directory might not exist, continue silently
    }
  }

  async analyzeDependencies() {
    console.log('\n📦 Analyzing dependencies...');
    
    try {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      const devDepsToRemove = [];
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      for (const [name, version] of Object.entries(deps)) {
        const isDev = DEVELOPMENT_PATTERNS.devDependencies.some(pattern => 
          name.includes(pattern)
        );
        
        if (isDev) {
          devDepsToRemove.push(name);
        }
      }

      if (devDepsToRemove.length > 0) {
        console.log('  📋 Development dependencies found:');
        devDepsToRemove.forEach(dep => {
          console.log(`    - ${dep}`);
        });
        console.log('  💡 Consider removing these in production builds');
      } else {
        console.log('  ✅ No obvious development dependencies found');
      }

    } catch (error) {
      console.error('  ❌ Failed to analyze dependencies:', error.message);
    }
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      optimization: {
        filesProcessed: this.filesProcessed,
        linesRemoved: this.linesRemoved,
        packagesAnalyzed: true,
      },
      performance: {
        expectedBundleReduction: `${Math.round(this.linesRemoved * 0.1)}KB`,
        consoleLogsRemoved: true,
        debugCodeRemoved: true,
        devFilesRemoved: true,
      },
      recommendations: [
        'Run bundle analyzer to verify size reduction',
        'Test app thoroughly after optimization',
        'Consider enabling Hermes for additional performance',
        'Monitor app performance in production',
      ]
    };

    const reportPath = path.join(process.cwd(), 'PRODUCTION_OPTIMIZATION_REPORT.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log('\n📊 Optimization Report:');
    console.log(`  Files processed: ${report.optimization.filesProcessed}`);
    console.log(`  Lines removed: ${report.optimization.linesRemoved}`);
    console.log(`  Expected bundle reduction: ${report.performance.expectedBundleReduction}`);
    console.log(`  Report saved: ${reportPath}`);
  }
}

// Run the optimizer
if (require.main === module) {
  const optimizer = new ProductionOptimizer();
  optimizer.optimize().catch(console.error);
}

module.exports = ProductionOptimizer;
