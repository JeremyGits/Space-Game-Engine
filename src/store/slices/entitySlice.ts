/**
 * Entity Slice
 * 
 * Manages game entity state for UI and tracking purposes
 */

import { StateCreator } from 'zustand';
import { Vector3 } from '../../utils/math/Vector3';
import { EntityState } from '../../types/store/StoreTypes';

export interface EntitySlice {
  // State
  entities: Map<string, EntityState>;
  trackedEntities: Set<string>;
  
  // Actions
  addEntity: (entity: EntityState) => void;
  removeEntity: (entityId: string) => void;
  updateEntity: (entityId: string, updates: Partial<EntityState>) => void;
  
  // Position/Rotation
  updateEntityPosition: (entityId: string, position: Vector3) => void;
  updateEntityRotation: (entityId: string, rotation: { x: number; y: number; z: number }) => void;
  
  // Tracking
  trackEntity: (entityId: string) => void;
  untrackEntity: (entityId: string) => void;
  clearTrackedEntities: () => void;
  
  // Queries
  getEntity: (entityId: string) => EntityState | null;
  getEntitiesByType: (type: string) => EntityState[];
  getActiveEntities: () => EntityState[];
  getNearbyEntities: (position: Vector3, radius: number) => EntityState[];
  
  // Metadata
  setEntityMetadata: (entityId: string, key: string, value: any) => void;
  getEntityMetadata: (entityId: string, key: string) => any;
  
  // Bulk operations
  addEntities: (entities: EntityState[]) => void;
  removeEntities: (entityIds: string[]) => void;
  clearEntities: () => void;
  
  // Reset
  resetEntities: () => void;
}

export const createEntitySlice: StateCreator<EntitySlice> = (set, get) => ({
  entities: new Map(),
  trackedEntities: new Set(),
  
  // Add entity
  addEntity: (entity: EntityState) => set((state) => {
    const newEntities = new Map(state.entities);
    newEntities.set(entity.id, entity);
    console.log(`[EntitySlice] Added entity: ${entity.id} (${entity.type})`);
    return { entities: newEntities };
  }),
  
  // Remove entity
  removeEntity: (entityId: string) => set((state) => {
    const newEntities = new Map(state.entities);
    const newTracked = new Set(state.trackedEntities);
    
    if (newEntities.delete(entityId)) {
      newTracked.delete(entityId);
      console.log(`[EntitySlice] Removed entity: ${entityId}`);
      return { entities: newEntities, trackedEntities: newTracked };
    }
    
    return state;
  }),
  
  // Update entity
  updateEntity: (entityId: string, updates: Partial<EntityState>) => set((state) => {
    const entity = state.entities.get(entityId);
    if (!entity) return state;
    
    const newEntities = new Map(state.entities);
    newEntities.set(entityId, { ...entity, ...updates });
    
    return { entities: newEntities };
  }),
  
  // Update entity position
  updateEntityPosition: (entityId: string, position: Vector3) => set((state) => {
    const entity = state.entities.get(entityId);
    if (!entity) return state;
    
    const newEntities = new Map(state.entities);
    newEntities.set(entityId, { ...entity, position });
    
    return { entities: newEntities };
  }),
  
  // Update entity rotation
  updateEntityRotation: (entityId: string, rotation: { x: number; y: number; z: number }) => set((state) => {
    const entity = state.entities.get(entityId);
    if (!entity) return state;
    
    const newEntities = new Map(state.entities);
    newEntities.set(entityId, { ...entity, rotation });
    
    return { entities: newEntities };
  }),
  
  // Track entity
  trackEntity: (entityId: string) => set((state) => {
    if (state.entities.has(entityId)) {
      const newTracked = new Set(state.trackedEntities);
      newTracked.add(entityId);
      console.log(`[EntitySlice] Tracking entity: ${entityId}`);
      return { trackedEntities: newTracked };
    }
    return state;
  }),
  
  // Untrack entity
  untrackEntity: (entityId: string) => set((state) => {
    const newTracked = new Set(state.trackedEntities);
    if (newTracked.delete(entityId)) {
      console.log(`[EntitySlice] Untracking entity: ${entityId}`);
      return { trackedEntities: newTracked };
    }
    return state;
  }),
  
  // Clear tracked entities
  clearTrackedEntities: () => {
    console.log('[EntitySlice] Cleared tracked entities');
    set({ trackedEntities: new Set() });
  },
  
  // Get entity
  getEntity: (entityId: string) => {
    return get().entities.get(entityId) || null;
  },
  
  // Get entities by type
  getEntitiesByType: (type: string) => {
    return Array.from(get().entities.values()).filter(e => e.type === type);
  },
  
  // Get active entities
  getActiveEntities: () => {
    return Array.from(get().entities.values()).filter(e => e.active);
  },
  
  // Get nearby entities
  getNearbyEntities: (position: Vector3, radius: number) => {
    return Array.from(get().entities.values()).filter(entity => {
      const distance = position.distanceTo(entity.position);
      return distance <= radius && entity.active;
    });
  },
  
  // Set entity metadata
  setEntityMetadata: (entityId: string, key: string, value: any) => set((state) => {
    const entity = state.entities.get(entityId);
    if (!entity) return state;
    
    const newEntities = new Map(state.entities);
    newEntities.set(entityId, {
      ...entity,
      metadata: { ...entity.metadata, [key]: value }
    });
    
    return { entities: newEntities };
  }),
  
  // Get entity metadata
  getEntityMetadata: (entityId: string, key: string) => {
    const entity = get().entities.get(entityId);
    return entity?.metadata[key];
  },
  
  // Add entities (bulk)
  addEntities: (entities: EntityState[]) => set((state) => {
    const newEntities = new Map(state.entities);
    entities.forEach(entity => {
      newEntities.set(entity.id, entity);
    });
    console.log(`[EntitySlice] Added ${entities.length} entities`);
    return { entities: newEntities };
  }),
  
  // Remove entities (bulk)
  removeEntities: (entityIds: string[]) => set((state) => {
    const newEntities = new Map(state.entities);
    const newTracked = new Set(state.trackedEntities);
    
    let removed = 0;
    entityIds.forEach(id => {
      if (newEntities.delete(id)) {
        newTracked.delete(id);
        removed++;
      }
    });
    
    if (removed > 0) {
      console.log(`[EntitySlice] Removed ${removed} entities`);
      return { entities: newEntities, trackedEntities: newTracked };
    }
    
    return state;
  }),
  
  // Clear all entities
  clearEntities: () => {
    console.log('[EntitySlice] Cleared all entities');
    set({ entities: new Map(), trackedEntities: new Set() });
  },
  
  // Reset
  resetEntities: () => {
    console.log('[EntitySlice] Resetting entity state');
    set({ entities: new Map(), trackedEntities: new Set() });
  }
});
