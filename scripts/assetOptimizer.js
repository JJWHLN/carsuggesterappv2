#!/usr/bin/env node

console.log('🖼️  Asset Bundle Optimization\n');

const fs = require('fs');
const path = require('path');

function analyzeAssets() {
  console.log('📊 Analyzing current assets...');
  
  const assetsDir = 'assets';
  if (!fs.existsSync(assetsDir)) {
    console.log('⚠️  No assets directory found');
    return;
  }
  
  let totalSize = 0;
  const assetTypes = {};
  
  function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        scanDirectory(fullPath);
      } else {
        const ext = path.extname(item).toLowerCase();
        const size = stats.size;
        totalSize += size;
        
        if (!assetTypes[ext]) {
          assetTypes[ext] = { count: 0, size: 0 };
        }
        assetTypes[ext].count++;
        assetTypes[ext].size += size;
      }
    });
  }
  
  scanDirectory(assetsDir);
  
  console.log(`📁 Total Assets: ${(totalSize / 1024).toFixed(1)} KB\n`);
  
  Object.entries(assetTypes).forEach(([ext, data]) => {
    console.log(`${ext || 'no ext'}: ${data.count} files, ${(data.size / 1024).toFixed(1)} KB`);
  });
  
  // Recommendations
  console.log('\n💡 Optimization Recommendations:');
  
  if (assetTypes['.png'] && assetTypes['.png'].size > 50 * 1024) {
    console.log('   📸 Convert large PNGs to WebP (60-80% smaller)');
  }
  
  if (assetTypes['.jpg'] && assetTypes['.jpg'].size > 50 * 1024) {
    console.log('   📸 Optimize JPEG compression quality');
  }
  
  if (totalSize > 500 * 1024) {
    console.log('   ⚡ Implement lazy loading for non-critical assets');
  }
  
  console.log('   🎯 Use SVG for icons and simple graphics');
  console.log('   📱 Provide multiple resolutions (@1x, @2x, @3x)');
}

analyzeAssets();