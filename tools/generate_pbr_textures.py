#!/usr/bin/env python3
"""
PBR Texture Generator
Automatically generates PBR texture maps from a grayscale cockpit image
"""

import os
import sys
from PIL import Image, ImageFilter, ImageEnhance, ImageOps
import numpy as np

def generate_albedo(input_image, output_path):
    """
    Generate Albedo (Base Color) map
    Adds color tint to grayscale
    """
    print("Generating Albedo map...")
    
    # Convert to RGB if grayscale
    img = input_image.convert('RGB')
    
    # Add slight blue-gray tint for metal
    pixels = np.array(img)
    
    # Tint toward blue-gray for metal look
    pixels[:, :, 0] = (pixels[:, :, 0] * 0.9).astype(np.uint8)  # Reduce red
    pixels[:, :, 1] = (pixels[:, :, 1] * 0.95).astype(np.uint8)  # Slight reduce green
    pixels[:, :, 2] = (pixels[:, :, 2] * 1.0).astype(np.uint8)  # Keep blue
    
    # Darken overall for realistic metal
    pixels = (pixels * 0.6).astype(np.uint8)
    
    albedo = Image.fromarray(pixels)
    albedo.save(output_path)
    print(f"✓ Saved: {output_path}")
    return albedo

def generate_normal(input_image, output_path, strength=3.0):
    """
    Generate Normal map from grayscale
    Creates surface detail from height information
    """
    print("Generating Normal map...")
    
    # Convert to grayscale
    img = input_image.convert('L')
    
    # Apply emboss filter for height variation
    embossed = img.filter(ImageFilter.EMBOSS)
    
    # Enhance contrast for stronger normals
    enhancer = ImageEnhance.Contrast(embossed)
    embossed = enhancer.enhance(strength)
    
    # Convert to normal map (RGB)
    # R = X gradient, G = Y gradient, B = Z (always up)
    pixels = np.array(embossed)
    height, width = pixels.shape
    
    # Calculate gradients
    grad_x = np.zeros_like(pixels, dtype=np.float32)
    grad_y = np.zeros_like(pixels, dtype=np.float32)
    
    # Sobel operator for gradients
    grad_x[:, :-1] = pixels[:, 1:].astype(np.float32) - pixels[:, :-1].astype(np.float32)
    grad_y[:-1, :] = pixels[1:, :].astype(np.float32) - pixels[:-1, :].astype(np.float32)
    
    # Normalize and convert to 0-255 range
    grad_x = ((grad_x / 255.0) * 0.5 + 0.5) * 255
    grad_y = ((grad_y / 255.0) * 0.5 + 0.5) * 255
    
    # Z component (always pointing up)
    grad_z = np.full_like(pixels, 255, dtype=np.uint8)
    
    # Combine into RGB
    normal_map = np.stack([
        grad_x.astype(np.uint8),
        grad_y.astype(np.uint8),
        grad_z
    ], axis=2)
    
    normal = Image.fromarray(normal_map, 'RGB')
    normal.save(output_path)
    print(f"✓ Saved: {output_path}")
    return normal

def generate_roughness(input_image, output_path, base_roughness=0.3):
    """
    Generate Roughness map
    Darker areas = shinier, Lighter areas = rougher
    """
    print("Generating Roughness map...")
    
    # Convert to grayscale
    img = input_image.convert('L')
    
    # Invert (darker areas in original = shinier = darker in roughness map)
    inverted = ImageOps.invert(img)
    
    # Adjust levels for base roughness
    pixels = np.array(inverted, dtype=np.float32)
    
    # Map to roughness range (0.1 to 0.7)
    pixels = (pixels / 255.0) * 0.6 + 0.1
    pixels = (pixels * 255).astype(np.uint8)
    
    roughness = Image.fromarray(pixels, 'L')
    
    # Add slight noise for variation
    roughness = roughness.filter(ImageFilter.GaussianBlur(radius=1))
    
    roughness.save(output_path)
    print(f"✓ Saved: {output_path}")
    return roughness

def generate_metallic(input_image, output_path, threshold=100):
    """
    Generate Metallic map
    Binary: White = metal, Black = non-metal
    """
    print("Generating Metallic map...")
    
    # Convert to grayscale
    img = input_image.convert('L')
    
    # Threshold to create binary mask
    # Darker areas (panels, frames) = metal (white)
    # Lighter areas (screens, seats) = non-metal (black)
    pixels = np.array(img)
    
    # Create metallic mask
    metallic = np.where(pixels < threshold, 255, 0).astype(np.uint8)
    
    # Screens should not be metallic (they're bright in original)
    # Seats should not be metallic
    # Only dark structural elements should be metal
    
    metallic_img = Image.fromarray(metallic, 'L')
    metallic_img.save(output_path)
    print(f"✓ Saved: {output_path}")
    return metallic_img

