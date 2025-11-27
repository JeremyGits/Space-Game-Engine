# Creating PBR Textures in GIMP for Space Game Cockpit

## Overview

To make your cockpit look realistic with proper materials, you'll need to create **PBR (Physically Based Rendering) texture maps**. Here's exactly what to do in GIMP!

---

## Required Texture Maps

For each material (metal panels, plastic, glass, etc.), you need these maps:

1. **Albedo/Base Color** - The actual color (what you see)
2. **Normal Map** - Surface detail (bumps, scratches, rivets)
3. **Roughness Map** - How shiny/matte (grayscale)
4. **Metallic Map** - What's metal vs non-metal (grayscale)
5. **AO (Ambient Occlusion)** - Shadows in crevices (grayscale)

---

## Step-by-Step GIMP Workflow

### 1. **Albedo/Base Color Map** (The Main Texture)

**What it is**: The actual color of your material

**In GIMP**:
1. Create new image: **1024x1024** or **2048x2048**
2. For **metal panels**:
   - Fill with dark gray (#2a2a2a to #3a3a3a)
   - Add subtle noise: Filters → Noise → HSV Noise (Hue: 0, Saturation: 10, Value: 15)
   - Add panel lines: Use pencil tool with 2px brush, draw panel separations
   
3. For **plastic buttons**:
   - Use solid colors (red #ff0000, green #00ff00, etc.)
   - Add slight gradient for depth
   
4. **Save as**: `cockpit_metal_albedo.png` (PNG format, sRGB color space)

---

### 2. **Normal Map** (Surface Detail)

**What it is**: Creates the illusion of 3D detail (bumps, scratches, rivets)

**In GIMP**:
1. Start with your albedo map
2. Convert to grayscale: Image → Mode → Grayscale
3. Create height map:
   - Filters → Distorts → Emboss
   - Or manually paint white (raised) and black (recessed) areas
   
4. **Generate Normal Map**:
   - Filters → Generic → Normal Map
   - Settings:
     - Filter: 3x3 or 5x5
     - Scale: 2.0-5.0 (higher = more pronounced bumps)
     - Check "Wrap"
   
5. **Add Details**:
   - Paint white lines where you want raised rivets/bolts
   - Paint black lines for panel gaps/scratches
   - Use soft brush for subtle surface variation
   
6. **Save as**: `cockpit_metal_normal.png` (PNG, Linear color space)

**Pro Tips**:
- White = raised surface
- Black = recessed surface
- Middle gray (128,128,255) = flat surface
- The blue channel should always be bright

---

### 3. **Roughness Map** (Shininess)

**What it is**: Controls how shiny or matte the surface is

**In GIMP**:
1. Create new grayscale image (1024x1024)
2. For **polished metal** (shiny):
   - Fill with light gray (#303030 to #505050)
   - Value: 0.15-0.25 roughness
   
3. For **brushed metal**:
   - Fill with medium gray (#606060 to #808080)
   - Add directional noise: Filters → Render → Clouds → Solid Noise
   - Motion blur in one direction: Filters → Blur → Motion Blur
   - Value: 0.3-0.5 roughness
   
4. For **matte plastic**:
   - Fill with light gray (#b0b0b0 to #d0d0d0)
   - Value: 0.7-0.9 roughness
   
5. **Add Variation**:
   - Use soft brush to paint darker areas (shinier spots)
   - Paint lighter areas where surface is worn (rougher)
   
6. **Save as**: `cockpit_metal_roughness.png` (PNG, Linear)

**Values**:
- Black (0) = Mirror-like, very shiny
- White (255) = Completely matte
- Gray (128) = Semi-gloss

---

### 4. **Metallic Map** (Metal vs Non-Metal)

**What it is**: Tells the engine what's metal and what isn't

**In GIMP**:
1. Create new grayscale image (1024x1024)
2. For **metal areas**:
   - Fill with white (#ffffff) = 100% metallic
   
3. For **plastic/rubber areas**:
   - Fill with black (#000000) = 0% metallic
   
4. **Paint Precisely**:
   - Use selection tools to select metal areas
   - Fill selection with white
   - Everything else should be black
   - No gray areas (metal is binary: yes or no)
   
5. **Save as**: `cockpit_metal_metallic.png` (PNG, Linear)

**Values**:
- White (255) = Metal
- Black (0) = Non-metal
- NO GRAY (it's either metal or not)

---

### 5. **AO (Ambient Occlusion) Map** (Shadows)

**What it is**: Adds shadows in crevices, corners, and where surfaces meet

**In GIMP**:
1. Start with white background (#ffffff)
2. **Add Shadows**:
   - Use soft black brush (opacity 30-50%)
   - Paint shadows in:
     - Panel gaps
     - Around rivets/bolts
     - Corners
     - Where surfaces meet
   
3. **Techniques**:
   - Duplicate your normal map
   - Invert it: Colors → Invert
   - Adjust levels to make it subtle
   - Overlay on white background
   
4. **Save as**: `cockpit_metal_ao.png` (PNG, Linear)

**Values**:
- White (255) = Fully lit
- Black (0) = Fully shadowed
- Gray = Partial shadow

---

## Quick Texture Set Creation

### For **Metal Dashboard Panels**:

1. **Albedo**: Dark gray (#2a2a2a) with subtle noise
2. **Normal**: Embossed panel lines, rivets as white dots
3. **Roughness**: Light gray (#404040) = slightly shiny
4. **Metallic**: White (#ffffff) = 100% metal
5. **AO**: White with black lines in panel gaps

### For **Plastic Buttons**:

1. **Albedo**: Solid color (red/green)
2. **Normal**: Slight dome shape (radial gradient in height)
3. **Roughness**: Medium gray (#808080) = semi-matte
4. **Metallic**: Black (#000000) = not metal
5. **AO**: White with slight shadow at edges

### For **Glass Screens**:

1. **Albedo**: Dark green (#001100) for CRT look
2. **Normal**: Mostly flat with slight texture
3. **Roughness**: Very dark (#101010) = very shiny
4. **Metallic**: White (#ffffff) = metallic glass
5. **AO**: Mostly white

---

## File Organization

Save your textures like this:

```
src/assets/textures/cockpit/
├── metal/
│   ├── cockpit_metal_albedo.png
│   ├── cockpit_metal_normal.png
│   ├── cockpit_metal_roughness.png
│   ├── cockpit_metal_metallic.png
│   └── cockpit_metal_ao.png
├── plastic/
│   ├── cockpit_plastic_albedo.png
│   ├── cockpit_plastic_normal.png
│   └── cockpit_plastic_roughness.png
├── glass/
│   ├── screen_glass_albedo.png
│   ├── screen_glass_normal.png
│   └── screen_glass_roughness.png
└── fabric/
    ├── seat_fabric_albedo.png
    ├── seat_fabric_normal.png
    └── seat_fabric_roughness.png
```

---

## GIMP Plugins to Help

### **Normal Map Plugin**:
1. Download: https://code.google.com/archive/p/gimp-normalmap/
2. Install to GIMP plugins folder
3. Access: Filters → Generic → Normal Map

### **Insane Bump** (Better Normal Maps):
1. Download: http://registry.gimp.org/node/861
2. More control over normal map generation

---

## Quick Tips

### **For Realistic Metal**:
- Add scratches: Use 1px white lines on normal map
- Add wear: Paint lighter areas on roughness map
- Add dirt: Darken albedo in corners with soft brush

### **For Worn Surfaces**:
- Roughness map: Paint lighter (rougher) on edges
- Albedo: Slightly lighter color on worn areas
- AO: More shadows in worn crevices

### **For Panel Lines**:
- Normal map: Black line (recessed)
- AO map: Black line (shadow)
- Albedo: Slightly darker line

---

## Testing Your Textures

Once you've created your textures, load them in the game:

```typescript
import { textureMapLoader } from './TextureMapLoader';

const metalTextures = await textureMapLoader.loadTextureSet({
  name: 'cockpit_metal',
  basePath: '/textures/cockpit/metal',
  maps: {
    albedo: 'cockpit_metal_albedo.png',
    normal: 'cockpit_metal_normal.png',
    roughness: 'cockpit_metal_roughness.png',
    metallic: 'cockpit_metal_metallic.png',
    ao: 'cockpit_metal_ao.png'
  },
  options: {
    anisotropy: 16,
    generateMipmaps: true
  }
});

const material = textureMapLoader.createMaterialFromTextureSet(metalTextures, {
  metalness: 0.95,
  roughness: 0.15,
  clearcoat: 0.4
});
```

---

## Common Mistakes to Avoid

❌ **Don't**: Save normal maps in sRGB (use Linear)
❌ **Don't**: Use JPEG (use PNG to avoid compression artifacts)
❌ **Don't**: Make metallic maps grayscale (pure white or black only)
❌ **Don't**: Forget to add variation (perfectly uniform = fake looking)

✅ **Do**: Use 1024x1024 or 2048x2048 resolution
✅ **Do**: Add subtle noise and variation
✅ **Do**: Test in-game frequently
✅ **Do**: Keep roughness and metallic maps simple

---

## Result

With proper PBR textures, your cockpit will have:
- ✨ Realistic metallic reflections
- 🔍 Surface detail (rivets, scratches, panel lines)
- 💎 Proper material response to lighting
- 🎨 Professional AAA-game quality

The difference will be HUGE compared to flat colors!
