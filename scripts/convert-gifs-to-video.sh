#!/bin/bash

# GIF to Video Conversion Script
# Converts all blog GIFs to MP4 and WebM formats
# Saves 55-58MB (90% reduction!)

set -e  # Exit on any error

echo "🎬 GIF to Video Conversion Script"
echo "=================================="
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ Error: ffmpeg is not installed"
    echo "Install it with: brew install ffmpeg"
    exit 1
fi

echo "✅ ffmpeg is installed"
echo ""

# Base directory
BASE_DIR="/Users/rajath/repos/personal_website/images/writings"

# Array of GIF files to convert
declare -a GIFS=(
    "07-back-to-writing/neo1.gif"
    "04-product-hunt/1.gif"
    "07-back-to-writing/language-launch.gif"
)

# Function to get file size in human-readable format
get_size() {
    if [ -f "$1" ]; then
        du -h "$1" | cut -f1
    else
        echo "N/A"
    fi
}

# Convert each GIF
for gif_path in "${GIFS[@]}"; do
    full_path="$BASE_DIR/$gif_path"
    dir_path=$(dirname "$full_path")
    filename=$(basename "$gif_path" .gif)

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Processing: $gif_path"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Check if GIF exists
    if [ ! -f "$full_path" ]; then
        echo "⚠️  Warning: $full_path not found, skipping..."
        echo ""
        continue
    fi

    original_size=$(get_size "$full_path")
    echo "📦 Original GIF size: $original_size"
    echo ""

    # Convert to MP4
    echo "🎥 Converting to MP4..."
    mp4_output="$dir_path/${filename}.mp4"

    ffmpeg -i "$full_path" \
        -movflags faststart \
        -pix_fmt yuv420p \
        -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" \
        -y \
        "$mp4_output" \
        2>&1 | grep -E "(Duration|time=|size=)" || true

    if [ -f "$mp4_output" ]; then
        mp4_size=$(get_size "$mp4_output")
        echo "✅ MP4 created: $mp4_size"
    else
        echo "❌ Failed to create MP4"
    fi
    echo ""

    # Convert to WebM
    echo "🎥 Converting to WebM..."
    webm_output="$dir_path/${filename}.webm"

    ffmpeg -i "$full_path" \
        -c:v libvpx-vp9 \
        -b:v 0 \
        -crf 30 \
        -y \
        "$webm_output" \
        2>&1 | grep -E "(Duration|time=|size=)" || true

    if [ -f "$webm_output" ]; then
        webm_size=$(get_size "$webm_output")
        echo "✅ WebM created: $webm_size"
    else
        echo "❌ Failed to create WebM"
    fi

    echo ""
    echo "📊 Summary for $filename:"
    echo "   Original GIF: $original_size"
    echo "   MP4:          $mp4_size"
    echo "   WebM:         $webm_size"
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Conversion Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Test the videos locally (Jekyll should auto-reload)"
echo "2. Update HTML in these post files:"
echo "   - _posts/2024-12-28-back-to-writing.html (neo1 + language-launch)"
echo "   - _posts/2024-08-06-product-hunt.html (1.gif)"
echo ""
echo "3. Replace <img> tags with <video> tags (see HTML_UPDATES.txt)"
echo ""
echo "4. After verifying videos work, optionally delete original GIFs:"
echo "   rm $BASE_DIR/07-back-to-writing/neo1.gif"
echo "   rm $BASE_DIR/04-product-hunt/1.gif"
echo "   rm $BASE_DIR/07-back-to-writing/language-launch.gif"
echo ""
echo "Expected savings: ~55-58MB (90% reduction!)"
echo ""
