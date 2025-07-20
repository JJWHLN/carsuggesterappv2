#!/usr/bin/env node

/**
 * 🔍 Console Logging Optimizer
 * Replaces console.log statements with production-safe logging
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting Console Logging Optimization...');

const projectRoot = process.cwd();

// Create optimized logging service
const loggingServiceContent = `/**
 * 🔧 Production-Safe Logging Service
 * Replaces console.log with conditional, optimized logging
 */

const isDevelopment = __DEV__ || process.env.NODE_ENV === 'development';

export class Logger {
  private static instance: Logger;
  private enabled: boolean = isDevelopment;
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  debug(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(\`🔧 \${message}\`, ...args);
    }
  }
  
  info(message: string, ...args: any[]): void {
    if (this.enabled) {
      console.log(\`ℹ️  \${message}\`, ...args);
    }
  }
  
  warn(message: string, ...args: any[]): void {
    if (this.enabled || __DEV__) {
      console.warn(\`⚠️  \${message}\`, ...args);
    }
  }
  
  error(message: string, error?: any, ...args: any[]): void {
    if (this.enabled) {
      console.error(\`❌ \${message}\`, error, ...args);
    } else {
      console.error(\`❌ \${message}\`, error?.message || 'Error occurred');
    }
  }
  
  performance(operation: string, duration: number): void {
    if (this.enabled) {
      console.log(\`📊 \${operation}: \${duration}ms\`);
    }
  }
}

export const logger = Logger.getInstance();
`;

// Create the logging service
const loggingServicePath = path.join(projectRoot, 'utils', 'logger.ts');
fs.writeFileSync(loggingServicePath, loggingServiceContent);
console.log('✅ Created production-safe logging service: utils/logger.ts');

// Track optimization results
let processedFiles = [];
let totalConsoleStatements = 0;
let optimizedStatements = 0;

function optimizeLogging(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    
    if (file.isDirectory() && 
        !file.name.startsWith('.') && 
        !['node_modules', '__tests__', 'scripts'].includes(file.name)) {
      optimizeLogging(fullPath);
    } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
      try {
        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;
        
        const consoleMatches = content.match(/console\.(log|warn|error|info|debug)/g) || [];
        totalConsoleStatements += consoleMatches.length;
        
        if (consoleMatches.length > 0) {
          if (!content.includes("from '@/utils/logger'")) {
            const importLines = content.split('\n').filter(line => line.trim().startsWith('import'));
            if (importLines.length > 0) {
              const lastImportIndex = content.lastIndexOf(importLines[importLines.length - 1]);
              const endOfLastImport = content.indexOf('\n', lastImportIndex);
              content = content.slice(0, endOfLastImport + 1) + 
                        "import { logger } from '@/utils/logger';\n" +
                        content.slice(endOfLastImport + 1);
            } else {
              content = "import { logger } from '@/utils/logger';\n" + content;
            }
          }
          
          let fileOptimizations = 0;
          
          content = content.replace(/console\.log\(/g, () => {
            fileOptimizations++;
            return 'logger.debug(';
          });
          
          content = content.replace(/console\.warn\(/g, () => {
            fileOptimizations++;
            return 'logger.warn(';
          });
          
          content = content.replace(/console\.error\(/g, () => {
            fileOptimizations++;
            return 'logger.error(';
          });
          
          content = content.replace(/console\.info\(/g, () => {
            fileOptimizations++;
            return 'logger.info(';
          });
          
          optimizedStatements += fileOptimizations;
          
          if (content !== originalContent) {
            fs.writeFileSync(fullPath, content);
            processedFiles.push({
              path: path.relative(projectRoot, fullPath),
              consoleCount: consoleMatches.length,
              optimized: fileOptimizations
            });
            console.log(`✅ Optimized: ${path.relative(projectRoot, fullPath)} (${fileOptimizations} statements)`);
          }
        }
      } catch (error) {
        console.error(`❌ Error processing ${fullPath}:`, error.message);
      }
    }
  }
}

// Process all files
optimizeLogging(projectRoot);

// Generate results
console.log('\n📊 Console Logging Optimization Summary:');
console.log(`✅ Files processed: ${processedFiles.length}`);
console.log(`📝 Console statements found: ${totalConsoleStatements}`);
console.log(`🔧 Statements optimized: ${optimizedStatements}`);
console.log(`📈 Optimization rate: ${totalConsoleStatements > 0 ? (optimizedStatements/totalConsoleStatements*100).toFixed(1) : 0}%`);

const reportData = {
  timestamp: new Date().toISOString(),
  filesProcessed: processedFiles.length,
  totalStatements: totalConsoleStatements,
  optimizedStatements: optimizedStatements,
  files: processedFiles
};

fs.writeFileSync(
  path.join(projectRoot, 'console-optimization-report.json'), 
  JSON.stringify(reportData, null, 2)
);

console.log('\n🎉 Console logging optimization complete!');
console.log('📄 Report saved to: console-optimization-report.json');
console.log('\n🚀 Next: Implement high-priority TODO features');
