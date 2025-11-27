# 🚀 Ship Interior Panel Generation Guide

Generate modular ship interior panels that can be assembled into 3D ship models!

## 🎯 Concept

**Goal:** Generate flat panel images that can be extruded into 3D shapes and assembled like building blocks.

**Pipeline:**
```
AI Image (Panel Texture) → Apply to 3D Geometry → Assemble into Ship Interior
```

## 📐 Panel Types

### 1. **Wall Panels** (Vertical Surfaces)
- Flat rectangular panels
- Can have details (vents, panels, lights)
- Tileable edges for seamless connection

### 2. **Floor Panels** (Horizontal Surfaces)
- Grid patterns, grating, or solid
- Non-slip textures
- Modular tiles

### 3. **Ceiling Panels** (Overhead Surfaces)
- Lighting fixtures
- Ventilation systems
- Cable conduits

### 4. **Corner Panels** (Connectors)
- 90-degree angles
- Curved transitions
- Structural supports

### 5. **Door Frames** (Openings)
- Rectangular or circular
- Reinforced edges
- Seal mechanisms

## 🎨 Grok/GPT Prompts for Panel Generation

### Wall Panel - Basic

```
Futuristic spacecraft interior wall panel, flat rectangular surface, metallic gray with subtle panel lines, rivets and bolts along edges, sci-fi industrial design, technical details, worn metal texture, isolated on black background, straight-on front view, 2048x2048, seamless tileable edges, professional 3D game asset quality, photorealistic
```

**Settings:**
- Style: Photorealistic, Sci-Fi
- Aspect Ratio: 1:1 (square)
- Quality: Maximum
- View: Straight-on (orthographic-style)

---

### Wall Panel - With Details

```
Futuristic spacecraft interior wall panel with integrated components, metallic surface with recessed panels, small ventilation grilles, warning stripes (yellow and black), access hatches, riveted construction, industrial sci-fi aesthetic, battle-worn metal, isolated on black background, front orthographic view, 2048x2048, tileable edges, game asset quality
```

---

### Floor Panel - Grating

```
Futuristic spacecraft floor grating panel, industrial metal grid pattern, hexagonal or diamond perforations, anti-slip surface texture, dark gray metal, structural supports visible underneath, sci-fi industrial design, top-down orthographic view, isolated on black background, 2048x2048, seamless tileable, professional game asset
```

---

### Floor Panel - Solid

```
Futuristic spacecraft solid floor panel, reinforced metal plating, subtle panel lines and seams, non-slip texture pattern, dark metallic surface, corner bolts, industrial sci-fi design, top-down orthographic view, isolated on black background, 2048x2048, tileable edges, photorealistic game asset
```

---

### Ceiling Panel - With Lights

```
Futuristic spacecraft ceiling panel with integrated lighting, recessed light strips (blue or white glow), ventilation grilles, cable conduits, metallic surface with technical details, industrial sci-fi aesthetic, bottom-up orthographic view, isolated on black background, 2048x2048, tileable edges, glowing elements, game asset quality
```

---

### Corner Panel - 90 Degree

```
Futuristic spacecraft interior corner panel, 90-degree angle connector, metallic construction with reinforced edges, rivets and bolts, structural support beams, industrial sci-fi design, shows both wall surfaces meeting at right angle, isolated on black background, isometric view showing corner clearly, 2048x2048, professional game asset
```

---

### Door Frame Panel

```
Futuristic spacecraft door frame panel, rectangular opening with reinforced metal edges, hydraulic seal mechanisms, warning stripes, access control panel mount points, industrial sci-fi design, metallic construction with technical details, front orthographic view, isolated on black background, 2048x2048, game asset quality
```

---

### Control Panel Section

```
Futuristic spacecraft wall-mounted control panel section, integrated displays and buttons, holographic interface elements, metallic housing with technical details, glowing indicators (green, blue, amber), industrial sci-fi design, front orthographic view, isolated on black background, 2048x2048, professional game asset
```

---

## 📋 Critical Requirements

### For Pipeline Compatibility:

1. **Orthographic View**
   - Straight-on, no perspective distortion
   - Flat appearance (not 3D rendered)
   - Like looking at a blueprint

2. **Isolated Background**
   - Black or transparent background
   - No shadows or ambient occlusion
   - Clean edges

3. **Tileable Edges** (for repeating panels)
   - Seamless left-right edges
   - Seamless top-bottom edges
   - Pattern continues across boundaries

4. **High Resolution**
   - Minimum 2048x2048
   - PNG format (lossless)
   - Clear details

5. **Consistent Lighting**
   - Flat, even lighting
   - No dramatic shadows
   - Diffuse illumination

## 🔧 How to Use in Pipeline

### Step 1: Generate Panel Image
```
Use Grok/GPT with prompts above
→ Get 2048x2048 PNG image
→ Save to /public/ai-generated/panels/
```

### Step 2: Create 3D Geometry
```typescript
// Wall panel example
<mesh position={[x, y, z]}>
  <boxGeometry args={[2, 3, 0.1]} /> {/* width, height, depth */}
  <meshStandardMaterial 
    map={wallPanelTexture}
    metalness={0.8}
    roughness={0.3}
  />
</mesh>
```

