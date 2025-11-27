/**
 * Logger Middleware
 * 
 * Logs state changes for debugging purposes
 */

import { StateCreator } from 'zustand';

export interface LoggerOptions {
  enabled?: boolean;
  collapsed?: boolean;
  colors?: {
    title?: string;
    prevState?: string;
    action?: string;
    nextState?: string;
    error?: string;
  };
}

const defaultColors = {
  title: '#9E9E9E',
  prevState: '#9E9E9E',
  action: '#03A9F4',
  nextState: '#4CAF50',
  error: '#F20404'
};

export const logger = <T>(
  config: StateCreator<T>,
  options: LoggerOptions = {}
): StateCreator<T> => {
  const {
    enabled = import.meta.env.DEV,
    collapsed = true,
    colors = defaultColors
  } = options;

  if (!enabled) {
    return config;
  }

  return (set, get, api) => {
    const loggedSet: typeof set = (...args: any[]) => {
      const prevState = get();
      
      (set as any)(...args);
      
      const nextState = get();
      const timestamp = new Date().toLocaleTimeString();
      
      // Create log group
      const groupMethod = collapsed ? console.groupCollapsed : console.group;
      
      groupMethod(
        `%c zustand @ ${timestamp}`,
        `color: ${colors.title}; font-weight: bold;`
      );
      
      console.log(
        '%c prev state',
        `color: ${colors.prevState}; font-weight: bold;`,
        prevState
      );
      
      console.log(
        '%c action',
        `color: ${colors.action}; font-weight: bold;`,
        args[0]
      );
      
      console.log(
        '%c next state',
        `color: ${colors.nextState}; font-weight: bold;`,
        nextState
      );
      
      console.groupEnd();
    };

    return config(loggedSet, get, api);
  };
};

/**
 * Create a simple action logger
 */
export const createActionLogger = (storeName: string) => {
  return (actionName: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(
        `%c[${storeName}] ${actionName}`,
        'color: #03A9F4; font-weight: bold;',
        ...args
      );
    }
  };
};
