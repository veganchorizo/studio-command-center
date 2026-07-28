import { create } from "zustand";
import { persist } from "zustand/middleware";

type UiState = {
  sidebarCollapsed: boolean;
  paletteOpen: boolean;
  toggleSidebar: () => void;
  setPaletteOpen: (open: boolean) => void;
};

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      paletteOpen: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
    }),
    { name: "studio-os:ui" },
  ),
);
