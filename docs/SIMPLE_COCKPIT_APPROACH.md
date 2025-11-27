# 🎯 Simple Cockpit Approach - Back to Basics

## The Problem

The blueprint system is over-engineered. Looking at the screenshots:
- Cockpit is rendering but duplicated multiple times
- Geometry is positioned incorrectly
- UV mapping is confusing
- Too many layers of abstraction

## ✅ The Simple Solution

**Just use a single curved plane with the cockpit texture!**

Like the SpaceX ISS docking simulator - they use a simple approach:
1. One curved geometry that wraps around the camera
2. Cockpit texture mapped to it
3. Proper lighting
4. That's it!

## 🔨 Implementation

### Step 1: Single Curved Cockpit Plane

```typescript
export function SimpleCockpit() {
  const texture = useTexture('/cockpit-scaled-orig.png');
  
  return (
    <group>
      {/* Single curved plane wrapping around camera */}
      <mesh position={[0, 0, -1.5]} rotation={[0, 0, 0]}>
        <cylinderGeometry 
          args={[
            2.5,    // radius top
            2.5,    // radius bottom  
            3,      // height
            32,     // radial segments
            1,      // height segments
            true,   // open ended
            0,      // theta start
            Math.PI // theta length (180 degrees - front half only)
          ]} 
        />
        <meshStandardMaterial 
          map={texture}
          side={THREE.BackSide}  // Render inside
          emissive="#003300"
          emissiveIntensity={0.2}
        />
      </mesh>
      
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 0, 0]} intensity={1.0} color="#00ff88" />
    </group>
  );
}
```

### Step 2: Adjust UV Mapping

The cylinder geometry automatically wraps the texture around. We just need to:
1. Use the full cockpit image
2. Let Three.js handle the UV mapping
3. Adjust the cylinder parameters to match cockpit shape

### Step 3: Add Details Progressively

Once the base works, add:
- Individual MFD screens as separate planes
- Buttons as small 3D objects
- Control stick as 3D model
- Panel details

## Why This Works

✅ **Simple** - One geometry, one texture
✅ **Fast** - No complex UV calculations
✅ **Proven** - SpaceX simulator uses similar approach
✅ **Debuggable** - Easy to see what's wrong
✅ **Extensible** - Can add details later

## Next Steps

1. Create SimpleCockpit component
2. Test with cylinder geometry
3. Adjust parameters until it looks right
4. Add lighting
5. Add individual components on top

This is how real cockpit simulators do it - start simple, add complexity only where needed!
