/**
 * DevTools Middleware
 * 
 * Integration with browser devtools for state inspection
 */

/**
 * DevTools configuration
 */
export interface DevToolsOptions {
  name?: string;
  enabled?: boolean;
  anonymousActionType?: string;
  trace?: boolean;
  traceLimit?: number;
}

/**
 * Check if Redux DevTools Extension is available
 */
export const isDevToolsAvailable = (): boolean => {
  return typeof window !== 'undefined' && !!(window as any).__REDUX_DEVTOOLS_EXTENSION__;
};

/**
 * Connect to Redux DevTools
 */
export const connectDevTools = (options: DevToolsOptions = {}) => {
  const {
    name = 'Zustand Store',
    enabled = import.meta.env.DEV,
    anonymousActionType = 'anonymous',
    trace = false,
    traceLimit = 10
  } = options;

  if (!enabled || !isDevToolsAvailable()) {
    return null;
  }

  const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__.connect({
    name,
    anonymousActionType,
    trace,
    traceLimit
  });

  return devTools;
};

/**
 * Send action to DevTools
 */
export const sendToDevTools = (
  devTools: any,
  action: string,
  state: any
): void => {
  if (devTools) {
    devTools.send(action, state);
  }
};

/**
 * Initialize DevTools for a store
 */
export const initDevTools = (storeName: string) => {
  const devTools = connectDevTools({ name: storeName });
  
  if (devTools) {
    console.log(`[DevTools] Connected: ${storeName}`);
  }
  
  return devTools;
};
