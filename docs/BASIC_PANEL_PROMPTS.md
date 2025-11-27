# 🚀 Basic Ship Panel Prompts - Essential Shapes

Simple, ready-to-use prompts for basic ship interior panels in various shapes!

---

## ✅ CRITICAL REQUIREMENTS

**For ALL prompts, ensure:**
- Orthographic view (straight-on, no perspective)
- Isolated on black background
- 2048x2048 resolution
- Tileable/seamless edges
- Flat, even lighting

---

## 🔲 RECTANGULAR PANELS

### Small Rectangle (1m x 2m)

```
Futuristic spacecraft interior wall panel, small rectangular shape, metallic gray surface with subtle panel lines, rivets along edges, sci-fi industrial design, clean metal texture, isolated on black background, straight-on orthographic front view, 2048x2048, seamless tileable edges, no perspective distortion, professional game asset quality
```

**Use for:** Standard walls, basic construction

---

### Medium Rectangle (2m x 3m)

```
Futuristic spacecraft interior wall panel, medium rectangular shape, metallic gray surface with panel lines and seams, corner bolts, industrial sci-fi design, brushed metal texture, isolated on black background, straight-on orthographic front view, 2048x2048, tileable edges, no perspective, game asset quality
```

**Use for:** Large walls, main corridors

---

### Wide Rectangle (4m x 2m)

```
Futuristic spacecraft interior wall panel, wide rectangular shape, metallic gray surface with horizontal panel divisions, riveted construction, sci-fi industrial aesthetic, clean metal, isolated on black background, straight-on orthographic front view, 2048x2048, seamless edges, no perspective distortion, professional quality
```

**Use for:** Wide walls, panoramic sections

---

### Tall Rectangle (1m x 4m)

```
Futuristic spacecraft interior wall panel, tall narrow rectangular shape, metallic gray surface with vertical panel lines, reinforced edges, industrial sci-fi design, metal texture, isolated on black background, straight-on orthographic front view, 2048x2048, tileable edges, no perspective, game asset
```

**Use for:** Vertical supports, narrow walls

---

## ⬛ SQUARE PANELS

### Small Square (1m x 1m)

```
Futuristic spacecraft interior panel, square shape, metallic gray surface with centered panel detail, corner rivets, sci-fi industrial design, brushed metal texture, isolated on black background, straight-on orthographic front view, 2048x2048, seamless tileable all edges, no perspective distortion, game asset quality
```

**Use for:** Modular tiles, floor/ceiling tiles

---

### Large Square (2m x 2m)

```
Futuristic spacecraft interior panel, large square shape, metallic gray surface with cross-pattern panel lines, corner bolts, industrial sci-fi aesthetic, metal texture with subtle wear, isolated on black background, straight-on orthographic front view, 2048x2048, tileable edges, no perspective, professional quality
```

**Use for:** Large floor tiles, ceiling sections

---

## 🔺 TRIANGULAR PANELS

### Right Triangle

```
Futuristic spacecraft interior corner panel, right triangle shape, metallic gray surface with diagonal panel line, rivets along edges, sci-fi industrial design, metal texture, isolated on black background, straight-on orthographic front view, 2048x2048, clean edges, no perspective distortion, game asset quality
```

**Use for:** Corner fills, angled transitions

---

### Equilateral Triangle

```
Futuristic spacecraft interior panel, equilateral triangle shape, metallic gray surface with centered detail, edge rivets, industrial sci-fi design, brushed metal, isolated on black background, straight-on orthographic front view, 2048x2048, no perspective, game asset quality
```

**Use for:** Decorative elements, special sections

---

## ⬢ HEXAGONAL PANELS

### Regular Hexagon

```
Futuristic spacecraft interior panel, regular hexagon shape, metallic gray surface with hexagonal panel lines, rivets at each vertex, sci-fi industrial design, metal texture, isolated on black background, straight-on orthographic front view, 2048x2048, tileable honeycomb pattern, no perspective distortion, game asset quality
```

**Use for:** Honeycomb structures, modular floors

---

## ⭕ CIRCULAR PANELS

### Circle - Small

```
Futuristic spacecraft interior circular panel, round shape, metallic gray surface with concentric ring details, bolts around perimeter, sci-fi industrial design, brushed metal texture, isolated on black background, straight-on orthographic front view, 2048x2048, no perspective distortion, game asset quality
```

**Use for:** Hatches, access ports, decorative elements

---

### Circle - Large

```
Futuristic spacecraft interior large circular panel, round shape, metallic gray surface with radial panel divisions, perimeter bolts, industrial sci-fi aesthetic, metal texture, isolated on black background, straight-on orthographic front view, 2048x2048, no perspective, professional game asset
```

**Use for:** Large hatches, ceiling features

---

## 🔶 OCTAGONAL PANELS

### Regular Octagon

```
Futuristic spacecraft interior octagonal panel, eight-sided shape, metallic gray surface with octagonal panel lines, rivets at corners, sci-fi industrial design, metal texture, isolated on black background, straight-on orthographic front view, 2048x2048, no perspective distortion, game asset quality
```

**Use for:** Transition pieces, special features

---

## 📐 L-SHAPED PANELS

