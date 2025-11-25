#!/usr/bin/env node

/**
 * Script para incrementar el build number automáticamente
 * Actualiza build.json e index.html
 * Uso: node scripts/increment-build.js
 */

const fs = require('fs');
const path = require('path');

const buildJsonPath = path.join(__dirname, '..', 'build.json');
const indexHtmlPath = path.join(__dirname, '..', 'index.html');

try {
    // Leer build.json
    const buildData = JSON.parse(fs.readFileSync(buildJsonPath, 'utf8'));
    
    // Incrementar build number
    const oldBuild = buildData.build || 0;
    buildData.build = oldBuild + 1;
    const newBuild = buildData.build;
    
    // Escribir build.json
    fs.writeFileSync(buildJsonPath, JSON.stringify(buildData, null, 2) + '\n', 'utf8');
    
    // Actualizar index.html
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Reemplazar build numbers en cache-busters (formato ?b=123)
    indexHtml = indexHtml.replace(/\?b=\d+/g, `?b=${newBuild}`);
    
    // También actualizar formato antiguo ?v=0.0.35 si existe
    indexHtml = indexHtml.replace(/css\/style\.css\?v=[\d.]+/g, `css/style.css?b=${newBuild}`);
    indexHtml = indexHtml.replace(/src\/main\.js\?v=[\d.]+/g, `src/main.js?b=${newBuild}`);
    
    fs.writeFileSync(indexHtmlPath, indexHtml, 'utf8');
    
    console.log(`✅ Build number incrementado: ${oldBuild} → ${newBuild}`);
    console.log(`   Versión: ${buildData.version || 'N/A'}`);
    console.log(`   index.html actualizado con build number ${newBuild}`);
} catch (error) {
    console.error('❌ Error al incrementar build number:', error.message);
    process.exit(1);
}

