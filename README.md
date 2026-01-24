# 🎮 ENDLESS67 - Vertical Runner

Endless 67 is a high-octane vertical platformer where you must outrun rising lava, navigate treacherous mazes, and equip stylish skins.

[![Play Now](https://img.shields.io/badge/PLAY_NOW-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://endless67.netlify.app/)
[![Version](https://img.shields.io/github/v/release/Frank004/Endless67?style=for-the-badge&color=ffd700)](https://github.com/Frank004/Endless67/releases)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Frank004/Endless67/main.yml?style=for-the-badge)](https://github.com/Frank004/Endless67/actions)

## 🚀 Features

### 🕹️ Core Gameplay
- **Infinite Verticality**: Procedurally generated levels that get harder as you climb.
- **Dynamic Difficulty**: Mechanics evolve every 1000m (platforms, enemies, speeds).
- **Slot System**: Intelligent variation between platforming sections, mazes, and safe zones.
- **Lava Pursuit**: A relentless threat that accelerates based on your performance.

### 🏃 Movement Mastery
- **Parkour Physics**: Double jumps, wall slides, and wall jumps with stamina management.
- **Precision Control**: Tuned for both touch (mobile) and keyboard/gamepad (desktop).

### 🛒 The Vault (Store)
- **Currency System**: Collect coins during runs to unlock content.
- **Skin System**: Purchase and equip unique character skins (Red Jersey, Cyber Punk, etc.).
- **Inventory**: Persistent ownership and equipping logic.

### 🎨 Visual & Audio
- **Retro Aesthetic**: Pixel art style with modern lighting and particle effects.
- **Dynamic Environments**: Backgrounds and props change as you ascend.
- **Immersive Sound**: Context-aware audio for jumps, items, and ambiance.

## 🛠️ Technology Stack

- **Engine**: [Phaser 3.87](https://phaser.io/) (WebGL)
- **Language**: JavaScript (ES6+ Modules)
- **Build Tool**: Vite
- **Physics**: Arcade Physics (Customized)
- **Storage**: LocalStorage with Service Layers
- **Deployment**: Netlify / GitHub Pages

## 📂 Project Structure

```
src/
├── Core/              # Game loop, event bus, state management
├── Scenes/            # Phaser scenes (MainMenu, Game, Store, etc.)
├── Entities/          # Game objects (Player, Enemies, Platforms)
├── Systems/           # Logic managers (Input, Audio, Collisions)
│   ├── Level/         # Procedural generation (SlotGenerator, Spawners)
│   ├── Gameplay/      # Rules (Score, Economy, Profiles)
│   └── Visuals/       # Particles, Shaders, Decor
├── UI/                # Interface components (HUD, Menus, Store Cards)
├── Config/            # Constants, Assets, Tuning
└── Utils/             # Math helpers, formatters
```

## 🎮 Controls

| Action | Desktop (Keyboard) | Desktop (Gamepad) | Mobile (Touch) |
| :--- | :--- | :--- | :--- |
| **Move** | Arrow Keys / WASD | D-Pad / Left Stick | Drag Left Side |
| **Jump** | Space / Up | A / Cross | Tap Right Side |
| **Pause** | Esc / P | Start / Menu | Tap Pause Icon |

## 📦 Installation & Dev

1. **Clone the repository**
   ```bash
   git clone https://github.com/Frank004/Endless67.git
   cd Endless67
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run local server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to play.

4. **Build for production**
   ```bash
   npm run build
   ```

## 🧪 Testing

We use Jest for unit testing core logic (Systems, Generators).

```bash
npm run test
```

## 📝 Latest Release

**v0.0.50** - unified Coin Counter & Cleanup Refactor
- Unified UI components for currency.
- Optimized scene cleanup efficiency.
- Store logic improvements.

[View All Releases](https://github.com/Frank004/Endless67/releases)

---

Developed by **Frank004** | Private Project | All Rights Reserved
