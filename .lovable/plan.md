

# Master Rebuild Plan — Raudah Travels & Tours

This is a very large scope covering 20+ new features across all three portals. To avoid regressions and maintain quality, the work must be broken into sequential phases. Each phase builds on the previous one.

## Current State vs. Requested

**Already exists (8 admin, 6 agent, 8 customer pages):**
- Customer: Landing, Booking Wizard, Documents, Payments, Bookings, Profile, Support, Packages
- Agent: Overview, Clients, Packages, Book for Client, Bookings, Commissions
- Admin: Overview, Packages, Payments, Pilgrims, Analytics, ID Tags, Agent Applications, AI Assistant

**New features needed (~15 new pages + 8+ DB tables + 5+ edge functions):**

## Phased Delivery

### Phase 1 — Database Foundation & Admin Sidebar Expansion
*New tables and admin navigation scaffolding*

**Database migrations:**
- `staff_permissions` — granular per-section permissions for staff
- `agent_wallets` / `wallet_transactions` — agent balance tracking
- `support_tickets` — helpdesk with category/specialty routing
- `user_activity` — audit log for all major mutations
- `booking_amendments` — user-requested booking changes queue
- `team_messages` — internal staff chat
- `bank_accounts` — company bank details config
- Expand `app_role` enum: add `super_admin`, `staff`, `support`
- Add `visa_status`, `ticket_status`, `visa_provider`, `flight_provider`, `visa_file_url`, `ticket_file_url`, `admin_visa_message`, `admin_ticket_message` columns to `bookings`

**Admin sidebar:** Add all 17 menu items (Visa Management, Flight Tickets, Agents, Bank Accounts, Activity Log, Amendments, Support Tickets, Staff Management, Team Chat, Booking Form, Settings)

**New admin pages (scaffolded):** AdminVisaManagement, AdminFlightTickets, AdminAgents, AdminBankAccounts, AdminActivityLog, AdminAmendments, AdminSupportTickets, AdminStaffManagement, AdminTeamChat, AdminBookingForm, AdminSettings

### Phase 2 — Visa & Flight Ticket Management
*Admin upload workflow + Customer/Agent visibility*

- Admin: Upload visa/ticket PDF/image per pilgrim, set status, add messages, track provider
- Admin: Print/view uploaded documents directly
- Customer dashboard: New "Visa & Ticket Status" section showing status badges and download links
- Agent dashboard: Smart filterable view showing visa/ticket status across all clients

### Phase 3 — Agent Wallet System
*Wallet balance, OTP top-up, booking deduction*

- `admin-topup-wallet` edge function — initiates top-up with OTP email
- `verify-topup-otp` edge function — verifies 6-digit code, credits wallet
- Agent booking flow: Check balance before booking, deduct on confirmation
- Agent UI: Wallet balance card, transaction history, top-up request

### Phase 4 — Staff Management & Permissions
*RBAC for admin team*

- Staff Management page: Add/remove staff, assign granular permissions
- Permission-gated sidebar: Hide admin sections based on `staff_permissions`
- Activity Log page: Searchable audit trail of all system mutations
- Audit trigger functions on key tables

### Phase 5 — Support, Chat & Settings
*Internal tooling*

- Support Tickets: Multi-category helpdesk with staff routing by specialty
- Team Chat: Real-time encrypted internal messaging (Supabase Realtime)
- Bank Accounts: CRUD for company bank details shown to users
- Amendments: Queue for user booking change requests with approve/reject
- Booking Form: Dynamic field configuration for registration schema
- Settings: T&Cs, logo, maintenance mode toggles

### Phase 6 — Admin Pilgrim Enhancements
*Attribution and agent linkage*

- Pilgrim list: Show registration source (Direct vs Agent) with agent name
- Filter pilgrims by assigned agent
- Enhanced pilgrim detail view with full agent linkage

---

## Technical Approach

- All new tables get RLS policies following existing patterns (user sees own, admin sees all)
- Edge functions use manual JWT verification with `verify_jwt = false`
- New pages follow existing lazy-loading pattern with `lazyWithRetry`
- All routes added to `App.tsx` inside existing `ProtectedRoute` wrappers
- Existing booking/payment flows remain untouched (zero-regression)

## Recommended Starting Point

**Phase 1** is the foundation — without the schema changes, no other phase can proceed. I recommend starting there.

Given the enormous scope, would you like me to begin with Phase 1, or would you prefer to prioritize specific features (e.g., Visa Management or Agent Wallet first)?

