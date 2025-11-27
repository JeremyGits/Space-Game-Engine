/**
 * Shader Compiler
 * 
 * GLSL shader compilation utilities
 */

/**
 * Shader compilation result
 */
export interface ShaderCompilationResult {
  success: boolean;
  source: string;
  error?: string;
  warnings?: string[];
}


/**
 * Shader compiler class
 */
export class ShaderCompiler {
  private includes: Map<string, string> = new Map();
  
  /**
   * Register shader include
   */
  registerInclude(name: string, source: string): void {
    this.includes.set(name, source);
  }
  
  /**
   * Unregister shader include
   */
  unregisterInclude(name: string): void {
    this.includes.delete(name);
  }
  
  /**
   * Get shader include
   */
  getInclude(name: string): string | undefined {
    return this.includes.get(name);
  }
  
  /**
   * Process shader source
   */
  process(source: string, defines?: Record<string, any>): ShaderCompilationResult {
    const warnings: string[] = [];
    
    try {
      // Process defines
      let processedSource = this.processDefines(source, defines);
      
      // Process includes
      const includeResult = this.processIncludes(processedSource);
      if (!includeResult.success) {
        return includeResult;
      }
      processedSource = includeResult.source;
      
      // Process pragmas
      processedSource = this.processPragmas(processedSource, warnings);
      
      // Validate syntax (basic)
      const validationResult = this.validateSyntax(processedSource);
      if (!validationResult.success) {
        return validationResult;
      }
      
      return {
        success: true,
        source: processedSource,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    } catch (error) {
      return {
        success: false,
        source: source,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Process defines
   */
  private processDefines(source: string, defines?: Record<string, any>): string {
    if (!defines) {
      return source;
    }
    
    let defineString = '';
    for (const [name, value] of Object.entries(defines)) {
      if (value === true) {
        defineString += `#define ${name}\n`;
      } else if (value !== false && value !== undefined) {
        defineString += `#define ${name} ${value}\n`;
      }
    }
    
    // Insert defines after #version directive if present
    const versionMatch = source.match(/^#version\s+\d+.*$/m);
    if (versionMatch) {
      const versionLine = versionMatch[0];
      return source.replace(versionLine, `${versionLine}\n${defineString}`);
    }
    
    return defineString + source;
  }
  
  /**
   * Process includes
   */
  private processIncludes(source: string): ShaderCompilationResult {
    const includeRegex = /#include\s+["<]([^">]+)[">]/g;
    const processed = new Set<string>();
    let result = source;
    let match;
    
    // Process includes recursively
    while ((match = includeRegex.exec(result)) !== null) {
      const includeName = match[1];
      
      // Check for circular includes
      if (processed.has(includeName)) {
        return {
          success: false,
          source: source,
          error: `Circular include detected: ${includeName}`
        };
      }
      
      // Get include source
      const includeSource = this.includes.get(includeName);
      if (!includeSource) {
        return {
          success: false,
          source: source,
          error: `Include not found: ${includeName}`
        };
      }
      
      // Mark as processed
      processed.add(includeName);
      
      // Replace include with source
      result = result.replace(match[0], includeSource);
      
      // Reset regex
      includeRegex.lastIndex = 0;
    }
    
    return {
      success: true,
      source: result
    };
  }
  
  /**
   * Process pragmas
   */
  private processPragmas(source: string, warnings: string[]): string {
    // Process #pragma optimize
    source = source.replace(/#pragma\s+optimize\s*\(\s*(on|off)\s*\)/g, (_match, value) => {
      if (value === 'off') {
        warnings.push('Optimization disabled');
      }
      return ''; // Remove pragma
    });
    
    // Process #pragma debug
    source = source.replace(/#pragma\s+debug\s*\(\s*(on|off)\s*\)/g, (_match, value) => {
      if (value === 'on') {
        warnings.push('Debug mode enabled');
      }
      return ''; // Remove pragma
    });
    
    return source;
  }
  
  /**
   * Validate shader syntax (basic)
   */
  private validateSyntax(source: string): ShaderCompilationResult {
    // Check for balanced braces
    const openBraces = (source.match(/{/g) || []).length;
    const closeBraces = (source.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      return {
        success: false,
        source: source,
        error: `Unbalanced braces: ${openBraces} open, ${closeBraces} close`
      };
    }
    
    // Check for balanced parentheses
    const openParens = (source.match(/\(/g) || []).length;
    const closeParens = (source.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      return {
        success: false,
        source: source,
        error: `Unbalanced parentheses: ${openParens} open, ${closeParens} close`
      };
    }
    
    // Check for main function
    if (!source.match(/void\s+main\s*\(/)) {
      return {
        success: false,
        source: source,
        error: 'Missing main function'
      };
    }
    
    return {
      success: true,
      source: source
    };
  }
  
  /**
   * Minify shader source
   */
  minify(source: string): string {
    // Remove comments
    source = source.replace(/\/\*[\s\S]*?\*\//g, '');
    source = source.replace(/\/\/.*/g, '');
    
    // Remove extra whitespace
    source = source.replace(/\s+/g, ' ');
    
    // Remove whitespace around operators
    source = source.replace(/\s*([+\-*/%=<>!&|^~,;{}()\[\]])\s*/g, '$1');
    
    // Remove leading/trailing whitespace
    source = source.trim();
    
    return source;
  }
  
  /**
   * Generate shader hash
   */
  hash(source: string): string {
    let hash = 0;
    for (let i = 0; i < source.length; i++) {
      const char = source.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  /**
   * Clear all includes
   */
  clear(): void {
    this.includes.clear();
  }
}

/**
 * Global shader compiler instance
 */
export const shaderCompiler = new ShaderCompiler();
