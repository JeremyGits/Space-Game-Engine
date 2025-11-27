# 🎨 AI-Generated Assets for Space Game

This directory contains all AI-generated assets for the space game, organized by category and type.

## 📁 Folder Structure

```
ai-generated/
├── cockpits/          # Spacecraft cockpit interiors
│   ├── fighter/       # Fighter cockpits
│   ├── transport/     # Transport ship cockpits
│   ├── mining/        # Mining vessel cockpits
│   └── luxury/        # Luxury yacht cockpits
├── ships/             # Spacecraft exteriors and components
│   ├── exteriors/     # Ship exterior views
│   ├── interiors/     # Ship interior spaces
│   └── components/    # Ship parts and modules
├── stations/          # Space station assets
│   ├── exteriors/     # Station exterior views
│   ├── interiors/     # Station interior spaces
│   └── modules/       # Station modules and sections
├── planets/           # Planetary assets
│   ├── surfaces/      # Planet surface textures
│   ├── atmospheres/   # Atmospheric effects
│   └── rings/         # Planetary ring systems
└── environments/      # Space environment assets
    ├── nebulae/       # Nebula backgrounds
    ├── asteroid-fields/ # Asteroid field scenes
    └── space-phenomena/ # Black holes, wormholes, etc.
```

## 🎯 Cockpit Structure

Each cockpit type follows this structure:

```
cockpits/[type]/
├── original/          # Color/texture images (for RGB extraction)
├── depth/             # Grayscale depth maps (for 3D reconstruction)
├── normal/            # Normal maps (optional, for detail)
└── reference/         # Close-up reference images (optional)
```

## 📝 Naming Convention

```
[asset-type]-[variant]-[version].[extension]

Examples:
- fighter-cockpit-v1.png
- fighter-cockpit-v1-depth.png
- transport-cockpit-heavy-v2.png
- mining-cockpit-industrial-v1.png
```

## ✅ Image Requirements

### For Cockpits:

**Original/Color Images:**
- Resolution: 2048x2048 or 2048x1536 (minimum 1024x1024)
- Format: PNG (lossless)
- Color Space: sRGB
- Perspective: First-person pilot view
- Content: Clear view of all instruments and controls

**Depth Maps:**
- Resolution: MUST match original exactly
- Format: PNG (lossless)
- Color Space: Grayscale
- Encoding: Black (0) = closest, White (255) = furthest
- Content: Same composition as original

## 🚀 Usage

1. Generate images using Grok Imagine (see `/docs/AI_IMAGE_GENERATION_GUIDE.md`)
2. Save to appropriate folder
3. Ensure original and depth maps have matching dimensions
4. Use in neural cockpit reconstruction system

## 📚 Documentation

For detailed prompts and generation instructions, see:
- `/docs/AI_IMAGE_GENERATION_GUIDE.md` - Complete generation guide
- `/docs/NEURAL_COCKPIT_RECONSTRUCTION_COMPLETE_PLAN.md` - Technical system docs
- `/docs/NEURAL_COCKPIT_IMAGE_REQUIREMENTS.md` - Image specifications

## 🌟 This is a Groundbreaking Framework!

The neural reconstruction system works with ANY image pair (original + depth), making this framework incredibly scalable for:
- Infinite cockpit variations
- Multiple ship types
- Various environments
- Custom assets

**Generate once, use forever!** 🚀
