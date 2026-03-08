

# Add Katsina Quotation Template + Fix First-Page Whitespace

## Changes

### 1. Add Katsina Documentary Template (`src/data/proposalTemplates.ts`)

Add a new `katsinaTemplate: ProposalData` export with:
- **proposalTitle**: "Comprehensive Quotation\nFor Documentary Production"
- **clientName**: "Katsina State Government"
- **clientTitle**: "Client:"
- **clientLocation**: "Katsina State"
- **date**: "2026"
- **No coverLetter** (simple quotation format)
- **executiveSummary**: Project description — Documentary on Government Intervention on Nutrition, 10–15 minutes
- **problems**: Scope of Work items (concept development, scriptwriting, pre-production, field production, videography, drone, interviews, voice-over, post-production, motion graphics, music, final delivery)
- **featurePages**: Empty array (no feature pages needed for this simple quotation)
- **pricingTables**: Single table with the 4 cost rows:
  - Pre-Production: ₦500,000
  - Production: ₦1,200,000
  - Post-Production: ₦500,000
  - Publicizing & Media Distribution: ₦1,000,000
- **grandTotal**: Two options shown — ₦3,200,000 (with publicizing) / ₦2,200,000 (without)
- **timeline**: Single entry — "2–3 Weeks from date of initial payment"
- **Payment terms** in appendixSections: "70% advance, 30% upon completion"
- **Validity**: "30 Days from date of issuance"
- **mouParties/mouClauses/mouSignatories**: Standard FADAK terms adapted for Katsina

Add to `templateList` array before "custom":
```ts
{ id: "katsina", name: "Katsina Documentary Quotation", data: katsinaTemplate },
```

### 2. Fix First-Page Whitespace in PDF (`src/pages/Proposal.tsx`)

**Root cause**: The `CoverPage` component renders two separate `.proposal-page` divs — one for letterhead/cover letter and one for the title block (forced to page 2 via `data-pdf-new-page`). For templates without a cover letter (like Raudah and the new Katsina template), this creates an empty/sparse first page.

**Fix**: Restructure `CoverPage` to render as a **single page** when there is no `coverLetter`. The title block content should appear on page 1, directly after the letterhead.

- **When `data.coverLetter` exists**: Keep the current two-page layout (letterhead + letter on page 1, title on page 2)
- **When no `coverLetter`**: Render everything in a single `.proposal-page` div with one `data-pdf-section` — letterhead at top, then title block, client info, and date — no `data-pdf-new-page` attribute

This ensures content starts on page 1 for simple quotation templates.

### Files to Modify

| File | Change |
|------|--------|
| `src/data/proposalTemplates.ts` | Add `katsinaTemplate` export and add to `templateList` |
| `src/pages/Proposal.tsx` | Restructure `CoverPage` to conditionally render single-page or two-page layout based on presence of `coverLetter` |

