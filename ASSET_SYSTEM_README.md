# 🎮 The Signal - Asset System Documentation

## 🎯 Overview

The Signal now features a comprehensive asset management system that supports real audio files, textures, and 3D models. The system is designed to gracefully handle missing assets by falling back to procedural generation while providing enhanced immersion when real assets are available.

## 📁 Asset Organization

```
assets/
├── audio/
│   ├── sfx/           # Sound effects
│   ├── music/         # Background music
│   └── ambient/       # Ambient sounds
├── textures/
│   ├── walls/         # Wall textures
│   ├── floors/        # Floor textures
│   ├── details/       # Detail textures
│   └── environment/   # Environmental textures
├── models/
│   ├── characters/    # Character models
│   ├── weapons/       # Weapon models
│   ├── environment/   # Environmental models
│   └── props/         # Prop models
└── ASSET_MANIFEST.md  # Download guide
```

## 🎵 Audio System

### AudioManager Features
- **3D Spatial Audio**: Positional sound with doppler effects
- **Sound Pooling**: Performance optimization for frequently used sounds
- **Signal Interference**: Dynamic audio effects for horror atmosphere
- **Fallback Support**: Continues working without audio files

### Supported Audio Files
- **Format**: MP3, WAV, OGG
- **Directory Structure**: Organized by type (sfx, music, ambient)
- **Automatic Loading**: Scans directories and loads available files

### Audio Categories

#### Sound Effects (`assets/audio/sfx/`)
- Combat: `gunshot.wav`, `reload.wav`, `enemy_attack.wav`
- Movement: `footstep_concrete.wav`, `footstep_metal.wav`, `footstep_snow.wav`
- Interaction: `door_open.wav`, `pickup.wav`, `keycard_use.wav`
- Horror: `heartbeat.wav`, `whispers.wav`, `static.wav`

#### Music (`assets/audio/music/`)
- `main_theme.mp3` - Menu theme
- `combat_theme.mp3` - Action music
- `signal_theme.mp3` - Mysterious atmosphere
- `facility_ambient.mp3` - Background facility sounds

#### Ambient Sounds (`assets/audio/ambient/`)
- `facility_hum.wav` - Machinery background
- `wind.wav` - Arctic wind
- `ice_cracking.wav` - Environmental effects

## 🖼️ Texture System

### TextureManager Features
- **PBR Support**: Physically-based rendering materials
- **Normal Mapping**: Enhanced surface detail
- **Automatic Fallbacks**: Procedural textures when files missing
- **Performance Optimized**: Efficient texture loading and caching

### Supported Texture Formats
- **Format**: JPG, PNG
- **Resolution**: 256x256 to 2048x2048 recommended
- **Color Space**: sRGB for diffuse, Linear for normal maps

### Texture Categories

#### Wall Textures (`assets/textures/walls/`)
- `concrete_wall.jpg` + `concrete_wall_normal.jpg`
- `metal_wall.jpg` + `metal_wall_normal.jpg`
- `rusted_metal.jpg` - Corroded surfaces
- `facility_panel.jpg` - Technical panels

#### Floor Textures (`assets/textures/floors/`)
- `concrete_floor.jpg` + `concrete_floor_normal.jpg`
- `metal_grate.jpg` - Industrial flooring
- `snow_covered.jpg` - Snow-covered surfaces
- `ice_floor.jpg` - Frozen ice

#### Detail Textures (`assets/textures/details/`)
- `blood_stains.jpg` - Horror elements
- `rust_overlay.jpg` - Wear and corrosion
- `warning_signs.jpg` - Facility signage

## 🎭 3D Model System

### ModelManager Features
- **GLTF/GLB Support**: Modern 3D model format
- **Animation Support**: Skeletal animations for characters
- **LOD System**: Level of detail for performance
- **Material Processing**: Automatic material optimization

### Supported Model Formats
- **Format**: GLTF, GLB (binary GLTF)
- **Features**: Meshes, materials, animations, skeletons
- **Optimization**: Automatic instancing and batching

### Model Categories

#### Characters (`assets/models/characters/`)
- `player.glb` - Player character
- `scientist_infected.glb` - Enemy type
- `soldier_corrupted.glb` - Enemy type
- `signal_entity.glb` - Boss/final enemy

#### Weapons (`assets/models/weapons/`)
- `pistol.glb` - Handgun model
- `rifle.glb` - Assault rifle
- `shotgun.glb` - Shotgun

#### Environment (`assets/models/environment/`)
- `door_frame.glb` - Facility doors
- `computer_terminal.glb` - Interactive computers
- `research_equipment.glb` - Lab equipment
- `security_camera.glb` - Surveillance

#### Props (`assets/models/props/`)
- `keycard.glb` - Access cards
- `battery.glb` - Power sources
- `research_log.glb` - Story items
- `medical_supplies.glb` - Health items

## 📋 Asset Manifest System

### AssetManifest Features
- **Loading Tracking**: Real-time asset loading status
- **Debug Information**: Detailed loading reports
- **Progress Monitoring**: Loading progress and statistics
- **Error Handling**: Failed asset tracking

### Usage Examples

```javascript
// Get asset loading status
const progress = assetManifest.getLoadingProgress();
console.log(`Loading: ${progress.percentage}%`);

// Get failed assets
const failed = assetManifest.getAssetsByStatus('failed');

// Export manifest for debugging
const manifestData = assetManifest.exportManifest();
```

## 🔧 Developer Tools

### Debug Console Commands

```javascript
// Access managers globally
window.audioManager()     // Audio system
window.textureManager()   // Texture system
window.modelManager()     // 3D model system
window.assetManifest()    // Asset tracking

// Get debug information
window.assetManifest().getDebugInfo()

// Check available assets
window.textureManager().getAvailableTextures()
window.audioManager().listAvailableSounds()
window.modelManager().getAvailableModels()
```

### Hot Reloading

The system supports hot reloading of assets during development:

```javascript
// Reload specific asset type
await window.textureManager().loadTextures();
await window.audioManager().loadAudioAssets();
await window.modelManager().loadModels();
```

## 📥 Asset Acquisition

### Free Asset Sources

1. **Audio**: Freesound.org, OpenGameArt.org, Zapsplat.com
2. **Textures**: Polyhaven.com, Textures.com
3. **Models**: OpenGameArt.org, Kenney.nl, Sketchfab.com

### Download Checklist

See `assets/ASSET_MANIFEST.md` for detailed download instructions and file naming conventions.

## 🔄 Fallback System

### Graceful Degradation

The system is designed to work without any external assets:

1. **Audio**: Silent operation with console feedback
2. **Textures**: Procedural generation using canvas
3. **Models**: Simple geometric placeholders

### Performance Considerations

- **Memory Management**: Efficient asset disposal
- **Loading Optimization**: Parallel loading with progress tracking
- **Format Optimization**: Compressed textures and optimized models

## 🚀 Getting Started

1. **Download Assets**: Use the manifest guide to download assets
2. **Organize Files**: Place assets in correct directories
3. **Test Loading**: Check console for loading status
4. **Debug Issues**: Use developer tools for troubleshooting

## 🎯 Best Practices

### File Naming
- Use lowercase with underscores: `concrete_wall.jpg`
- Include normal maps: `concrete_wall_normal.jpg`
- Match manifest naming exactly

### Optimization
- Compress textures for web delivery
- Use GLB format for 3D models
- Test loading performance regularly

### Quality Standards
- Maintain consistent art style
- Ensure appropriate file sizes
- Test across different devices

---

*This asset system transforms The Signal from a procedural game into a fully immersive horror experience! 🎮👻*
