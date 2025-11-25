#!/bin/bash

# Image Optimization Script Wrapper
# Optimizes all blog images: compress + generate WebP at 3 responsive sizes
# Expected: 163MB → 20-30MB (80-85% reduction)

set -e  # Exit on any error

echo "🖼️  Image Optimization for Rajath.blog"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "scripts/optimize-images.js" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "Usage: cd /Users/rajath/repos/personal_website && ./scripts/optimize-all-images.sh"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Install it from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js is installed: $(node --version)"
echo ""

# Check if sharp is installed
if [ ! -d "node_modules/sharp" ]; then
    echo "📦 Installing sharp (image optimization library)..."
    echo ""
    npm install sharp
    echo ""
    echo "✅ sharp installed"
    echo ""
fi

# Get current images directory size
if [ -d "images/writings" ]; then
    original_size=$(du -sh images/writings | cut -f1)
    echo "📊 Current images size: $original_size"
    echo ""
else
    echo "❌ Error: images/writings directory not found"
    exit 1
fi

# Run the optimization script
echo "🚀 Starting optimization..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

node scripts/optimize-images.js

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if optimization was successful
if [ -d "images-optimized/writings" ]; then
    optimized_size=$(du -sh images-optimized/writings | cut -f1)

    echo "✅ Optimization Complete!"
    echo ""
    echo "📊 Size Comparison:"
    echo "   Original:  $original_size"
    echo "   Optimized: $optimized_size"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 Next Steps:"
    echo ""
    echo "1. Review optimized images:"
    echo "   open images-optimized/writings"
    echo ""
    echo "2. Backup original images:"
    echo "   mv images images-backup"
    echo ""
    echo "3. Replace with optimized images:"
    echo "   mv images-optimized images"
    echo ""
    echo "4. Rebuild Jekyll site to test:"
    echo "   bundle exec jekyll build"
    echo "   # Or if server is running, it will auto-reload"
    echo ""
    echo "5. Commit the changes:"
    echo "   git add images/ package.json package-lock.json"
    echo "   git commit -m \"perf: optimize all blog images\""
    echo "   git push"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "❌ Error: Optimization failed - images-optimized directory not created"
    exit 1
fi
