#!/usr/bin/env node

/**
 * Script para crear releases retroactivos en GitHub
 * Genera tags y notas de release basadas en los commits de cambio de versión
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Versiones encontradas en el historial
const VERSIONS = [
    { version: 'v0.0.0', commit: '0dbae0d', description: 'Feat(initial): setup proyecto Vertical Runner para GitHub Pages - Initial release' },
    { version: 'v0.0.30', commit: '22d2ecc', description: 'Feat(loader): agregar loader con versión v0.0.30 para mejor UX en carga' },
    { version: 'v0.0.31', commit: '700bde7', description: 'Debug: Add version number v0.0.31 to pause menu' },
    { version: 'v0.0.32', commit: '049c02d', description: 'Fix: Full screen pause menu, input blocking, and version bump to v0.0.32' },
    { version: 'v0.0.33', commit: '5925b97', description: 'v0.0.33' },
    { version: 'v0.0.34', commit: '59bbf2f', description: 'v0.0.34' },
    { version: 'v0.0.35', commit: '14de5d6', description: 'Chore(version): update to v0.0.35' },
    { version: 'v0.0.36', commit: '5556288', description: 'Bump version to v0.0.36' },
    { version: 'v0.0.37', commit: 'badb91e', description: 'Actualizar versión a v0.0.37 - Lava cubre completamente pantalla en game over' },
    { version: 'v0.0.38', commit: null, description: 'Version 0.0.38' },
    { version: 'v0.0.39', commit: null, description: 'Version 0.0.39' },
    { version: 'v0.0.40', commit: '01f6e0b', description: 'Chore(version): update version to v0.0.40' },
    { version: 'v0.0.41', commit: '072fa40', description: 'Chore(version): update version to v0.0.41' },
    { version: 'v0.0.42', commit: '7194386', description: 'Feat(ui): add milestone indicator system and update version to v0.0.42' },
    { version: 'v0.0.43', commit: 'ddf818a', description: 'Chore(version): update version to v0.0.43' },
];

function getCommitsBetweenVersions(fromVersion, toVersion) {
    try {
        const fromCommit = VERSIONS.find(v => v.version === fromVersion)?.commit;
        const toCommit = VERSIONS.find(v => v.version === toVersion)?.commit;
        
        if (!fromCommit || !toCommit) {
            return [];
        }

        const command = `git log ${fromCommit}..${toCommit} --oneline --no-merges`;
        const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
        return output.trim().split('\n').filter(line => line.length > 0);
    } catch (error) {
        return [];
    }
}

function generateReleaseNotes(version, previousVersion) {
    const versionData = VERSIONS.find(v => v.version === version);
    if (!versionData) return '';

    const commits = previousVersion 
        ? getCommitsBetweenVersions(previousVersion, version)
        : [];

    let notes = `# ${version}\n\n`;
    notes += `${versionData.description}\n\n`;

    if (commits.length > 0) {
        notes += `## Changes\n\n`;
        
        // Categorizar commits
        const features = [];
        const fixes = [];
        const refactors = [];
        const chores = [];
        const others = [];

        commits.forEach(commit => {
            const line = commit.substring(commit.indexOf(' ') + 1);
            if (line.toLowerCase().includes('feat') || line.toLowerCase().includes('add')) {
                features.push(`- ${line}`);
            } else if (line.toLowerCase().includes('fix')) {
                fixes.push(`- ${line}`);
            } else if (line.toLowerCase().includes('refactor')) {
                refactors.push(`- ${line}`);
            } else if (line.toLowerCase().includes('chore')) {
                chores.push(`- ${line}`);
            } else {
                others.push(`- ${line}`);
            }
        });

        if (features.length > 0) {
            notes += `### ✨ Features\n${features.join('\n')}\n\n`;
        }
        if (fixes.length > 0) {
            notes += `### 🐛 Fixes\n${fixes.join('\n')}\n\n`;
        }
        if (refactors.length > 0) {
            notes += `### 🔧 Refactors\n${refactors.join('\n')}\n\n`;
        }
        if (chores.length > 0) {
            notes += `### 📦 Chores\n${chores.join('\n')}\n\n`;
        }
        if (others.length > 0) {
            notes += `### 📝 Other Changes\n${others.join('\n')}\n\n`;
        }
    }

    return notes;
}

function createTag(version, commit) {
    try {
        // Verificar si el tag ya existe
        try {
            execSync(`git rev-parse ${version}`, { stdio: 'pipe' });
            console.log(`⚠️  Tag ${version} already exists, skipping...`);
            return false;
        } catch (e) {
            // Tag no existe, continuar
        }

        const versionData = VERSIONS.find(v => v.version === version);
        const message = versionData?.description || `Release ${version}`;
        
        const commitHash = commit || versionData?.commit || 'HEAD';
        
        console.log(`Creating tag ${version} at commit ${commitHash}...`);
        execSync(`git tag -a ${version} ${commitHash} -m "${message}"`, { stdio: 'inherit' });
        return true;
    } catch (error) {
        console.error(`Error creating tag ${version}:`, error.message);
        return false;
    }
}

function main() {
    console.log('🚀 Creating retroactive releases...\n');

    const createdTags = [];
    let previousVersion = null;

    for (const versionData of VERSIONS) {
        const { version, commit } = versionData;
        
        console.log(`\n📦 Processing ${version}...`);
        
        // Crear tag
        const tagCreated = createTag(version, commit);
        if (tagCreated) {
            createdTags.push(version);
        }

        // Generar notas de release
        const notes = generateReleaseNotes(version, previousVersion);
        
        // Guardar notas en archivo
        const notesPath = path.join(__dirname, '..', 'releases', `${version}.md`);
        const releasesDir = path.join(__dirname, '..', 'releases');
        
        if (!fs.existsSync(releasesDir)) {
            fs.mkdirSync(releasesDir, { recursive: true });
        }
        
        fs.writeFileSync(notesPath, notes, 'utf-8');
        console.log(`✅ Release notes saved to releases/${version}.md`);

        previousVersion = version;
    }

    console.log('\n✨ Done!');
    console.log('\n📋 Next steps:');
    console.log('1. Review the release notes in the releases/ directory');
    console.log('2. Push tags to remote:');
    console.log('   git push origin --tags');
    console.log('3. Create releases on GitHub using the tags and notes');
    console.log('\n💡 Tip: You can use GitHub CLI to create releases:');
    console.log('   gh release create v0.0.41 --title "v0.0.41" --notes-file releases/v0.0.41.md');
}

if (require.main === module) {
    main();
}

module.exports = { createTag, generateReleaseNotes, VERSIONS };

