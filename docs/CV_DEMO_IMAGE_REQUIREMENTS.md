# 🔬 CV Demo - Image Requirements Guide

## 📋 Perfect Test Image Format

For the letter detection demo to work optimally, your image should have:

### ✅ IDEAL FORMAT:

**Image Type:** PNG or JPG
**Background:** Pure white (#FFFFFF) or pure black (#000000)
**Letters:** Opposite color (black letters on white, or white letters on black)
**Contrast:** High contrast between letters and background
**Size:** Any size (will auto-scale)
**Resolution:** 500x500 to 2000x2000 pixels recommended

### 📸 EXAMPLE SPECIFICATIONS:

**Option 1: Black Letters on White**
```
Background: RGB(255, 255, 255) - Pure white
Letters: RGB(0, 0, 0) - Pure black
Format: PNG or JPG
Example: Standard printed alphabet
```

**Option 2: White Letters on Black**
```
Background: RGB(0, 0, 0) - Pure black  
Letters: RGB(255, 255, 255) - Pure white
Format: PNG
Example: Chalkboard style
```

### 🎯 WHAT WORKS BEST:

1. **Clear Separation** - No gradients or shadows
2. **Solid Colors** - No transparency or anti-aliasing
3. **Good Spacing** - Letters not touching each other
4. **Clean Edges** - Sharp, well-defined letter boundaries

### ❌ WHAT DOESN'T WORK WELL:

- ❌ Transparent backgrounds (PNG alpha channel)
- ❌ Gradients or shadows
- ❌ Low contrast (gray on light gray)
- ❌ Overlapping letters
- ❌ Textured backgrounds
- ❌ Noisy/grainy images

### 🛠️ HOW TO CREATE ONE:

**Using Any Image Editor:**

1. Create new image (e.g., 1000x1000px)
2. Fill background with pure white
3. Add black text/letters using any font
4. Save as PNG or JPG
5. Place in `public/alphabet.jpg`

**Quick Online Option:**
- Use any text-to-image tool
- Type the alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
- Set background to white, text to black
- Download and save to public folder

### 🔧 CURRENT DEMO SETTINGS:

The demo uses these OpenCV settings:
```typescript
// Threshold: 127 (mid-point)
// Mode: BINARY_INV (inverts for black letters on white)
// Contour mode: EXTERNAL (outer contours only)
// Min area: 100 pixels (filters noise)
```

### 💡 TROUBLESHOOTING:

**If you see 0 letters detected:**
- Check if image has transparent background (won't work)
- Verify high contrast between letters and background
- Ensure letters are solid color, not gradient
- Try inverting the image colors

**If you see "table index out of bounds":**
- This is an OpenCV internal error with certain image formats
- Try converting to standard RGB JPG (no alpha channel)
- Ensure image is not corrupted

### 🚀 ALTERNATIVE: USE EXISTING IMAGES

If you don't have an alphabet image, the demo can work with ANY high-contrast image:

**Cockpit Components:**
- Buttons, panels, screens
- Will detect component outlines
- Shows bounding boxes

**Simple Shapes:**
- Circles, rectangles, triangles
- Good for testing shape classification

**Text Documents:**
- Scanned documents
- Printed text
- Will detect text blocks

### 📝 QUICK FIX:

The easiest solution is to create a simple test image:

1. Open Paint/Photoshop/GIMP
2. White background
3. Type "ABCDEFGHIJKLMNOPQRSTUVWXYZ" in black
4. Save as `alphabet.jpg`
5. Copy to `public/` folder
6. Refresh the demo

**The CV system is fully functional - it just needs a properly formatted test image!** 🎯✨