### L-Shape Corner

```
Futuristic spacecraft interior L-shaped corner panel, 90-degree angle, metallic gray surface with panel lines following the L-shape, rivets along edges, industrial sci-fi design, metal texture, isolated on black background, straight-on orthographic front view, 2048x2048, no perspective distortion, game asset quality
```

**Use for:** Corner connectors, room transitions

---

## 🔷 TRAPEZOID PANELS

### Trapezoid - Horizontal

```
Futuristic spacecraft interior trapezoid panel, horizontal orientation with wider bottom edge, metallic gray surface with angled panel lines, edge rivets, sci-fi industrial design, metal texture, isolated on black background, straight-on orthographic front view, 2048x2048, no perspective distortion, game asset quality
```

**Use for:** Angled walls, tapered sections

---

## 💠 DIAMOND/RHOMBUS PANELS

### Diamond Shape

```
Futuristic spacecraft interior diamond-shaped panel, rhombus orientation, metallic gray surface with diagonal panel lines, corner rivets, industrial sci-fi design, brushed metal texture, isolated on black background, straight-on orthographic front view, 2048x2048, no perspective distortion, game asset quality
```

**Use for:** Decorative elements, floor patterns

---

## 🎯 QUICK START KIT

**Generate these 5 first:**

1. **Medium Rectangle** - Most versatile
2. **Large Square** - Floor/ceiling tiles
3. **Small Circle** - Hatches and ports
4. **Right Triangle** - Corner fills
5. **L-Shape** - Corner connectors

**Total: 5 basic shapes to build any ship interior!**

---

## 🔧 HOW TO USE

### In Code:

```typescript
// Rectangle wall panel
<mesh position={[0, 0, 0]}>
  <boxGeometry args={[2, 3, 0.1]} /> {/* width, height, depth */}
  <meshStandardMaterial map={panelTexture} metalness={0.8} roughness={0.3} />
</mesh>

// Square floor tile
<mesh position={[0, -1.5, 0]} rotation={[-Math.PI/2, 0, 0]}>
  <planeGeometry args={[2, 2]} />
  <meshStandardMaterial map={floorTexture} metalness={0.7} roughness={0.4} />
</mesh>

// Circular hatch
<mesh position={[0, 0, -2]}>
  <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
  <meshStandardMaterial map={hatchTexture} metalness={0.9} roughness={0.2} />
</mesh>
```

---

## 📦 ASSEMBLY EXAMPLE

### Build a Simple Room:

```typescript
<group name="ShipRoom">
  {/* Back wall - Rectangle */}
  <mesh position={[0, 0, -4]}>
    <boxGeometry args={[8, 6, 0.1]} />
    <meshStandardMaterial map={wallPanel} />
  </mesh>
  
  {/* Floor - 4 Square tiles */}
  {[0, 1, 2, 3].map(i => (
    <mesh key={i} position={[i*2-3, -3, -2]} rotation={[-Math.PI/2, 0, 0]}>
      <planeGeometry args={[2, 2]} />
      <meshStandardMaterial map={floorTile} />
    </mesh>
  ))}
  
  {/* Ceiling - Rectangle */}
  <mesh position={[0, 3, -2]} rotation={[-Math.PI/2, 0, 0]}>
    <planeGeometry args={[8, 4]} />
    <meshStandardMaterial map={ceilingPanel} />
  </mesh>
  
  {/* Circular hatch on floor */}
  <mesh position={[0, -2.95, -2]} rotation={[-Math.PI/2, 0, 0]}>
    <cylinderGeometry args={[0.5, 0.5, 0.05, 32]} />
    <meshStandardMaterial map={hatchPanel} />
  </mesh>
</group>
```

---

## 🎨 VARIATIONS

### Add to any prompt for variety:

**Surface Finish:**
- `brushed aluminum finish`
- `polished steel surface`
- `matte gray metal`
- `carbon fiber texture`

**Details:**
- `with warning stripes (yellow and black)`
- `with access panel markings`
- `with technical stencils and labels`
- `with subtle wear and scratches`

**Style:**
- `clean and pristine`
- `industrial and utilitarian`
- `high-tech and sleek`
- `military and rugged`

---

## ✅ CHECKLIST

Before using generated panels:

- [ ] Orthographic view (no perspective)
- [ ] Black background
- [ ] 2048x2048 resolution
- [ ] Edges are seamless/tileable
- [ ] Lighting is flat and even
- [ ] PNG format
- [ ] Saved to correct folder

---

## 🚀 WORKFLOW

1. **Copy prompt** from above
2. **Paste into Grok/GPT**
3. **Generate** image
4. **Verify** orthographic view and tileable edges
5. **Save** to `/public/ai-generated/panels/`
6. **Use** in 3D geometry
7. **Assemble** into ship interiors

---

## 💡 PRO TIP

**Start Simple:**
- Generate 3-5 basic shapes first
- Test in 3D viewer
- Build a simple room
- Then expand with more variations

**Your basic kit:**
- 2x Rectangle panels (different sizes)
- 1x Square panel
- 1x Circle panel
- 1x Triangle panel

**= Enough to build complete ship interiors!** 🌟
