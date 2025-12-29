import { useState, useCallback, createContext, useContext } from 'react';

/**
 * Sidebar state management hook
 * Auto-generated polyfill by Inopay Liberation
 */
export interface SidebarState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const SidebarContext = createContext<SidebarState | null>(null);

export function useSidebar(): SidebarState {
  const context = useContext(SidebarContext);
  const [isOpen, setIsOpen] = useState(true);
  
  if (context) return context;
  
  return {
    isOpen,
    toggle: () => setIsOpen(prev => !prev),
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  };
}

export { SidebarContext };
export default useSidebar;