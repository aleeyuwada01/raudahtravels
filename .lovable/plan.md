

# Admin Sidebar Redesign — Clean Light Theme with Collapsible Dropdowns

## Design Direction (from reference images)
- **Light/white background** sidebar instead of current dark emerald
- Clean, minimal aesthetic with subtle gray tones
- **Collapsible dropdown groups** with chevron arrows (like "Product > Overview, Drafts, Released")
- Top-level items (Dashboard, standalone pages) are flat links
- Multi-child groups (Documents, Agents, Operations, System) become collapsible accordions with sub-items indented
- Active item gets a subtle highlight pill
- Rounded logo at top, clean user footer

## Structure

```text
┌─────────────────────┐
│  🔲 Raudah Admin    │  ← Logo + brand
├─────────────────────┤
│  ⊞ Dashboard        │  ← flat link (Overview)
│  📦 Packages        │  ← flat link
│  💳 Payments        │  ← flat link
│  👥 Pilgrims        │  ← flat link
│  📊 Analytics       │  ← flat link
│  🏷 ID Tags         │  ← flat link
│                     │
│  📄 Documents    ▾  │  ← collapsible
│     Visa Mgmt       │
│     Flight Tickets   │
│                     │
│  👤 Agents       ▾  │  ← collapsible
│     Agents List      │
│     Applications     │
│     Agent Wallets    │
│                     │
│  ⚙ Operations   ▾  │  ← collapsible
│     Bank Accounts    │
│     Activity Log     │
│     Amendments       │
│     Support Tickets  │
│                     │
│  🛡 System       ▾  │  ← collapsible
│     Staff Mgmt       │
│     Team Chat        │
│     Booking Form     │
│     AI Assistant     │
│     Settings         │
├─────────────────────┤
│  [Avatar] Admin Name │
│  Sign Out            │
└─────────────────────┘
```

## Changes

### 1. New CSS variables for admin sidebar
Add admin-specific sidebar overrides in `index.css` — light background (`#fafafa`), dark text, subtle borders, soft active state.

### 2. Rewrite `AdminSidebar.tsx`
- Use `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent` from radix for dropdown groups
- Top-level items (Dashboard section) rendered as flat `NavLink` items
- Groups with children get a clickable header with `ChevronDown` icon that rotates on open
- Active sub-item auto-opens its parent group via `useLocation`
- Clean white/light gray theme with emerald accent for active items
- Subtle left border indicator on active items (like the reference)

### 3. Update `AdminLayout.tsx`
- Pass sidebar-specific className overrides for the light theme

**Files to edit:**
- `src/components/admin/AdminSidebar.tsx` — full rewrite with collapsible groups
- `src/index.css` — add `.admin-sidebar` override styles

