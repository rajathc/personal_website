#!/bin/bash

# GIF to Video Conversion Script
# Converts blog GIFs to MP4 (H.264) and WebM (VP9), plus a JPEG poster frame.
#
# Videos are downscaled to at most MAX_WIDTH pixels wide (default 1600, i.e.
# 2x the 800px content column). Without this, a 4K screen recording shipped
# as a 14 MB WebM for a clip shown 800px wide.
#
# Usage:
#   scripts/convert-gifs-to-video.sh images/writings/<post>/clip.gif [...]
#   MAX_WIDTH=800 scripts/convert-gifs-to-video.sh images/writings/<post>/square.gif
#
# Outputs land next to each GIF: clip.mp4, clip.webm and clip-poster.jpg.
# Use them as:
#   <video class="blog-image" width="W" height="H" poster="/images/writings/<post>/clip-poster.jpg"
#          autoplay loop muted playsinline>
#     <source src="/images/writings/<post>/clip.webm" type="video/webm">
#     <source src="/images/writings/<post>/clip.mp4" type="video/mp4">
#   </video>

set -euo pipefail

MAX_WIDTH="${MAX_WIDTH:-1600}"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "🎬 GIF to Video Conversion Script"
echo "=================================="
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ Error: ffmpeg is not installed"
    echo "Install it with: brew install ffmpeg"
    exit 1
fi

if [ "$#" -eq 0 ]; then
    echo "Usage: $0 images/writings/<post>/clip.gif [more.gif ...]"
    echo "       (set MAX_WIDTH=<px> to change the 1600px width cap)"
    exit 1
fi

if ! [[ "$MAX_WIDTH" =~ ^[0-9]+$ ]]; then
    echo "❌ Error: MAX_WIDTH must be a whole number of pixels"
    exit 1
fi

# Cap the width, never upscale, keep the aspect ratio, and keep both
# dimensions even (required by yuv420p).
SCALE="scale='trunc(min(${MAX_WIDTH},iw)/2)*2':-2:flags=lanczos"

# Function to get file size in human-readable format
get_size() {
    if [ -f "$1" ]; then
        du -h "$1" | cut -f1
    else
        echo "N/A"
    fi
}

for gif_path in "$@"; do
    # Accept paths relative to the repo root or to the current directory.
    if [ -f "$gif_path" ]; then
        full_path="$gif_path"
    else
        full_path="$REPO_ROOT/$gif_path"
    fi
    dir_path=$(dirname "$full_path")
    filename=$(basename "$full_path" .gif)

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Processing: $gif_path (max width ${MAX_WIDTH}px)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ ! -f "$full_path" ]; then
        echo "⚠️  Warning: $full_path not found, skipping..."
        echo ""
        continue
    fi

    original_size=$(get_size "$full_path")
    echo "📦 Original GIF size: $original_size"
    echo ""

    # MP4 (H.264): the fallback every browser plays
    echo "🎥 Converting to MP4..."
    mp4_output="$dir_path/${filename}.mp4"
    ffmpeg -hide_banner -loglevel error -y -i "$full_path" \
        -vf "$SCALE" \
        -an \
        -c:v libx264 -crf 24 -preset slow \
        -pix_fmt yuv420p \
        -movflags +faststart \
        "$mp4_output"
    mp4_size=$(get_size "$mp4_output")
    echo "✅ MP4 created: $mp4_size"
    echo ""

    # WebM (VP9): listed first in <video>, so most browsers pick it
    echo "🎥 Converting to WebM..."
    webm_output="$dir_path/${filename}.webm"
    ffmpeg -hide_banner -loglevel error -y -i "$full_path" \
        -vf "$SCALE" \
        -an \
        -c:v libvpx-vp9 -b:v 0 -crf 36 -row-mt 1 \
        -pix_fmt yuv420p \
        "$webm_output"
    webm_size=$(get_size "$webm_output")
    echo "✅ WebM created: $webm_size"
    echo ""

    # Poster: first frame, shown before playback and with reduced motion
    echo "🖼️  Extracting poster frame..."
    poster_output="$dir_path/${filename}-poster.jpg"
    ffmpeg -hide_banner -loglevel error -y -i "$full_path" \
        -vf "$SCALE" \
        -frames:v 1 -q:v 3 \
        "$poster_output"
    dims=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "$mp4_output")
    echo "✅ Poster created: $(get_size "$poster_output")"

    echo ""
    echo "📊 Summary for $filename (${dims}):"
    echo "   Original GIF: $original_size"
    echo "   MP4:          $mp4_size"
    echo "   WebM:         $webm_size"
    echo "   Use width=\"${dims%x*}\" height=\"${dims#*x}\" on the <video>."
    echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Conversion Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Replace the <img> of each GIF with a <video> block (see the header of this script)."
echo "2. Test locally with: bundle exec jekyll serve"
echo "3. After verifying the videos, delete the original GIFs (they never need to ship)."
echo ""
