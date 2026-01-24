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

# Identificar la última versión disponible (para marcar como latest)
# Esto asume que sort -V ordena correctamente semver
LATEST_VERSION=$(ls "$RELEASES_DIR"/v*.md | sort -V | tail -n 1 | xargs basename -s .md)

echo "ℹ️  Targeting $LATEST_VERSION as the latest release."

# Procesar cada archivo de release en orden de versión
# listamos, ordenamos por versión (sort -V) y procesamos
for release_file in $(ls "$RELEASES_DIR"/v*.md | sort -V); do
    if [ -f "$release_file" ]; then
        version=$(basename "$release_file" .md)
        
        # Extraer título del primer encabezado H1 (# Título)
        # Si no encuentra H1, usa la versión como fallback
        title_from_md=$(grep -m 1 "^# " "$release_file" | sed 's/^# //')
        title="${title_from_md:-$version}"
        
        echo "📦 Publishing $version..."
        echo "   Title: $title"
        
        # Crear release usando GitHub CLI
        # Identificar si es prerelease (alpha/beta/rc)
        prerelease_flag=""
        if [[ "$version" == *"alpha"* ]] || [[ "$version" == *"beta"* ]] || [[ "$version" == *"rc"* ]]; then
            prerelease_flag="--prerelease"
        fi

        # Determinar si es latest
        is_latest="false"
        if [ "$version" == "$LATEST_VERSION" ]; then
            is_latest="true"
            echo "   🏷️  Marking as LATEST"
        fi

        # Intentar crear el release
        if gh release create "$version" \
            --title "$title" \
            --notes-file "$release_file" \
            --target main \
            $prerelease_flag \
            --latest=$is_latest; then
            
            echo "✅ $version published successfully"
            # Sleep para garantizar orden cronológico en GitHub (1 segundo es suficiente)
            sleep 2
        else
            echo "⚠️  Failed to publish $version (might already exist)"
            
            # Si ya existe y es la última versión, intentar actualizar el flag latest
            if [ "$is_latest" == "true" ]; then
                echo "   🔄 Ensuring $version is marked as latest..."
                gh release edit "$version" --latest 2>/dev/null || echo "   Could not update latest flag."
            fi
        fi
        
        echo ""
    fi
done

echo "✨ All releases published!"

