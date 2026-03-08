

# Admin Table Redesign — Match Reference Style

## Reference Analysis
The uploaded screenshot shows:
- Action buttons as individually colored square icon buttons: **View (eye)** = gray bg, **Edit** = green bg, **Trash** = red/pink bg
- Each action icon sits inside a small rounded colored square (not ghost/transparent)
- Table rows with generous spacing, clean borders
- Pagination bar at the bottom (1, 2, 3, 4... with arrows)
- SL column with zero-padded numbers
- Status as green pill badges ("Active")

## Changes

### 1. Action Button Style (all admin table pages)
Replace current ghost-style action buttons with colored square icon buttons:
- **View (Eye)**: `bg-muted/80 text-muted-foreground` — gray square
- **Edit**: `bg-primary/15 text-primary` — green square  
- **Delete (Trash)**: `bg-destructive/15 text-destructive` — red square
- All with `rounded-lg h-8 w-8` sizing

### 2. Add Pagination Component
Add a reusable pagination section to tables with 10 items per page, page numbers, and prev/next arrows.

### 3. Files to Edit

| File | Changes |
|------|---------|
| `src/pages/admin/AdminPilgrims.tsx` | Update action button styles + add pagination |
| `src/pages/admin/AdminPackages.tsx` | Update action button styles + add pagination |
| `src/pages/admin/AdminPayments.tsx` | Add SL column, update action styles, add pagination |
| `src/pages/admin/AdminVisaManagement.tsx` | Add SL column, update action styles, add pagination |
| `src/pages/admin/AdminFlightTickets.tsx` | Add SL column, update action styles, add pagination |
| `src/pages/admin/AdminWalletManagement.tsx` | Add SL column, update action styles |
| `src/pages/admin/AdminAgentApplications.tsx` | Add SL column, update action button styles |
| `src/pages/admin/AdminStaffManagement.tsx` | Add SL column, update action styles |

### Action Button Pattern (applied everywhere)
```tsx
// View
<button className="h-8 w-8 rounded-lg bg-muted/80 text-muted-foreground flex items-center justify-center hover:bg-muted">
  <Eye className="h-4 w-4" />
</button>
// Edit
<button className="h-8 w-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/20">
  <Edit className="h-4 w-4" />
</button>
// Delete
<button className="h-8 w-8 rounded-lg bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/20">
  <Trash2 className="h-4 w-4" />
</button>
```

### Pagination Pattern
Each table page gets `currentPage` state and displays 10 rows per page with a pagination bar using the existing `Pagination` component at the bottom of the table card.

