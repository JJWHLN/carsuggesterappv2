const fs = require('fs');
const path = require('path');

const getDirectorySize = (dirPath) => {
  let totalSize = 0;
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stat.size;
      }
    });
  }
  return totalSize;
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const analyzePerformance = () => {
  console.log('CarSuggester Performance Analysis');
  
  const nodeModulesSize = getDirectorySize('node_modules');
  console.log(`Dependencies Size: ${formatBytes(nodeModulesSize)}`);
  
  if (nodeModulesSize > 200 * 1024 * 1024) {
    console.log('Bundle size is large - optimization needed');
  } else {
    console.log('Bundle size is optimized');
  }
};

analyzePerformance();
