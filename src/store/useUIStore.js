import { create } from 'zustand'

/**
 * Global, non-persisted UI chrome state (sidebar, mobile nav, command palette).
 * Kept separate from server state (React Query) and auth state (AuthContext).
 */
export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  commandPaletteOpen: false,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  openMobileNav: () => set({ mobileNavOpen: true }),
  closeMobileNav: () => set({ mobileNavOpen: false }),

  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  // Lets detail pages register a friendly label for a dynamic route segment
  // (e.g. a Firestore doc id) so AppBreadcrumbs can show "Dr. Jane Smith"
  // instead of the raw uid.
  breadcrumbLabels: {},
  setBreadcrumbLabel: (segment, label) =>
    set((state) => ({
      breadcrumbLabels: { ...state.breadcrumbLabels, [segment]: label },
    })),
  clearBreadcrumbLabel: (segment) =>
    set((state) => {
      const next = { ...state.breadcrumbLabels }
      delete next[segment]
      return { breadcrumbLabels: next }
    }),
}))
