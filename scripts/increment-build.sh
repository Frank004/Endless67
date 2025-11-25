#!/bin/bash

# Script para incrementar el build number automáticamente
# Uso: ./scripts/increment-build.sh

BUILD_JSON="build.json"

if [ ! -f "$BUILD_JSON" ]; then
    echo "❌ Error: $BUILD_JSON no encontrado"
    exit 1
fi

# Leer build number actual
CURRENT_BUILD=$(grep -o '"build": [0-9]*' "$BUILD_JSON" | grep -o '[0-9]*')

if [ -z "$CURRENT_BUILD" ]; then
    CURRENT_BUILD=0
fi

# Incrementar
NEW_BUILD=$((CURRENT_BUILD + 1))

# Actualizar build.json (usando sed para compatibilidad)
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/\"build\": $CURRENT_BUILD/\"build\": $NEW_BUILD/" "$BUILD_JSON"
else
    # Linux
    sed -i "s/\"build\": $CURRENT_BUILD/\"build\": $NEW_BUILD/" "$BUILD_JSON"
fi

echo "✅ Build number incrementado a: $NEW_BUILD"

