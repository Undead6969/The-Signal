# THE SIGNAL - Psychological Horror FPS

![The Signal](https://img.shields.io/badge/Status-In%20Development-orange)
![Three.js](https://img.shields.io/badge/Three.js-r158+-blue)
![WebGL](https://img.shields.io/badge/WebGL-2.0-green)
![Game](https://img.shields.io/badge/Genre-Horror-red)

A psychological horror first-person shooter set in an abandoned Arctic research facility. Experience the terror of "The Signal" - an ancient frequency that doesn't just transmit data, but thoughts, emotions, and madness.

## 🎮 Game Overview

### Core Concept
You are a rescue soldier deployed to investigate a distress signal from Blackstar Research Facility. The mission seems simple: find survivors and extract intel. But as you arrive, you realize you're not alone... and something has gone terribly wrong.

### Key Features
- **Psychological Horror**: Experience hallucinations, distorted reality, and mounting madness
- **Sound-Based AI**: Enemies detect you through sound - sneak or fight strategically
- **Dynamic Lighting**: Flickering lights, limited flashlight battery, and atmospheric shadows
- **Multiple Endings**: Your choices determine the fate of humanity
- **Interactive Story**: Discover research logs, audio recordings, and environmental storytelling
- **Web-Based**: Runs directly in your browser with no installation required

## 🚀 Quick Start

### Prerequisites
- Modern web browser with WebGL support (Chrome 88+, Firefox 85+, Safari 14+)
- HTTPS connection (required for Web Audio API)
- At least 4GB RAM recommended

### Installation & Running

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/the-signal.git
   cd the-signal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `https://localhost:3000` (HTTPS required)
   - Click to start the game
   - Click again to enable pointer lock for FPS controls

## 🎯 Gameplay

### Controls

#### Keyboard & Mouse
- **WASD** - Move
- **Mouse** - Look around
- **Left Click** - Shoot
- **Right Click** - Aim (if implemented)
- **R** - Reload
- **F** - Toggle flashlight
- **E** - Interact
- **I** - Inventory
- **Shift** - Sprint
- **Ctrl** - Crouch
- **Space** - Jump
- **Escape** - Pause menu

#### Gamepad Support
- **Left Stick** - Move
- **Right Stick** - Look
- **Right Trigger** - Shoot
- **Left Trigger** - Aim
- **A Button** - Jump
- **B Button** - Reload
- **X Button** - Interact
- **Y Button** - Flashlight
- **Start** - Pause menu

### Game Mechanics

#### Resources
- **Health**: Regenerate slowly or find medkits
- **Ammo**: Limited ammunition, scavenge from enemies and environment
- **Battery**: Flashlight drains over time, find batteries to recharge

#### Madness System
- **Madness Meter**: Increases from:
  - Proximity to signal source
  - Darkness
  - Enemy encounters
  - Sprinting (exhaustion)
- **Effects**: Hallucinations, distorted audio, UI glitches, false enemies

#### Sound-Based AI
- Enemies detect:
  - Gunshots
  - Running footsteps
  - Door opening/closing
  - Player proximity
- Use stealth to avoid detection
- Create distractions with environmental objects

## 🏗️ Technical Architecture

### Core Technologies
- **Three.js** - 3D graphics and WebGL rendering
- **Web Audio API** - 3D spatial audio and sound effects
- **Cannon-es** - Physics simulation
- **Vite** - Build tool and development server
- **ES6 Modules** - Modern JavaScript architecture

### Project Structure
```
src/
├── core/           # Core game systems
│   ├── GameEngine.js    # Main game loop and state management
│   ├── Player.js        # Player character and FPS controls
│   ├── EnemyManager.js  # AI enemies and sound-based detection
│   ├── WorldManager.js  # Environment generation and level design
│   ├── StoryManager.js  # Narrative and plot progression
│   ├── PhysicsManager.js # Physics simulation
│   └── EffectManager.js  # Visual effects and post-processing
├── ui/             # User interface
│   └── UIManager.js     # Menus, HUD, and UI state
├── audio/          # Audio system
│   └── AudioManager.js  # 3D audio and sound design
├── input/          # Input handling
│   └── InputManager.js  # Keyboard, mouse, and gamepad input
└── utils/          # Utility functions
```

### Key Systems

#### GameEngine
- Manages main game loop (60 FPS target)
- Coordinates all subsystems
- Handles game state transitions
- Performance monitoring and optimization

#### Player System
- First-person camera controls
- Movement physics and collision
- Weapon system with recoil and reload
- Inventory and resource management
- Madness and health systems

#### Enemy AI
- Sound-based detection system
- Patrol, investigate, chase, and attack states
- Dynamic spawning and despawning
- Performance-optimized enemy pools

#### World Generation
- Procedural facility layout
- Environmental storytelling
- Interactive objects and collectibles
- Dynamic lighting and shadows

#### Audio System
- 3D spatial audio positioning
- Dynamic mixing based on game state
- Psychological horror sound design
- Signal interference effects

## 🎨 Art & Audio Design

### Visual Style
- **Color Palette**: Cyan (#00ffff), Magenta (#ff00ff), Yellow (#ffff00)
- **Atmosphere**: Cold, sterile facility with horror elements
- **Effects**: Glitch effects, signal interference, hallucinations

### Audio Design
- **Ambient**: Facility hum, wind, distant voices
- **SFX**: Gunshots, footsteps, enemy sounds, interactions
- **Music**: Dynamic scoring based on tension and madness levels
- **Signal Effects**: Distorted audio, interference, psychological impact

## 🛠️ Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Development Features
- **Hot Reload**: Automatic reloading on file changes
- **Debug Mode**: Press 'P' to toggle debug information
- **Wireframe Mode**: Press 'Z' to toggle wireframe rendering
- **Performance Monitoring**: Real-time FPS and memory usage

### Building for Production
```bash
npm run build
```
This creates an optimized build in the `dist/` directory that can be deployed to any static web server.

## 🎯 Game Design Philosophy

### Horror Elements
1. **Isolation**: Abandoned facility creates feeling of loneliness
2. **Unknown**: The signal represents something incomprehensible
3. **Psychological**: Madness system affects player perception
4. **Sound Design**: Audio cues build tension and fear

### Replayability
- **Multiple Endings**: Based on player choices and actions
- **Procedural Elements**: Randomized enemy placement and events
- **Alternate Playstyles**: Stealth vs combat, exploration vs speedrun
- **Secret Content**: Hidden logs, alternate endings, achievements

### Accessibility
- **Subtitles**: For all audio content
- **Colorblind Support**: Multiple color schemes
- **Control Customization**: Remappable keys and adjustable sensitivity
- **Reduced Motion**: Options for players sensitive to motion

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use ES6+ features
- Follow modular architecture
- Comment complex algorithms
- Use meaningful variable names
- Handle errors gracefully

### Testing
- Test in multiple browsers
- Test with different hardware configurations
- Test accessibility features
- Performance test with various enemy counts

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Three.js** community for the amazing WebGL framework
- **Web Audio API** for enabling 3D spatial audio
- **Game development** community for inspiration and techniques
- **Horror genre** games that paved the way for psychological horror

## 🎮 Future Plans

### Planned Features
- [ ] Multiplayer co-op mode
- [ ] VR support with WebXR
- [ ] Mobile touch controls optimization
- [ ] Mod support system
- [ ] Achievement system
- [ ] Level editor
- [ ] Procedural level generation
- [ ] Dynamic weather system
- [ ] Advanced AI behaviors

### Content Updates
- [ ] Additional weapons
- [ ] New enemy types
- [ ] Expanded facility areas
- [ ] More story content
- [ ] Alternative endings
- [ ] DLC episodes

---

**Remember**: In the silence between transmissions, something is listening. Don't let it hear you.

*Made by Undead*
