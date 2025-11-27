# PBR Texture Generator Tool

## Overview

This tool automatically generates all PBR (Physically Based Rendering) texture maps from a single grayscale cockpit image.

---

## What It Does

Takes your grayscale cockpit image and generates:

1. **Albedo Map** - Base color with metal tint
2. **Normal Map** - Surface detail (bumps, rivets, panel lines)
3. **Roughness Map** - Shininess variation
4. **Metallic Map** - Metal vs non-metal mask
5. **AO Map** - Ambient occlusion (shadows in crevices)
6. **Emissive Map** - Glowing screens

---

## Requirements

```bash
pip install Pillow numpy
```

---

## Usage

1. **Place your grayscale image** in `public/cockpit-larger-greyscale.png`

2. **Run the script**:
```bash
python tools/generate_pbr_textures.py
```

3. **Output**: All textures will be saved to `public/textures/cockpit/`

---

## Generated Files

- `cockpit_albedo.png` - Base color (sRGB)
- `cockpit_normal.png` - Surface detail (Linear)
- `cockpit_roughness.png` - Shininess (Linear)
- `cockpit_metallic.png` - Metal mask (Linear)
- `cockpit_ao.png` - Shadows (Linear)
- `cockpit_emissive.png` - Glowing screens (sRGB)

---

## How It Works

### Albedo Generation
- Adds blue-gray tint for metal look
- Darkens overall for realistic metal
- Preserves original detail

### Normal Map Generation
- Uses emboss filter for height variation
- Calculates X/Y gradients (Sobel operator)
- Z component always points up (blue channel)
- Creates illusion of 3D surface detail

### Roughness Generation
- Inverts grayscale (dark = shiny, light = rough)
- Maps to 0.1-0.7 range
- Adds slight blur for variation

### Metallic Generation
- Binary threshold (white = metal, black = non-metal)
- Dark structural elements = metal
- Bright areas (screens, seats) = non-metal

### AO Generation
- Enhances shadows in dark areas
- Blurs for soft shadows
- Lightens overall (AO should be subtle)

### Emissive Generation
- Detects very bright areas (screens)
- Creates green-tinted emission map
- Only bright pixels emit light

---

## Customization

Edit the script parameters:

```python
# Normal map strength (higher = more pronounced bumps)
generate_normal(input_image, output_path, strength=3.0)

# Metallic threshold (lower = more metal)
generate_metallic(input_image, output_path, threshold=100)

# Roughness base value
generate_roughness(input_image, output_path, base_roughness=0.3)
```

---

## Tips

- **Higher resolution input** = Better quality output
- **Clean grayscale** = Better normal maps
- **High contrast** = Better detail extraction
- **Review outputs** and adjust parameters if needed

---

## Next Steps

After generating textures:

1. Review the generated files
2. Load in game using `TextureMapLoader`
3. See realistic PBR materials!

```typescript
const textureSet = await textureMapLoader.loadTextureSet({
  name: 'cockpit',
  basePath: '/textures/cockpit',
  maps: {
    albedo: 'cockpit_albedo.png',
    normal: 'cockpit_normal.png',
    roughness: 'cockpit_roughness.png',
    metallic: 'cockpit_metallic.png',
    ao: 'cockpit_ao.png',
    emissive: 'cockpit_emissive.png'
  }
});
```

---

## Troubleshooting

**Error: PIL not found**
```bash
pip install Pillow
```

**Error: numpy not found**
```bash
pip install numpy
```

**Error: Input file not found**
- Make sure `cockpit-larger-greyscale.png` is in `public/` folder
- Check filename spelling

**Output looks wrong**
- Adjust script parameters (strength, threshold, etc.)
- Re-run script
- Compare outputs

---

## Result

With generated PBR textures, your cockpit will have:
- ✨ Realistic metallic reflections
- 🔍 Surface detail (rivets, scratches, panel lines)
- 💎 Proper material response to lighting
- 🎨 AAA-game quality visuals

The difference will be **MASSIVE**! 🚀
