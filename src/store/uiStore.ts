/**
 * UI Store
 * 
 * Manages UI state, visibility, notifications, and dialogs
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { UIState, Notification } from '../types/store/StoreTypes';

export interface UIStore extends UIState {
  // Visibility actions
  toggleHUD: () => void;
  toggleMinimap: () => void;
  toggleDebugInfo: () => void;
  showMenuAction: () => void;
  hideMenu: () => void;
  showSettingsAction: () => void;
  hideSettings: () => void;
  showMissionBriefingAction: () => void;
  hideMissionBriefing: () => void;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Dialogs
  openDialog: (dialogId: string, data?: any) => void;
  closeDialog: () => void;
  
  // HUD settings
  setHUDOpacity: (opacity: number) => void;
  setHUDScale: (scale: number) => void;
  
  // Reset
  resetUI: () => void;
}

const initialUIState: UIState = {
  showHUD: true,
  showMinimap: true,
  showDebugInfo: false,
  showMenu: false,
  showSettings: false,
  showMissionBriefing: false,
  
  notifications: [],
  
  activeDialog: null,
  dialogData: null,
  
  hudOpacity: 1.0,
  hudScale: 1.0
};

export const useUIStore = create<UIStore>()(
  devtools(
    (set, get) => ({
      ...initialUIState,
      
      // Toggle HUD
      toggleHUD: () => set((state) => {
        const newState = !state.showHUD;
        console.log(`[UIStore] HUD: ${newState ? 'visible' : 'hidden'}`);
        return { showHUD: newState };
      }),
      
      // Toggle minimap
      toggleMinimap: () => set((state) => {
        const newState = !state.showMinimap;
        console.log(`[UIStore] Minimap: ${newState ? 'visible' : 'hidden'}`);
        return { showMinimap: newState };
      }),
      
      // Toggle debug info
      toggleDebugInfo: () => set((state) => {
        const newState = !state.showDebugInfo;
        console.log(`[UIStore] Debug info: ${newState ? 'visible' : 'hidden'}`);
        return { showDebugInfo: newState };
      }),
      
      // Show menu
      showMenuAction: () => {
        console.log('[UIStore] Showing menu');
        set({ showMenu: true });
      },
      
      // Hide menu
      hideMenu: () => {
        console.log('[UIStore] Hiding menu');
        set({ showMenu: false });
      },
      
      // Show settings
      showSettingsAction: () => {
        console.log('[UIStore] Showing settings');
        set({ showSettings: true });
      },
      
      // Hide settings
      hideSettings: () => {
        console.log('[UIStore] Hiding settings');
        set({ showSettings: false });
      },
      
      // Show mission briefing
      showMissionBriefingAction: () => {
        console.log('[UIStore] Showing mission briefing');
        set({ showMissionBriefing: true });
      },
      
      // Hide mission briefing
      hideMissionBriefing: () => {
        console.log('[UIStore] Hiding mission briefing');
        set({ showMissionBriefing: false });
      },
      
      // Add notification
      addNotification: (notification) => set((state) => {
        const id = `notification-${Date.now()}-${Math.random()}`;
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: Date.now()
        };
        
        console.log(`[UIStore] Notification: ${notification.message}`);
        
        // Auto-remove after duration
        if (notification.duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, notification.duration);
        }
        
        return {
          notifications: [...state.notifications, newNotification]
        };
      }),
      
      // Remove notification
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
      })),
      
      // Clear notifications
      clearNotifications: () => {
        console.log('[UIStore] Cleared notifications');
        set({ notifications: [] });
      },
      
      // Open dialog
      openDialog: (dialogId, data) => {
        console.log(`[UIStore] Opening dialog: ${dialogId}`);
        set({
          activeDialog: dialogId,
          dialogData: data
        });
      },
      
      // Close dialog
      closeDialog: () => {
        console.log('[UIStore] Closing dialog');
        set({
          activeDialog: null,
          dialogData: null
        });
      },
      
      // Set HUD opacity
      setHUDOpacity: (opacity) => set({
        hudOpacity: Math.max(0, Math.min(1, opacity))
      }),
      
      // Set HUD scale
      setHUDScale: (scale) => set({
        hudScale: Math.max(0.5, Math.min(2, scale))
      }),
      
      // Reset UI
      resetUI: () => {
        console.log('[UIStore] Resetting UI state');
        set(initialUIState);
      }
    }),
    {
      name: 'ui-store',
      enabled: import.meta.env.DEV
    }
  )
);

// Selectors
export const selectNotifications = (state: UIStore) => state.notifications;
export const selectActiveDialog = (state: UIStore) => ({
  activeDialog: state.activeDialog,
  dialogData: state.dialogData
});
export const selectHUDSettings = (state: UIStore) => ({
  opacity: state.hudOpacity,
  scale: state.hudScale
});
