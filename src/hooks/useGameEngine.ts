/**
 * useGameEngine Hook
 * 
 * React hook for integrating the GameEngine with React components.
 * Manages engine lifecycle and provides access to engine state.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from '../engine/core/GameEngine';
import { EngineState, EngineConfig, EngineStats } from '../types/engine/EngineTypes';

export interface UseGameEngineOptions {
  config?: Partial<EngineConfig>;
  autoStart?: boolean;
}

export interface UseGameEngineReturn {
  engine: GameEngine | null;
  state: EngineState;
  stats: EngineStats | null;
  isInitialized: boolean;
  isRunning: boolean;
  isPaused: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

export function useGameEngine(options: UseGameEngineOptions = {}): UseGameEngineReturn {
  const { config, autoStart = false } = options;
  
  const engineRef = useRef<GameEngine | null>(null);
  const [state, setState] = useState<EngineState>(EngineState.UNINITIALIZED);
  const [stats, setStats] = useState<EngineStats | null>(null);
  const statsIntervalRef = useRef<number | null>(null);

  // Initialize engine
  useEffect(() => {
    const initEngine = async () => {
      try {
        // Create engine
        const engine = new GameEngine(config);
        engineRef.current = engine;

        // Initialize engine
        await engine.initialize();
        setState(engine.getState());

        // Auto-start if requested
        if (autoStart) {
          engine.start();
          setState(engine.getState());
          
          // Start stats update interval for auto-start
          statsIntervalRef.current = window.setInterval(() => {
            if (engineRef.current) {
              setStats(engineRef.current.getStats());
            }
          }, 1000);
        }

      } catch (error) {
        console.error('Failed to initialize game engine:', error);
        setState(EngineState.ERROR);
      }
    };

    initEngine();

    // Cleanup
    return () => {
      if (statsIntervalRef.current !== null) {
        clearInterval(statsIntervalRef.current);
      }

      if (engineRef.current) {
        try {
          engineRef.current.destroy();
        } catch (error) {
          console.error('Error destroying engine:', error);
        }
        engineRef.current = null;
      }
    };
  }, []); // Empty deps - only run once

  // Start engine
  const start = useCallback(() => {
    if (engineRef.current) {
      try {
        engineRef.current.start();
        setState(engineRef.current.getState());
        
        // Start stats update interval when engine starts
        if (statsIntervalRef.current === null) {
          statsIntervalRef.current = window.setInterval(() => {
            if (engineRef.current) {
              setStats(engineRef.current.getStats());
            }
          }, 1000); // Update stats every second
        }
      } catch (error) {
        console.error('Failed to start engine:', error);
      }
    }
  }, []);

  // Pause engine
  const pause = useCallback(() => {
    if (engineRef.current) {
      try {
        engineRef.current.pause();
        setState(engineRef.current.getState());
      } catch (error) {
        console.error('Failed to pause engine:', error);
      }
    }
  }, []);

  // Resume engine
  const resume = useCallback(() => {
    if (engineRef.current) {
      try {
        engineRef.current.resume();
        setState(engineRef.current.getState());
      } catch (error) {
        console.error('Failed to resume engine:', error);
      }
    }
  }, []);

  // Stop engine
  const stop = useCallback(() => {
    if (engineRef.current) {
      try {
        engineRef.current.stop();
        setState(engineRef.current.getState());
        
        // Stop stats update interval when engine stops
        if (statsIntervalRef.current !== null) {
          clearInterval(statsIntervalRef.current);
          statsIntervalRef.current = null;
        }
      } catch (error) {
        console.error('Failed to stop engine:', error);
      }
    }
  }, []);

  return {
    engine: engineRef.current,
    state,
    stats,
    isInitialized: state === EngineState.READY || state === EngineState.RUNNING || state === EngineState.PAUSED || state === EngineState.STOPPED,
    isRunning: state === EngineState.RUNNING,
    isPaused: state === EngineState.PAUSED,
    start,
    pause,
    resume,
    stop
  };
}
