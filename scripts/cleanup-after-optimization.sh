#!/bin/bash

# Cleanup Script After Image Optimization
# Removes unnecessary files and prepares for commit

set -e

echo "🧹 Cleanup Script for Optimized Repository"
echo "==========================================="
echo ""

# Safety check
if [ ! -d "images-optimized" ]; then
    echo "❌ Error: images-optimized directory not found"
    echo "This script should be run after optimization is complete"
    exit 1
fi

echo "This script will:"
echo "  1. Remove original GIF files (60MB - videos created)"
echo "  2. Replace images/ with optimized versions"
echo "  3. Remove unnecessary font formats (keep only woff2)"
echo "  4. Update .gitignore"
echo "  5. Clean up temporary files"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 1: Backing up original images"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ! -d "images-backup" ]; then
    echo "Creating backup of original images..."
    cp -r images images-backup
    echo "✅ Backup created: images-backup/"
else
    echo "✅ Backup already exists: images-backup/"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 2: Removing original GIF files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Remove GIFs (videos already created)
echo "Removing GIF files (videos exist)..."
rm -f images/writings/07-back-to-writing/neo1.gif
rm -f images/writings/04-product-hunt/1.gif
rm -f images/writings/07-back-to-writing/language-launch.gif
echo "✅ Removed 3 GIF files (60MB saved)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 3: Replacing images with optimized versions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Merge optimized images
echo "Copying optimized images..."
cp -r images-optimized/writings/* images/writings/
echo "✅ Images replaced with optimized versions"

# Remove images-optimized
echo "Removing images-optimized directory..."
rm -rf images-optimized
echo "✅ Cleaned up images-optimized/"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 4: Removing unnecessary font formats"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Remove unnecessary font formats (keep only woff2)
echo "Removing .eot, .ttf, .svg, .woff files (keeping only woff2)..."

# Bricolage Grotesque - keep only woff2
rm -f fonts/bricolage-grotesque/*.eot
rm -f fonts/bricolage-grotesque/*.ttf
rm -f fonts/bricolage-grotesque/*.svg
rm -f fonts/bricolage-grotesque/*.woff

# Oi font - keep only woff2
rm -f fonts/oi/*.eot
rm -f fonts/oi/*.ttf
rm -f fonts/oi/*.svg
rm -f fonts/oi/*.woff

# Sligoil - keep only woff2 in web folder
rm -f fonts/sligoil-main/fonts/web/*.woff
rm -rf fonts/sligoil-main/fonts/ttf
rm -rf fonts/sligoil-main/fonts/variable

echo "✅ Removed unnecessary font formats (~200KB saved)"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "STEP 5: Updating .gitignore"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Update .gitignore
cat > .gitignore << 'EOF'
.jekyll-cache
_site
node_modules
images-backup
images-optimized
package-lock.json
.DS_Store
EOF

echo "✅ Updated .gitignore"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Cleanup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Show final sizes
echo "📊 Final Sizes:"
du -sh images 2>/dev/null | awk '{print "   Images:    " $1}'
du -sh fonts 2>/dev/null | awk '{print "   Fonts:     " $1}'
du -sh _site 2>/dev/null | awk '{print "   Site:      " $1}' || echo "   Site:      (rebuild needed)"

echo ""
echo "📝 What was cleaned:"
echo "   ✅ Original GIF files removed (60MB)"
echo "   ✅ Optimized images merged into images/"
echo "   ✅ Unnecessary font formats removed (200KB)"
echo "   ✅ images-optimized directory removed"
echo "   ✅ .gitignore updated"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Rebuild Jekyll to verify everything works:"
echo "   bundle exec jekyll build"
echo ""
echo "2. Check the site locally:"
echo "   # Server should auto-reload if running"
echo "   # Otherwise: bundle exec jekyll serve"
echo ""
echo "3. Review what changed:"
echo "   git status"
echo ""
echo "4. Commit everything:"
echo "   git add ."
echo '   git commit -m "perf: complete optimization - images, GIFs, fonts'
echo ""
echo "   - Convert GIFs to video (60MB → 12MB)"
echo "   - Optimize images with WebP variants (193MB → 108MB)"
echo "   - Remove unnecessary font formats (200KB)"
echo '   - Total: ~130MB saved"'
echo "   git push"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
