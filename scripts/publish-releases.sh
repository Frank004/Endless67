#!/bin/bash

# Script para publicar releases en GitHub usando GitHub CLI
# Requiere: gh CLI instalado (https://cli.github.com/)

set -e

RELEASES_DIR="releases"

if [ ! -d "$RELEASES_DIR" ]; then
    echo "❌ Releases directory not found. Run create-releases.js first."
    exit 1
fi

# Verificar si gh CLI está instalado
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI."
    echo "Run: gh auth login"
    exit 1
fi

echo "🚀 Publishing releases to GitHub..."
echo ""

# Procesar cada archivo de release
for release_file in "$RELEASES_DIR"/v*.md; do
    if [ -f "$release_file" ]; then
        version=$(basename "$release_file" .md)
        title="$version"
        
        echo "📦 Publishing $version..."
        
        # Crear release usando GitHub CLI
        gh release create "$version" \
            --title "$title" \
            --notes-file "$release_file" \
            --target main \
            --latest=false || {
            echo "⚠️  Release $version might already exist, skipping..."
        }
        
        echo "✅ $version published"
        echo ""
    fi
done

echo "✨ All releases published!"

