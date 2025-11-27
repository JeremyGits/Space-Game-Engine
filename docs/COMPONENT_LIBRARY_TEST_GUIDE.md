# 🎯 Component Library Testing Guide

Quick guide for testing your Grok-generated components in 3D!

## 🚀 What You Have

**Generated Components:**
- ✅ 2 Push Buttons (red)
- ✅ 1 Joystick (black)
- ✅ 1 Rotary Knob (silver)
- ✅ 1 Throttle Lever (red knob)
- ✅ 1 MFD Screen (optional)

## 📂 File Locations

Your components should be saved in:
```
public/ai-generated/components/
├── buttons/push/
│   ├── pushbutton-1-sq-red.png
│   └── pushbutton-2-sq-red.png
├── knobs/rotary/
│   └── RotKnob-1-Cir-Sil-ver.png
├── controls/sticks/
│   └── Joys-1-stick-black.png
└── levers/throttle/
    └── throttle-1-stick-red.png
```

## 🎮 How to Test

### Method 1: Component Test Mode

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:5173/#component-test
   ```

3. **You should see:**
   - Black background
   - Green info panel (top-left)
   - Your 5 components rendered in 3D
   - Proper lighting

### Method 2: Update Filenames

If your filenames are different, update `ComponentLibraryTest.tsx`:

```typescript
const pushButton1 = useTexture('/ai-generated/components/buttons/push/YOUR-FILENAME-1.png');
const pushButton2 = useTexture('/ai-generated/components/buttons/push/YOUR-FILENAME-2.png');
// etc...
```

## 🔧 Component Positions

Current layout:
```
Push Button 1:  [-0.5, 0, -1]   (left)
Push Button 2:  [-0.3, 0, -1]   (center-left)
Rotary Knob:    [-0.1, 0, -1]   (center)
Joystick:       [0.1, -0.2, -0.8] (center-right, lower)
Throttle:       [0.3, -0.1, -0.9] (right, lower)
MFD Screen:     [0, 0.2, -1.2]  (top-center, back)
```

## 🎨 What Each Component Shows

### Push Buttons
- **Geometry:** Cylinder (0.03 radius, 0.02 height)
- **Material:** Metallic with red emissive glow
- **Effect:** Illuminated button appearance

### Rotary Knob
- **Geometry:** Tapered cylinder
- **Material:** Highly metallic (silver)
- **Effect:** Shiny metal knob

### Joystick
- **Geometry:** Tall cylinder (0.15 height)
- **Material:** Medium metallic
- **Effect:** Control stick appearance

### Throttle Lever
- **Geometry:** Thin cylinder (0.2 height)
- **Material:** Metallic with texture
- **Effect:** Lever with red grip

### MFD Screen
- **Geometry:** Flat box (0.3 x 0.2 x 0.02)
- **Material:** Green emissive (placeholder)
- **Effect:** Glowing display screen

## 💡 Next Steps

### 1. Verify Components Load
- Check browser console for texture loading errors
- Verify file paths match your actual filenames

### 2. Adjust Appearance
Edit `ComponentLibraryTest.tsx` to tweak:
- **Position:** Change `position={[x, y, z]}`
- **Size:** Change geometry `args`
- **Material:** Adjust `metalness`, `roughness`, `emissive`

### 3. Add Interactivity
```typescript
<mesh 
  position={[-0.5, 0, -1]}
  onClick={() => console.log('Button clicked!')}
  onPointerOver={() => console.log('Hover')}
>
  {/* ... */}
</mesh>
```

### 4. Test with Real Cockpit
Once components look good:
1. Load full cockpit image
2. Position components at correct locations
3. Replace flat areas with 3D components
4. Create hybrid cockpit!

## 🐛 Troubleshooting

### Components Don't Appear
- **Check file paths** - Verify filenames match exactly
- **Check console** - Look for 404 errors
- **Check file format** - Must be PNG
- **Check location** - Must be in `/public/` folder

### Components Look Wrong
- **Too dark:** Increase `emissiveIntensity`
- **Too bright:** Decrease light intensity
- **Wrong size:** Adjust geometry `args`
- **Wrong position:** Adjust `position` array

### Textures Not Loading
```typescript
// Add error handling
const pushButton1 = useTexture(
  '/ai-generated/components/buttons/push/pushbutton-1-sq-red.png',
  (texture) => console.log('Loaded!', texture),
  (error) => console.error('Failed!', error)
);
```

## 📊 Expected Results

**Good Results:**
- ✅ All 5 components visible
- ✅ Proper lighting and shadows
- ✅ Textures applied correctly
- ✅ Realistic materials
- ✅ Good positioning

**If Something's Wrong:**
- ❌ Black/missing components → Check file paths
- ❌ Flat/no depth → Adjust geometry
- ❌ Too dark → Increase lighting
- ❌ Blurry → Check image resolution

## 🎯 Success Criteria

You'll know it's working when:
1. All components render in 3D
2. Textures are applied and visible
3. Lighting looks realistic
4. Materials have proper shine/roughness
5. Components are positioned correctly

## 🚀 What This Proves

**This test demonstrates:**
- ✅ Individual components work in 3D
- ✅ Textures load correctly
- ✅ Materials render properly
- ✅ Lighting system works
- ✅ Ready for full cockpit integration!

## 📝 Notes

- Components are rendered with Three.js
- Uses React Three Fiber for React integration
- Textures loaded with `@react-three/drei`
- Standard PBR materials for realism

**Once this works, you can:**
1. Generate more components
2. Build component library
3. Create modular cockpits
4. Mix and match for variety

**This is the foundation for the neural cockpit reconstruction system!** 🌟
