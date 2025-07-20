
# Asset Optimization Guide

## Image Optimization
- Use WebP format for photos (60-80% smaller than JPEG)
- Use SVG for icons and simple graphics
- Implement lazy loading for off-screen images
- Use appropriate image sizes for different screen densities

## Font Optimization
- Use font-display: swap for custom fonts
- Subset fonts to only include used characters
- Consider system fonts for body text

## Bundle Splitting
- Split large screens into separate chunks
- Use React.lazy() for non-critical components
- Implement route-based code splitting

## Current Asset Issues:
- Missing car-placeholder.png (causing build errors)
- Icons could be optimized further
- Font files may be unused

## Recommended Actions:
1. Create missing placeholder images
2. Audit font usage
3. Implement image lazy loading
4. Use optimized image formats
