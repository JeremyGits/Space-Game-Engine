# 🚀 Panel Library Test Guide

## How to Test the Panel Viewer

### Access the Panel Test:
```
http://localhost:5173/#panel-test
```

### What You Should See:

**Individual Panel Shapes (Top Row):**
1. ⭕ **Circular Hatch** (left) - Gray cylinder with dark rim
2. 🔺 **Triangle Panel** - Gray cone shape
3. 📏 **Small Rectangle** - Vertical gray box
4. ⬛ **Square Panel** - Gray square box
5. 🔺 **Triangle Panel** - Another cone shape

**Assembled Components (Bottom Row):**
6. 🔲 **L-Shape Panel** - Two boxes forming L
7. 📐 **Wide Rectangle** - Horizontal gray panel

**Room Assembly (Background):**
8. 🏠 **Back Wall** - Large dark gray wall
9. 🔲 **Floor** - Dark horizontal plane with grid
10. 🔲 **Ceiling** - Gray overhead plane
11. 📱 **Info Panel** - Small black panel with green glow

### Camera Controls:
- **Left-click + drag** - Rotate around scene
- **Right-click + drag** - Pan camera
- **Mouse wheel** - Zoom in/out
- **Range:** 1 to 15 units from center

### Navigation:
- Click "Back to Game" - Return to main game
- Click "Component Test" - Switch to component viewer

### What to Verify:

✅ **Visual Check:**
- [ ] All panel shapes are visible
- [ ] Materials look metallic (gray/silver)
- [ ] Lighting illuminates panels properly
- [ ] Grid helper is visible on floor
- [ ] No rendering errors

✅ **Camera Controls:**
- [ ] Can rotate around panels smoothly
- [ ] Can pan to reposition view
- [ ] Can zoom in/out
- [ ] Camera damping feels smooth

✅ **Navigation:**
- [ ] Links work correctly
- [ ] Hash routing functions
- [ ] No console errors

### Expected Behavior:

**Panels should:**
- Have metallic appearance
- Show proper depth (3D, not flat)
- Be well-lit from multiple angles
- Cast subtle shadows
- Be inspectable from all angles

**Room should:**
- Show assembled interior space
- Have floor, ceiling, and back wall
- Demonstrate how panels build structures
- Provide context for panel usage

### Troubleshooting:

**If panels don't appear:**
- Check browser console for errors
- Verify dev server is running
- Refresh page

**If controls don't work:**
- Ensure OrbitControls loaded
- Check for JavaScript errors
- Try different browser

**If materials look wrong:**
- Verify Three.js loaded correctly
- Check lighting setup
- Inspect material properties

### Next Steps After Testing:

1. **Generate Real Panels:**
   - Use prompts from `BASIC_PANEL_PROMPTS.md`
   - Generate with Grok/GPT
   - Save to `/public/ai-generated/panels/`

2. **Update Component:**
   - Load textures in `PanelLibraryTest.tsx`
   - Apply to geometry
   - Test with real images

3. **Build Ship Interiors:**
   - Combine panels into rooms
   - Create corridors
   - Assemble complete ship

### Success Criteria:

✅ Panel test loads without errors
✅ All shapes render correctly
✅ Camera controls work smoothly
✅ Navigation links function
✅ Materials look appropriate
✅ Lighting is adequate
✅ Performance is smooth

**Ready to build modular ship interiors!** 🚀
