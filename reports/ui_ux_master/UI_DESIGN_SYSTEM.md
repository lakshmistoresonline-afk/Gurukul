# GURUKUL AI — UI DESIGN SYSTEM SPECIFICATION
**Date**: November 3, 2026  

---

## 1. Color Palette & Palette Tokens

- **Gurukul Primary Blue**: `#244B86` / `#244B91` (Navigation Sidebar & Primary Brand Headers)
- **Learning Teal**: `#0D9488` / `teal-600` (Interactive Buttons, Callouts, Active Module Tabs)
- **Light Canvas**: `#F4F6FA` / `bg-[#F5F6F8]` (Page Canvas Backgrounds)
- **Studio Dark**: `#111827` / `bg-slate-900` (High-contrast Media Viewers)
- **Secondary Accent**: `#6366F1` / `indigo-600` (Core Concept Badges & Progress Rings)

---

## 2. Reusable Component Hierarchy

1. **`StudentNavigation.tsx`**: Universal Desktop Sidebar & Mobile Bottom Navigation Drawer.
2. **Class Switcher Bar**: Integrated top toggle pill (`Class 5`, `Class 6`, `Class 7`).
3. **`RendererRegistry.tsx`**: Component registry with exact identity lookup and universal content type fallback.
4. **`MathsNotesComponent.tsx`**: Multi-tab math concept & algorithm viewer.
5. **`HindiNotesComponent.tsx`**: Devanagari text viewer with full character set support.