### Step 3: Assemble Ship Interior
```typescript
// Create room from panels
<group name="ShipRoom">
  {/* Back wall */}
  <WallPanel position={[0, 0, -2]} texture={wallPanel1} />
  
  {/* Left wall */}
  <WallPanel position={[-2, 0, 0]} rotation={[0, Math.PI/2, 0]} texture={wallPanel2} />
  
  {/* Right wall */}
  <WallPanel position={[2, 0, 0]} rotation={[0, -Math.PI/2, 0]} texture={wallPanel3} />
  
  {/* Floor */}
  <FloorPanel position={[0, -1.5, 0]} texture={floorPanel} />
  
  {/* Ceiling */}
  <CeilingPanel position={[0, 1.5, 0]} texture={ceilingPanel} />
</group>
```

## 📐 Standard Panel Dimensions

### Recommended Sizes:

**Wall Panels:**
- Small: 1m x 2m (width x height)
- Medium: 2m x 3m
- Large: 4m x 3m

**Floor/Ceiling Tiles:**
- Standard: 2m x 2m
- Large: 4m x 4m

**Corner Pieces:**
- Standard: 1m x 1m x 1m (cube corner)

**Door Frames:**
- Standard: 1m wide x 2.5m tall
- Large: 2m wide x 3m tall

## 🎨 Material Variations

### Generate Multiple Versions:

1. **Clean/New**
   ```
   ...pristine condition, factory fresh, clean metal...
   ```

2. **Worn/Used**
   ```
   ...battle-worn, scratched metal, weathered surface, rust spots...
   ```

3. **Damaged**
   ```
   ...damaged panels, dents and impacts, exposed wiring, battle damage...
   ```

4. **High-Tech**
   ```
   ...advanced technology, glowing elements, holographic displays, sleek design...
   ```

5. **Industrial**
   ```
   ...heavy industrial, reinforced construction, utilitarian design, rugged...
   ```

## 🗂️ Organization

```
public/ai-generated/panels/
├── walls/
│   ├── basic/
│   │   ├── wall-panel-basic-01.png
│   │   ├── wall-panel-basic-02.png
│   │   └── wall-panel-basic-03.png
│   ├── detailed/
│   │   ├── wall-panel-vents-01.png
│   │   ├── wall-panel-controls-01.png
│   │   └── wall-panel-access-01.png
│   └── damaged/
│       └── wall-panel-damaged-01.png
├── floors/
│   ├── grating/
│   │   ├── floor-grating-hex-01.png
│   │   └── floor-grating-diamond-01.png
│   └── solid/
│       ├── floor-solid-01.png
│       └── floor-solid-02.png
├── ceilings/
│   ├── lights/
│   │   ├── ceiling-lights-01.png
│   │   └── ceiling-lights-02.png
│   └── vents/
│       └── ceiling-vents-01.png
├── corners/
│   ├── corner-90deg-01.png
│   └── corner-reinforced-01.png
└── doors/
    ├── door-frame-standard-01.png
    └── door-frame-large-01.png
```

## 💡 Pro Tips

### For Best Results:

1. **Specify "Orthographic View"**
   - Prevents perspective distortion
   - Ensures flat, usable textures

2. **Request "Tileable Edges"**
   - Allows seamless repetition
   - Creates continuous surfaces

3. **Use "Isolated on Black Background"**
   - Easy to extract
   - Clean for texture mapping

4. **Add "Game Asset Quality"**
   - Optimizes for real-time rendering
   - Appropriate detail level

5. **Specify Material Type**
   - "Metallic", "Brushed aluminum", "Steel"
   - Helps AI understand surface properties

## 🚀 Example Workflow

### Building a Corridor:

1. **Generate Panels:**
   ```
   - 4x wall panels (2 per side)
   - 2x floor panels
   - 2x ceiling panels
   - 2x corner pieces
   - 1x door frame
   ```

2. **Create in Code:**
   ```typescript
   <group name="Corridor">
     {/* Walls */}
     {wallPanels.map((panel, i) => (
       <WallPanel key={i} position={positions[i]} texture={panel} />
     ))}
     
     {/* Floor */}
     <FloorPanel position={[0, -1.5, 0]} texture={floorPanel} />
     
     {/* Ceiling */}
     <CeilingPanel position={[0, 1.5, 0]} texture={ceilingPanel} />
     
     {/* Door */}
     <DoorFrame position={[0, 0, 5]} texture={doorFrame} />
   </group>
   ```

3. **Result:**
   - Modular corridor
   - Reusable panels
   - Easy to modify

## 🌟 Advanced Techniques

### Depth Maps for Panels:

Generate matching depth maps for panels with raised details:

```
Grayscale depth map of futuristic spacecraft wall panel, showing depth information where black represents recessed areas (panel lines, vents) and white represents raised areas (rivets, bolts, surface), monochromatic gradient, orthographic view, isolated on black background, 2048x2048, suitable for displacement mapping
```

### Normal Maps:

For enhanced detail without geometry:

```
Normal map of futuristic spacecraft wall panel, RGB channels encoding surface normal directions, purple/blue base color with variations showing surface details, technical normal map format, orthographic view, 2048x2048, game asset quality
```

## 🎯 This Approach Enables:

✅ **Modular Ship Building** - Mix and match panels
✅ **Rapid Prototyping** - Quick interior layouts
✅ **Infinite Variations** - Generate as many as needed
✅ **Consistent Style** - Unified aesthetic
✅ **Easy Modification** - Swap panels anytime
✅ **Performance Friendly** - Reuse textures
✅ **Scalable** - From small rooms to large ships

**Generate panels once, build infinite ship interiors!** 🚀
