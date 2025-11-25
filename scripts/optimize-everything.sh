#!/bin/bash

# Master Optimization Script
# Runs all optimizations: GIFs → Video + Image Compression
# Expected total savings: 130-150MB (80-85% reduction)

set -e  # Exit on any error

echo "🚀 Master Optimization Script for Rajath.blog"
echo "=============================================="
echo ""
echo "This script will:"
echo "  1. Convert 3 GIFs to video (saves 55-58MB)"
echo "  2. Optimize all images (saves 130-140MB)"
echo "  3. Total: 163MB → 20-30MB"
echo ""
echo "Time estimate: 15-20 minutes"
echo ""

# Confirmation
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Converting GIFs to Video"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  ffmpeg not found. Install it with:"
    echo "   brew install ffmpeg"
    echo ""
    read -p "Skip GIF conversion and continue with image optimization? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    echo "Skipping GIF conversion..."
else
    ./scripts/convert-gifs-to-video.sh
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Optimizing All Images"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

./scripts/optimize-all-images.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ ALL OPTIMIZATIONS COMPLETE!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Update HTML for videos (if GIFs were converted):"
echo "   See: scripts/HTML_UPDATES.txt"
echo ""
echo "2. Review optimized images:"
echo "   open images-optimized/writings"
echo ""
echo "3. If everything looks good, replace images:"
echo "   mv images images-backup"
echo "   mv images-optimized images"
echo ""
echo "4. Test locally:"
echo "   # Jekyll should auto-reload"
echo "   # Or rebuild: bundle exec jekyll build"
echo "   # Check: http://localhost:4000"
echo ""
echo "5. Commit all changes:"
echo "   git add ."
echo '   git commit -m "perf: complete image optimization'
echo ""
echo "   - Convert GIFs to video (60MB → 5-8MB)"
echo "   - Optimize images (163MB → 20-30MB)"
echo '   - Total savings: ~140MB (85% reduction)"'
echo "   git push"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 Expected Results:"
echo "   • Site: 174MB → 25-35MB"
echo "   • PageSpeed Score: 85-95"
echo "   • Load Time: 75% faster"
echo ""
