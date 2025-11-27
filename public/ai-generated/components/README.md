# 🎯 Individual Component Library

Reusable 3D components for spacecraft cockpits and interfaces.

## 📁 Structure

```
components/
├── buttons/          # All button types
│   ├── toggle/       # Toggle buttons (on/off states)
│   ├── push/         # Push buttons (momentary)
│   └── emergency/    # Emergency buttons
├── knobs/            # Rotary controls
│   ├── rotary/       # Standard rotary knobs
│   └── grip/         # Textured grip knobs
├── levers/           # Lever controls
│   ├── throttle/     # Throttle levers
│   └── gear/         # Gear shift levers
├── switches/         # Switch controls
│   ├── flip/         # Flip switches
│   ├── rocker/       # Rocker switches
│   └── safety/       # Safety cover switches
├── screens/          # Display screens
│   ├── mfd/          # Multi-Function Displays
│   ├── gauges/       # Analog gauges
│   └── readouts/     # Digital readouts
├── controls/         # Advanced controls
│   ├── sliders/      # Slider controls
│   ├── sticks/       # Flight sticks
│   └── keypads/      # Numeric keypads
├── panels/           # Panel housings
│   ├── housings/     # Component housings
│   └── vents/        # Ventilation grills
└── indicators/       # Status lights
    ├── warning/      # Warning lights
    ├── status/       # Status indicators
    └── multi/        # Multi-color indicators
```

## 📝 Naming Convention

```
[color]-[view]-[state].[ext]

Examples:
red-top.png
red-side.png
silver-steel-front.png
green-on.png
red-off.png
```

## 🎨 Generation Guidelines

### For Each Component:

1. **Isolated** - Black or transparent background
2. **High Resolution** - 1024x1024 minimum
3. **Multiple Views** - Top, front, side as needed
4. **Multiple States** - ON/OFF, up/down, etc.
5. **Consistent Style** - Match across all components
6. **Realistic Materials** - Metal, plastic, glass, rubber

## 🚀 Usage

These components will be:
1. Loaded as textures
2. Applied to 3D geometry
3. Positioned in cockpit
4. Made interactive
5. Reused across multiple cockpits

## 💡 Benefits

✅ **Reusable** - Use same button in multiple cockpits
✅ **High Quality** - Each component gets full attention
✅ **Modular** - Mix and match
✅ **Scalable** - Build library over time
✅ **Efficient** - Generate once, use forever

## 📚 Documentation

See `/docs/INDIVIDUAL_COMPONENT_PROMPTS.md` for detailed Grok prompts!
