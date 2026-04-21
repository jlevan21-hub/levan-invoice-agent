# Levan Media Invoice Agent — How It Works

## Overview
An AI-powered automation that monitors a dedicated Gmail inbox, reads incoming vendor invoices, extracts billing data, and loads it into a central tracking spreadsheet — with zero manual data entry.

---

## End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. EMAIL RECEIVED                                              │
│     Vendor sends invoice to designated Gmail inbox             │
│     Agent checks every 2 minutes for new emails               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. VALIDATE ATTACHMENT                                         │
│     Does the email contain a PDF attachment?                   │
│     • No PDF → Auto-labeled "Rejected", no further action      │
│     • PDF found → Continue                                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. VENDOR LOOKUP                                               │
│     Checks a Vendor Hints sheet for known sender domains       │
│     Passes any vendor-specific context to the AI               │
│     (Works with unknown vendors too — hint is optional)        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. PDF → IMAGE CONVERSION                                      │
│     Converts each PDF page to a high-quality image             │
│     Supports multi-page PDFs and multi-invoice PDFs            │
│     (up to 50 pages per attachment)                            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. AI EXTRACTION  (Google Gemini 2.5 Flash)                   │
│     AI reads all invoice pages and extracts:                   │
│     • Vendor Name & Invoice Number                             │
│     • Invoice Date, Due Date & Payment Terms                   │
│     • Advertiser Name                                          │
│     • Gross Sale, Discount/Adjustment & Total Due              │
│     • Description of services billed                          │
│     Handles multiple invoices in a single PDF automatically    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. VALIDATE EXTRACTED DATA                                     │
│     Checks all required fields are present and complete        │
│     Routes each invoice to the appropriate outcome:            │
│                                                                │
│      ✅ Valid Invoice   ──────────────────────────► Step 7     │
│      ⚠️  Extraction Error  ──────────────────────► Step 8     │
│      ❌ Not an Invoice  → Silently skipped                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
┌──────────────────────┐       ┌───────────────────────────────┐
│  7. INVOICE          │       │  8. NEEDS ATTENTION           │
│     PROCESSED        │       │     • Logged to "Needs        │
│                      │       │       Attention" sheet tab    │
│  • PDF saved to      │       │     • Alert email sent to     │
│    Google Drive      │       │       team for manual review  │
│  • Row added to      │       │     • Email labeled for       │
│    Invoice Tracker   │       │       follow-up               │
│    spreadsheet       │       └───────────────────────────────┘
│  • Auto-reply sent   │
│    to vendor         │
│    confirming        │
│    receipt           │
│  • Email labeled     │
│    "Processed"       │
└──────────────────────┘
```

---

## What Gets Captured (Per Invoice)

| Field | Description |
|---|---|
| Date Received | Date the email arrived |
| Vendor Name | Company that issued the invoice |
| Invoice Number | Unique invoice identifier |
| Invoice Date | Date on the invoice |
| Due Date | Payment due date |
| Advertiser | Client the spend is attributed to |
| Description | Summary of services billed |
| Gross Sale | Subtotal before adjustments |
| Discount / Adjustment | Agency commission or discount |
| Net Sale | Amount after adjustment |
| Commission Rate | Looked up from Commission Schedule |
| Commission Amount | Calculated commission |
| Payment Terms | e.g. Net 30 |
| Status | Starts as "Pending Review" |
| File Link | Direct link to PDF in Google Drive |
| Sender Email | Billing contact on the invoice |
| Confidence | AI's confidence score (0–1) |

---

## Key Capabilities

- **Handles any volume** — processes single invoices or batch PDFs with 50+ invoices automatically
- **Multi-page invoice support** — AI reads all pages together, not page by page
- **Unknown vendors** — works even if the vendor has no prior history in the system
- **Auto-reply to vendors** — sends a confirmation reply so vendors know their invoice was received
- **Human-in-the-loop** — low-confidence or incomplete extractions are flagged for manual review, never silently dropped
- **Audit trail** — every invoice PDF is archived in Google Drive with a direct link from the tracker

---

## Systems Connected

| System | Role |
|---|---|
| Gmail | Monitors for incoming invoices |
| Google Gemini 2.5 Flash | AI that reads and extracts invoice data |
| Google Drive | Archives original PDF invoices |
| Google Sheets | Central invoice tracking & reporting |
| n8n | Workflow automation platform |
