#!/bin/bash

# Script para publicar releases en GitHub usando la API de GitHub
# Requiere: curl y un token de GitHub (GITHUB_TOKEN)

set -e

RELEASES_DIR="releases"
REPO="Frank004/Endless67"

# Verificar si GITHUB_TOKEN está configurado
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ GITHUB_TOKEN environment variable is not set."
    echo ""
    echo "To create a GitHub token:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Select scope: 'repo' (full control of private repositories)"
    echo "4. Copy the token and run:"
    echo "   export GITHUB_TOKEN=your_token_here"
    echo "   ./scripts/publish-releases-api.sh"
    exit 1
fi

echo "🚀 Publishing releases to GitHub using API..."
echo ""

# Procesar cada archivo de release en orden
for release_file in "$RELEASES_DIR"/v0.0.*.md; do
    if [ -f "$release_file" ]; then
        version=$(basename "$release_file" .md)
        title="$version"
        
        # Leer el contenido del archivo
        notes=$(cat "$release_file")
        
        # Escapar comillas y saltos de línea para JSON
        notes_json=$(echo "$notes" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')
        
        echo "📦 Publishing $version..."
        
        # Crear release usando GitHub API
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/$REPO/releases" \
            -d "{
                \"tag_name\": \"$version\",
                \"name\": \"$title\",
                \"body\": \"$notes_json\",
                \"draft\": false,
                \"prerelease\": false
            }")
        
        http_code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')
        
        if [ "$http_code" = "201" ]; then
            echo "✅ $version published successfully"
        elif echo "$body" | grep -q "already exists"; then
            echo "⚠️  Release $version already exists, skipping..."
        else
            echo "❌ Error publishing $version (HTTP $http_code)"
            echo "$body" | head -5
        fi
        echo ""
    fi
done

echo "✨ Done publishing releases!"

