/**
 * Skeleton System
 * Manages bone hierarchy for skeletal animation
 */

import { Vector3 } from '../../../utils/math/Vector3';
import { Quaternion } from '../../../utils/math/Quaternion';
import { Bone } from '../../../types/animation/AnimationTypes';
import * as THREE from 'three';

export class SkeletonSystem {
  private bones: Map<string, Bone> = new Map();
  private boneArray: Bone[] = [];
  private rootBoneId: string | null = null;
  
  constructor(
    public id: string,
    public name: string
  ) {}
  
  /**
   * Add bone to skeleton
   */
  addBone(bone: Bone): void {
    this.bones.set(bone.id, bone);
    this.boneArray.push(bone);
    
    if (bone.parentId === null) {
      this.rootBoneId = bone.id;
    }
  }
  
  /**
   * Get bone by ID
   */
  getBone(id: string): Bone | undefined {
    return this.bones.get(id);
  }
  
  /**
   * Get all bones
   */
  getAllBones(): Bone[] {
    return this.boneArray;
  }
  
  /**
   * Get root bone
   */
  getRootBone(): Bone | undefined {
    return this.rootBoneId ? this.bones.get(this.rootBoneId) : undefined;
  }
  
  /**
   * Update bone matrices (forward kinematics)
   */
  updateMatrices(): void {
    // Update in hierarchical order (parents before children)
    const updateBone = (bone: Bone) => {
      // Calculate local matrix from position, rotation, scale
      bone.localMatrix = new THREE.Matrix4();
      bone.localMatrix.compose(
        new THREE.Vector3(bone.position.x, bone.position.y, bone.position.z),
        new THREE.Quaternion(bone.rotation.x, bone.rotation.y, bone.rotation.z, bone.rotation.w),
        new THREE.Vector3(bone.scale.x, bone.scale.y, bone.scale.z)
      );
      
      // Calculate world matrix
      if (bone.parentId) {
        const parent = this.bones.get(bone.parentId);
        if (parent) {
          bone.worldMatrix = new THREE.Matrix4();
          bone.worldMatrix.multiplyMatrices(parent.worldMatrix, bone.localMatrix);
        } else {
          bone.worldMatrix = bone.localMatrix.clone();
        }
      } else {
        bone.worldMatrix = bone.localMatrix.clone();
      }
      
      // Update children
      for (const childId of bone.children) {
        const child = this.bones.get(childId);
        if (child) {
          updateBone(child);
        }
      }
    };
    
    const root = this.getRootBone();
    if (root) {
      updateBone(root);
    }
  }
  
  /**
   * Calculate inverse bind matrices (for skinning)
   */
  calculateInverseBindMatrices(): void {
    for (const bone of this.boneArray) {
      bone.inverseBindMatrix = new THREE.Matrix4();
      bone.inverseBindMatrix.copy(bone.worldMatrix).invert();
    }
  }
  
  /**
   * Reset to bind pose
   */
  resetToBindPose(): void {
    for (const bone of this.boneArray) {
      bone.position = bone.bindPosition;
      bone.rotation = bone.bindRotation;
      bone.scale = bone.bindScale;
    }
    this.updateMatrices();
  }
  
  /**
   * Get bone count
   */
  getBoneCount(): number {
    return this.boneArray.length;
  }
  
  /**
   * Find bone by name
   */
  findBoneByName(name: string): Bone | undefined {
    return this.boneArray.find(b => b.name === name);
  }
  
  /**
   * Get bone hierarchy as tree
   */
  getBoneHierarchy(): any {
    const buildTree = (bone: Bone): any => {
      return {
        id: bone.id,
        name: bone.name,
        children: bone.children.map(childId => {
          const child = this.bones.get(childId);
          return child ? buildTree(child) : null;
        }).filter(c => c !== null)
      };
    };
    
    const root = this.getRootBone();
    return root ? buildTree(root) : null;
  }
  
  /**
   * Clone skeleton
   */
  clone(): SkeletonSystem {
    const cloned = new SkeletonSystem(this.id + '_clone', this.name + '_clone');
    
    for (const bone of this.boneArray) {
      const clonedBone: Bone = {
        ...bone,
        position: { ...bone.position },
        rotation: { ...bone.rotation },
        scale: { ...bone.scale },
        bindPosition: { ...bone.bindPosition },
        bindRotation: { ...bone.bindRotation },
        bindScale: { ...bone.bindScale },
        localMatrix: bone.localMatrix.clone(),
        worldMatrix: bone.worldMatrix.clone(),
        inverseBindMatrix: bone.inverseBindMatrix.clone(),
        children: [...bone.children]
      };
      cloned.addBone(clonedBone);
    }
    
    return cloned;
  }
}

/**
 * Helper to create bone from Three.js bone
 */
export function createBoneFromThree(threeBone: THREE.Bone, parentId: string | null = null): Bone {
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  
  threeBone.matrix.decompose(position, rotation, scale);
  
  return {
    id: threeBone.uuid,
    name: threeBone.name,
    parentId,
    children: threeBone.children.map(c => c.uuid),
    
    position: new Vector3(position.x, position.y, position.z),
    rotation: new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
    scale: new Vector3(scale.x, scale.y, scale.z),
    
    bindPosition: new Vector3(position.x, position.y, position.z),
    bindRotation: new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w),
    bindScale: new Vector3(scale.x, scale.y, scale.z),
    
    localMatrix: threeBone.matrix.clone(),
    worldMatrix: threeBone.matrixWorld.clone(),
    inverseBindMatrix: new THREE.Matrix4()
  };
}

/**
 * Helper to create skeleton from Three.js skeleton
 */
export function createSkeletonFromThree(threeSkeleton: THREE.Skeleton): SkeletonSystem {
  const skeleton = new SkeletonSystem(
    'skeleton_' + Date.now(),
    'ImportedSkeleton'
  );
  
  const boneMap = new Map<THREE.Bone, string>();
  
  // First pass: create all bones
  for (const threeBone of threeSkeleton.bones) {
    boneMap.set(threeBone, threeBone.uuid);
  }
  
  // Second pass: set up hierarchy
  for (const threeBone of threeSkeleton.bones) {
    const parentBone = threeBone.parent as THREE.Bone;
    const parentId = parentBone && boneMap.has(parentBone) ? boneMap.get(parentBone)! : null;
    
    const bone = createBoneFromThree(threeBone, parentId);
    skeleton.addBone(bone);
  }
  
  skeleton.calculateInverseBindMatrices();
  
  return skeleton;
}
