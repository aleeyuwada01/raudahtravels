

# Admin UI Redesign — Flat Design with Updated Colors

## What Changes

### 1. Color System Update (`src/index.css`)
- Replace primary emerald `hsl(162, 90%, 17%)` with the requested green `rgba(73, 186, 106)` → `hsl(139, 46%, 51%)`
- Remove gold/yellow/orange from secondary, accent, and border tokens — replace with neutral grays
- Admin sidebar background: slightly darker than body (e.g. `hsl(0, 0%, 94%)` vs body `hsl(0, 0%, 97%)`)

### 2. Admin Sidebar (`src/components/admin/AdminSidebar.tsx`)
- Remove `border-r` from sidebar
- Darken sidebar bg to `hsl(0, 0%, 93%)` (subtle contrast vs white content area)

### 3. Admin Dashboard Redesign (`src/pages/admin/AdminOverview.tsx`)
- Match reference: large stat values (text-4xl/5xl bold), small label above, percentage badge with up/down arrow
- Reduce stat cards from 6 to 4 main ones (like reference: Pilgrims, Revenue, Bookings, Agents)
- Flat card design: no heavy borders, subtle rounded cards with white bg, minimal shadows
- Keep charts and recent activity sections but with updated color palette

### 4. Global Card & Button Style Updates
- Update button primary color to the new green across all admin pages
- Cards: cleaner flat look — lighter borders, more padding, bigger typography for key values
- Badge colors: use the new green for success states, neutral gray for pending, red for destructive

### Files to Edit
- `src/index.css` — update CSS custom properties (primary, secondary, accent, border, sidebar vars)
- `src/components/admin/AdminSidebar.tsx` — remove border-r, update bg
- `src/pages/admin/AdminOverview.tsx` — redesign stat cards with bigger values, flat aesthetic, new colors
- `src/components/ui/card.tsx` — no changes needed (styling via CSS vars)

### Color Mapping
```text
OLD                          → NEW
primary: hsl(162,90%,17%)    → hsl(139,46%,51%)  [rgba(73,186,106)]
secondary: hsl(43,56%,52%)   → hsl(0,0%,40%)     [neutral gray]
accent: hsl(43,56%,52%)      → hsl(139,46%,51%)  [same green]
border: hsl(43,30%,80%)      → hsl(0,0%,88%)     [neutral border]
sidebar-bg: hsl(162,90%,12%) → hsl(0,0%,93%)     [light gray, darker than body]
```

All admin pages inherit from CSS variables, so color changes propagate automatically. The Overview page gets a structural redesign for the stat cards to match the reference's large-number flat style.

