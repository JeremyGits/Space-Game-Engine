/**
 * Voxel System Integration Test
 * 
 * Quick tests to verify the voxel system compiles and basic functionality works.
 */

import * as THREE from 'three';
import { Voxel } from '../core/Voxel';
import { VoxelGrid } from '../core/VoxelGrid';
import { VoxelValidator } from '../conversion/validation/VoxelValidator';
import { QualityValidator } from '../conversion/validation/QualityValidator';
import { VertexBuffer } from '../meshing/geometry/VertexBuffer';
import { IndexBuffer } from '../meshing/geometry/IndexBuffer';
import { TriangleMesh } from '../meshing/geometry/TriangleMesh';

/**
 * Test 1: Create voxels
 */
export function testVoxelCreation(): boolean {
  console.log('Test 1: Voxel Creation');
  
  try {
    const voxel = new Voxel(
      new THREE.Vector3(0, 0, 0),
      { r: 1, g: 0, b: 0 },
      1.0
    );
    
    console.log('✅ Voxel created:', voxel.position);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error);
    return false;
  }
}

/**
 * Test 2: Voxel grid
 */
export function testVoxelGrid(): boolean {
  console.log('\nTest 2: Voxel Grid');
  
  try {
    const grid = new VoxelGrid(10, 10, 10);
    
    // Add some voxels
    for (let i = 0; i < 5; i++) {
      grid.setVoxel(i, i, i, {
        r: i / 5,
        g: 1 - i / 5,
        b: 0.5
      });
    }
    
    const voxels = grid.getVoxels();
    console.log(`✅ Grid created with ${voxels.length} voxels`);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error);
    return false;
  }
}

/**
 * Test 3: Validation
 */
export function testValidation(): boolean {
  console.log('\nTest 3: Validation');
  
  try {
    const voxels: Voxel[] = [];
    
    for (let i = 0; i < 10; i++) {
      voxels.push(new Voxel(
        new THREE.Vector3(i, 0, 0),
        { r: 1, g: 1, b: 1 },
        1.0
      ));
    }
    
    const validator = new VoxelValidator();
    const result = validator.validate(voxels);
    
    console.log(`✅ Validation: ${result.valid ? 'PASS' : 'FAIL'}`);
    console.log(`   Valid voxels: ${result.stats.validVoxels}/${result.stats.totalVoxels}`);
    
    return result.valid;
  } catch (error) {
    console.error('❌ Failed:', error);
    return false;
  }
}

/**
 * Test 4: Quality scoring
 */
export function testQualityScoring(): boolean {
  console.log('\nTest 4: Quality Scoring');
  
  try {
    const voxels: Voxel[] = [];
    
    // Create varied voxels
    for (let i = 0; i < 100; i++) {
      voxels.push(new Voxel(
        new THREE.Vector3(
          Math.random() * 10,
          Math.random() * 10,
          Math.random() * 10
        ),
        {
          r: Math.random(),
          g: Math.random(),
          b: Math.random()
        },
        1.0
      ));
    }
    
    const qualityValidator = new QualityValidator();
    const result = qualityValidator.validate(voxels);
    
    console.log(`✅ Quality Score: ${(result.scores.overall * 100).toFixed(1)}% (Grade: ${result.grade})`);
    console.log(`   Color Fidelity: ${(result.scores.colorFidelity * 100).toFixed(1)}%`);
    console.log(`   Distribution: ${(result.scores.distribution * 100).toFixed(1)}%`);
    
    return result.valid;
  } catch (error) {
    console.error('❌ Failed:', error);
    return false;
  }
}

/**
 * Test 5: Vertex buffer
 */
export function testVertexBuffer(): boolean {
  console.log('\nTest 5: Vertex Buffer');
  
  try {
    const buffer = new VertexBuffer({ capacity: 100 });
    
    // Add vertices
    for (let i = 0; i < 10; i++) {
      buffer.addVertex(
        new THREE.Vector3(i, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Color(1, 1, 1),
        new THREE.Vector2(0, 0)
      );
    }
    
    console.log(`✅ Vertex buffer: ${buffer.getCount()} vertices`);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error);
    return false;
  }
}

/**
 * Test 6: Index buffer
 */
export function testIndexBuffer(): boolean {
  console.log('\nTest 6: Index Buffer');
  
  try {
    const buffer = new IndexBuffer({ capacity: 300 });
    
    // Add triangles
    for (let i = 0; i < 10; i++) {
      buffer.addTriangle(i * 3, i * 3 + 1, i * 3 + 2);
    }
    
    console.log(`✅ Index buffer: ${buffer.getTriangleCount()} triangles`);
    console.log(`   Type: ${buffer.getType()}`);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error);
    return false;
  }
}

/**
 * Test 7: Triangle mesh
 */
export function testTriangleMesh(): boolean {
  console.log('\nTest 7: Triangle Mesh');
  
  try {
    const mesh = new TriangleMesh({ capacity: 100 });
    
    // Add a simple triangle
    mesh.addTriangleFromVertices(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Color(1, 0, 0)
    );
    
    const geometry = mesh.build();
    
    console.log(`✅ Triangle mesh built`);
    console.log(`   Triangles: ${mesh.getTriangleCount()}`);
    console.log(`   Vertices: ${mesh.getVertexCount()}`);
    console.log(`   Has geometry: ${geometry !== null}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
export function runAllTests(): void {
  console.log('='.repeat(50));
  console.log('VOXEL SYSTEM INTEGRATION TESTS');
  console.log('='.repeat(50));
  
  const tests = [
    testVoxelCreation,
    testVoxelGrid,
    testValidation,
    testQualityScoring,
    testVertexBuffer,
    testIndexBuffer,
    testTriangleMesh
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      if (test()) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error('Test threw exception:', error);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));
}

// Export for use in console
if (typeof window !== 'undefined') {
  (window as any).voxelTests = {
    runAll: runAllTests,
    testVoxelCreation,
    testVoxelGrid,
    testValidation,
    testQualityScoring,
    testVertexBuffer,
    testIndexBuffer,
    testTriangleMesh
  };
}
