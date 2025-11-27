/**
 * EntityHierarchy
 * 
 * Manages parent-child relationships between entities in the scene.
 * Provides efficient hierarchy traversal and manipulation.
 */

export class EntityHierarchy {
  private parentMap: Map<string, string> = new Map(); // child -> parent
  private childrenMap: Map<string, Set<string>> = new Map(); // parent -> children
  private rootEntities: Set<string> = new Set();

  /**
   * Add an entity to the hierarchy
   */
  addEntity(entityId: string, parentId?: string): void {
    if (parentId) {
      // Set parent relationship
      this.parentMap.set(entityId, parentId);
      
      // Add to parent's children
      if (!this.childrenMap.has(parentId)) {
        this.childrenMap.set(parentId, new Set());
      }
      this.childrenMap.get(parentId)!.add(entityId);
      
      // Remove from roots if it was there
      this.rootEntities.delete(entityId);
    } else {
      // Add as root entity
      this.rootEntities.add(entityId);
    }
  }

  /**
   * Remove an entity from the hierarchy
   */
  removeEntity(entityId: string): void {
    // Get children before removing
    const children = this.getChildren(entityId);
    
    // Remove from parent's children
    const parentId = this.parentMap.get(entityId);
    if (parentId) {
      const siblings = this.childrenMap.get(parentId);
      if (siblings) {
        siblings.delete(entityId);
      }
    }
    
    // Remove from parent map
    this.parentMap.delete(entityId);
    
    // Remove from roots
    this.rootEntities.delete(entityId);
    
    // Remove children map
    this.childrenMap.delete(entityId);
    
    // Orphan children (make them roots)
    for (const childId of children) {
      this.parentMap.delete(childId);
      this.rootEntities.add(childId);
    }
  }

  /**
   * Set parent of an entity
   */
  setParent(entityId: string, newParentId: string | null): void {
    // Remove from old parent
    const oldParentId = this.parentMap.get(entityId);
    if (oldParentId) {
      const siblings = this.childrenMap.get(oldParentId);
      if (siblings) {
        siblings.delete(entityId);
      }
    }
    
    // Remove from roots
    this.rootEntities.delete(entityId);
    
    if (newParentId) {
      // Set new parent
      this.parentMap.set(entityId, newParentId);
      
      // Add to new parent's children
      if (!this.childrenMap.has(newParentId)) {
        this.childrenMap.set(newParentId, new Set());
      }
      this.childrenMap.get(newParentId)!.add(entityId);
    } else {
      // Remove parent (make root)
      this.parentMap.delete(entityId);
      this.rootEntities.add(entityId);
    }
  }

  /**
   * Get parent of an entity
   */
  getParent(entityId: string): string | null {
    return this.parentMap.get(entityId) || null;
  }

  /**
   * Get children of an entity
   */
  getChildren(entityId: string): string[] {
    const children = this.childrenMap.get(entityId);
    return children ? Array.from(children) : [];
  }

  /**
   * Get all descendants (recursive)
   */
  getDescendants(entityId: string): string[] {
    const descendants: string[] = [];
    const queue = [entityId];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = this.getChildren(current);
      
      for (const child of children) {
        descendants.push(child);
        queue.push(child);
      }
    }
    
    return descendants;
  }

  /**
   * Get all ancestors (up to root)
   */
  getAncestors(entityId: string): string[] {
    const ancestors: string[] = [];
    let current = this.getParent(entityId);
    
    while (current) {
      ancestors.push(current);
      current = this.getParent(current);
    }
    
    return ancestors;
  }

  /**
   * Get root entities
   */
  getRoots(): string[] {
    return Array.from(this.rootEntities);
  }

  /**
   * Check if entity is root
   */
  isRoot(entityId: string): boolean {
    return this.rootEntities.has(entityId);
  }

  /**
   * Check if entity is ancestor of another
   */
  isAncestorOf(ancestorId: string, descendantId: string): boolean {
    let current = this.getParent(descendantId);
    
    while (current) {
      if (current === ancestorId) {
        return true;
      }
      current = this.getParent(current);
    }
    
    return false;
  }

  /**
   * Check if entity is descendant of another
   */
  isDescendantOf(descendantId: string, ancestorId: string): boolean {
    return this.isAncestorOf(ancestorId, descendantId);
  }

  /**
   * Get depth of entity in hierarchy
   */
  getDepth(entityId: string): number {
    let depth = 0;
    let current = this.getParent(entityId);
    
    while (current) {
      depth++;
      current = this.getParent(current);
    }
    
    return depth;
  }

  /**
   * Traverse hierarchy depth-first
   */
  traverseDepthFirst(
    callback: (entityId: string, depth: number) => void,
    startEntityId?: string
  ): void {
    const roots = startEntityId ? [startEntityId] : this.getRoots();
    
    const traverse = (entityId: string, depth: number) => {
      callback(entityId, depth);
      
      const children = this.getChildren(entityId);
      for (const child of children) {
        traverse(child, depth + 1);
      }
    };
    
    for (const root of roots) {
      traverse(root, 0);
    }
  }

  /**
   * Traverse hierarchy breadth-first
   */
  traverseBreadthFirst(
    callback: (entityId: string, depth: number) => void,
    startEntityId?: string
  ): void {
    const roots = startEntityId ? [startEntityId] : this.getRoots();
    const queue: Array<{ id: string; depth: number }> = roots.map(id => ({ id, depth: 0 }));
    
    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      callback(id, depth);
      
      const children = this.getChildren(id);
      for (const child of children) {
        queue.push({ id: child, depth: depth + 1 });
      }
    }
  }

  /**
   * Get sibling entities
   */
  getSiblings(entityId: string): string[] {
    const parentId = this.getParent(entityId);
    
    if (parentId) {
      const siblings = this.getChildren(parentId);
      return siblings.filter(id => id !== entityId);
    }
    
    // Root entity - return other roots
    return this.getRoots().filter(id => id !== entityId);
  }

  /**
   * Get entity count
   */
  getEntityCount(): number {
    return this.parentMap.size + this.rootEntities.size;
  }

  /**
   * Clear all hierarchy data
   */
  clear(): void {
    this.parentMap.clear();
    this.childrenMap.clear();
    this.rootEntities.clear();
  }

  /**
   * Get debug info
   */
  getDebugInfo(): string {
    return `EntityHierarchy | Entities: ${this.getEntityCount()}, Roots: ${this.rootEntities.size}`;
  }

  /**
   * Print hierarchy tree (for debugging)
   */
  printTree(startEntityId?: string): string {
    const lines: string[] = [];
    
    const printNode = (entityId: string, depth: number, isLast: boolean, prefix: string) => {
      const connector = isLast ? '└── ' : '├── ';
      lines.push(prefix + connector + entityId);
      
      const children = this.getChildren(entityId);
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      
      children.forEach((child, index) => {
        const isLastChild = index === children.length - 1;
        printNode(child, depth + 1, isLastChild, childPrefix);
      });
    };
    
    const roots = startEntityId ? [startEntityId] : this.getRoots();
    roots.forEach((root, index) => {
      const isLast = index === roots.length - 1;
      printNode(root, 0, isLast, '');
    });
    
    return lines.join('\n');
  }
}
