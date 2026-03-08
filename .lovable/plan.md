

# Advanced Audit & Sync — Admin, Agent, and User Accounts

## Audit Findings

After reviewing all files across the three portals, here are the gaps and issues identified:

### 1. **Visa/Ticket Upload-to-Download Flow (Broken Sync)**
- **Admin** uploads visa/ticket PDFs and sets status to "approved" — this works.
- **User** can see status badges and download files via `VisaTicketStatus` on the overview page — partially works.
- **Problem**: The user's Documents page (`DashboardDocuments.tsx`) does NOT show admin-issued visas or tickets. Users have to find them only on the overview page. There is no dedicated "My Visa & Tickets" section.
- **Problem**: Notifications are NOT sent when admin uploads/updates visa or ticket status. The triggers only fire on booking `status` and payment `status` changes.

### 2. **Agent Portal — Client Organization Gaps**
- Agent sees a flat table of all clients' visa/ticket statuses. No grouping, no expandable client detail, no admin messages shown.
- Agent cannot see admin messages (`admin_visa_message`, `admin_ticket_message`) that were sent per booking.
- Agent has no notification when a client's visa/ticket is updated by admin.

### 3. **Storage RLS — Download Access**
- The `visa-tickets` bucket has upload policies for admins but the download (SELECT) policy may be missing for regular users and agents. Users and agents calling `createSignedUrl` will fail silently if SELECT on `storage.objects` isn't permitted.

### 4. **Missing Notifications for Visa/Ticket Updates**
- No database trigger or application-level notification when visa_status or ticket_status changes on a booking.

---

## Implementation Plan

### Task 1: Add Visa/Ticket Notification Triggers (Database Migration)
Create a new trigger function `notify_visa_ticket_change()` that fires on UPDATE of `bookings` when `visa_status` or `ticket_status` changes. Inserts into `notifications` for the booking's `user_id` (and if `agent_id` is set, also notifies the agent's `user_id`).

### Task 2: Fix Storage RLS for Visa-Ticket Downloads
Add SELECT policies on `storage.objects` for the `visa-tickets` bucket so authenticated users can read files in their booking paths, and agents can read files for their client bookings.

### Task 3: Enhance User Dashboard — Dedicated Visa & Tickets Page
- Create a new page `src/pages/dashboard/DashboardVisaTickets.tsx` — a dedicated, clean page for users to view all their visa and flight ticket statuses with download buttons, admin messages, and provider details.
- Add route `/dashboard/visa-tickets` in `App.tsx`.
- Add "Visa & Tickets" menu item to `DashboardSidebar.tsx` and `MobileBottomNav.tsx`.
- Keep the `VisaTicketStatus` component on the overview as a summary card that links to the full page.

### Task 4: Enhance Agent Visa/Tickets Page — Better Organization
Rebuild `AgentVisaTickets.tsx` with:
- **Grouped by client** using collapsible accordion sections (client name + passport as header, bookings nested inside).
- Show admin messages per booking so agents can relay info to clients.
- Add color-coded progress indicators (both visa + ticket status visible at a glance per client).
- Show download buttons with clear labels ("Visa PDF", "Flight Ticket PDF").
- Add a "Bulk Summary" export option header showing counts per status.

### Task 5: Improve Admin Visa & Flight Ticket Pages
- Add a column showing whether the booking is a direct user booking or an agent booking (show agent name if agent_id exists). This helps admins know which bookings belong to agents.
- Query includes `agents(business_name)` join for agent bookings.
- Add batch status update capability (select multiple, change status together).

---

## Technical Details

**Migration SQL (Task 1 + 2):**
```sql
-- Trigger: notify on visa/ticket status changes
CREATE OR REPLACE FUNCTION public.notify_visa_ticket_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  -- Visa status changed
  IF OLD.visa_status IS DISTINCT FROM NEW.visa_status THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, 'Visa Status Updated',
      'Your visa for booking ' || COALESCE(NEW.reference, NEW.id::text) || ' is now ' || NEW.visa_status,
      CASE WHEN NEW.visa_status = 'approved' THEN 'success' WHEN NEW.visa_status = 'rejected' THEN 'error' ELSE 'info' END,
      '/dashboard/visa-tickets');
    -- Notify agent if exists
    IF NEW.agent_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      SELECT a.user_id, 'Client Visa Updated',
        NEW.full_name || '''s visa is now ' || NEW.visa_status, 'info', '/agent/visa-tickets'
      FROM public.agents a WHERE a.id = NEW.agent_id;
    END IF;
  END IF;
  -- Ticket status changed
  IF OLD.ticket_status IS DISTINCT FROM NEW.ticket_status THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (NEW.user_id, 'Flight Ticket Updated',
      'Your flight ticket for booking ' || COALESCE(NEW.reference, NEW.id::text) || ' is now ' || NEW.ticket_status,
      CASE WHEN NEW.ticket_status = 'approved' THEN 'success' WHEN NEW.ticket_status = 'rejected' THEN 'error' ELSE 'info' END,
      '/dashboard/visa-tickets');
    IF NEW.agent_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      SELECT a.user_id, 'Client Ticket Updated',
        NEW.full_name || '''s flight ticket is now ' || NEW.ticket_status, 'info', '/agent/visa-tickets'
      FROM public.agents a WHERE a.id = NEW.agent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_visa_ticket_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.notify_visa_ticket_change();

-- Storage: allow authenticated users to download from visa-tickets bucket
CREATE POLICY "Authenticated users can download visa tickets"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'visa-tickets');
```

**Files to create:**
- `src/pages/dashboard/DashboardVisaTickets.tsx`

**Files to edit:**
- `src/App.tsx` — add route + lazy import
- `src/components/dashboard/DashboardSidebar.tsx` — add menu item
- `src/components/dashboard/MobileBottomNav.tsx` — add nav item  
- `src/components/dashboard/VisaTicketStatus.tsx` — add "View All" link
- `src/pages/agent/AgentVisaTickets.tsx` — rebuild with client grouping + admin messages
- `src/pages/admin/AdminVisaManagement.tsx` — add agent column + batch actions
- `src/pages/admin/AdminFlightTickets.tsx` — add agent column + batch actions