def generate_ao(input_image, output_path):
    """
    Generate Ambient Occlusion map
    Darkens crevices and corners
    """
    print("Generating AO map...")
    
    # Convert to grayscale
    img = input_image.convert('L')
    
    # Invert (dark areas = shadows)
    inverted = ImageOps.invert(img)
    
    # Enhance shadows
    enhancer = ImageEnhance.Contrast(inverted)
    enhanced = enhancer.enhance(2.0)
    
    # Blur to soften
    ao = enhanced.filter(ImageFilter.GaussianBlur(radius=3))
    
    # Invert back (white = lit, black = shadow)
    ao = ImageOps.invert(ao)
    
    # Lighten overall (AO should be subtle)
    pixels = np.array(ao, dtype=np.float32)
    pixels = pixels * 0.5 + 127  # Lighten
    ao = Image.fromarray(pixels.astype(np.uint8), 'L')
    
    ao.save(output_path)
    print(f"✓ Saved: {output_path}")
    return ao

def generate_emissive(input_image, output_path):
    """
    Generate Emissive map for glowing screens
    """
    print("Generating Emissive map...")
    
    # Convert to grayscale
    img = input_image.convert('L')
    
    # Create mask for bright areas (screens)
    pixels = np.array(img)
    
    # Only very bright areas should emit light
    emissive = np.where(pixels > 200, 255, 0).astype(np.uint8)
    
    # Convert to RGB with green tint
    emissive_rgb = np.zeros((pixels.shape[0], pixels.shape[1], 3), dtype=np.uint8)
    emissive_rgb[:, :, 1] = emissive  # Green channel
    
    emissive_img = Image.fromarray(emissive_rgb, 'RGB')
    emissive_img.save(output_path)
    print(f"✓ Saved: {output_path}")
    return emissive_img

def main():
    # Paths
    input_path = 'public/cockpit-larger-greyscale.png'
    output_dir = 'public/textures/cockpit'
    
    # Create output directory
    os.makedirs(output_dir, exist_ok=True)
    
    print("=" * 60)
    print("PBR Texture Generator for Space Game Cockpit")
    print("=" * 60)
    print(f"\nInput: {input_path}")
    print(f"Output: {output_dir}/\n")
    
    # Check if input exists
    if not os.path.exists(input_path):
        print(f"❌ Error: Input file not found: {input_path}")
        print("Please make sure 'cockpit-larger-greyscale.png' is in the 'public' folder")
        return 1
    
    # Load input image
    try:
        input_image = Image.open(input_path)
        print(f"✓ Loaded input image: {input_image.size[0]}x{input_image.size[1]}")
    except Exception as e:
        print(f"❌ Error loading image: {e}")
        return 1
    
    print("\nGenerating PBR texture maps...\n")
    
    # Generate all maps
    try:
        generate_albedo(input_image, f'{output_dir}/cockpit_albedo.png')
        generate_normal(input_image, f'{output_dir}/cockpit_normal.png', strength=3.0)
        generate_roughness(input_image, f'{output_dir}/cockpit_roughness.png')
        generate_metallic(input_image, f'{output_dir}/cockpit_metallic.png', threshold=100)
        generate_ao(input_image, f'{output_dir}/cockpit_ao.png')
        generate_emissive(input_image, f'{output_dir}/cockpit_emissive.png')
        
        print("\n" + "=" * 60)
        print("✅ SUCCESS! All PBR textures generated!")
        print("=" * 60)
        print(f"\nTextures saved to: {output_dir}/")
        print("\nGenerated files:")
        print("  • cockpit_albedo.png    - Base color")
        print("  • cockpit_normal.png    - Surface detail")
        print("  • cockpit_roughness.png - Shininess")
        print("  • cockpit_metallic.png  - Metal mask")
        print("  • cockpit_ao.png        - Shadows")
        print("  • cockpit_emissive.png  - Glowing screens")
        
        print("\n📋 Next Steps:")
        print("1. Review the generated textures")
        print("2. Adjust if needed (re-run with different parameters)")
        print("3. Load in game using TextureMapLoader")
        print("4. See AMAZING results! 🎨")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Error generating textures: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())
