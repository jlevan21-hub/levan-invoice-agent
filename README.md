# Levan Media Invoice Agent

An AI-powered n8n workflow that monitors a dedicated Gmail inbox, reads incoming vendor invoices, extracts billing data with Google Gemini, and loads it into a central Google Sheets tracker — with zero manual data entry.

---

## How It Works

```
Email Received → PDF Validated → Vendor Lookup → PDF → Images → AI Extraction → Data Validated → Routed to Outcome
```

1. **Email Received** — Agent polls the Gmail inbox every 2 minutes for new emails
2. **PDF Validated** — Confirms the email contains a PDF attachment; rejects and labels emails without one
3. **Vendor Lookup** — Checks a Vendor Hints sheet for known sender domains and passes context to the AI
4. **PDF → Images** — Converts each PDF page to a high-quality image (up to 50 pages per attachment)
5. **AI Extraction** — Google Gemini 2.5 Flash reads all pages together and extracts invoice data
6. **Data Validated** — Checks all required fields are present and routes to the appropriate outcome
7. **Routed to Outcome**:
   - ✅ **Valid Invoice** — PDF archived to Google Drive, row appended to Invoice Tracker, auto-reply sent to vendor, email labeled `Processed`
   - ⚠️ **Needs Attention** — Logged to a separate sheet tab, alert email sent to team, email labeled for follow-up
   - ❌ **Not an Invoice** — Silently skipped

---

## Data Extracted Per Invoice

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
| Commission Rate | Looked up from Commission Schedule tab |
| Commission Amount | Calculated commission |
| Payment Terms | e.g. Net 30 |
| Status | Starts as "Pending Review" |
| File Link | Direct link to PDF in Google Drive |
| Sender Email | Billing contact on the invoice |
| Confidence | AI confidence score (0–1) |

---

## Key Capabilities

- **Handles any volume** — single invoices or batch PDFs with 50+ invoices processed automatically
- **Multi-page invoice support** — AI reads all pages together as one document, not page by page
- **Multi-invoice PDFs** — a single PDF containing multiple invoices is split and each is logged as a separate row
- **Works with unknown vendors** — no prior vendor setup required; the Vendor Hints sheet is optional
- **Auto-reply to vendors** — sends a confirmation email so vendors know their invoice was received
- **Human-in-the-loop** — low-confidence or incomplete extractions are flagged for manual review, never silently dropped
- **Full audit trail** — every invoice PDF is archived in Google Drive with a direct link from the tracker

---

## Tech Stack

| System | Role |
|---|---|
| **n8n** | Workflow automation platform |
| **Gmail** | Monitors inbox for incoming invoices |
| **Google Gemini 2.5 Flash** | AI that reads and extracts invoice data |
| **Google Drive** | Archives original PDF invoices |
| **Google Sheets** | Central invoice tracking and reporting |
| **Poppler (`pdftoppm`)** | PDF-to-image conversion inside Docker |
| **Cloudflare Tunnel** | Free HTTPS public URL for Google OAuth |

---

## Project Structure

```
levan-invoice-agent/
├── Levan Media Invoice Agent.json          # n8n workflow (import into n8n)
├── docker-compose.yml                      # Runs n8n + Ollama + Cloudflare tunnel
├── Dockerfile.n8n                          # Custom n8n image with pdftoppm support
├── Invoice Agent - Executive Overview.md   # Executive summary of the workflow
├── Levan Media Invoice Agent - Executive Overview.pptx  # Executive presentation
└── create-pptx.js                          # Script used to generate the .pptx
```

---

## Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- A Google account with Gmail, Google Drive, and Google Sheets access
- A Google Cloud project with the Gmail, Drive, and Sheets APIs enabled
- A Google AI Studio API key for Gemini

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/levan-invoice-agent.git
cd levan-invoice-agent
```

### 2. Start the stack

```bash
docker compose up -d
```

This starts three containers:
- **levan-n8n** — n8n on port `5678`
- **levan-ollama** — Ollama (local LLM support, optional)
- **levan-tunnel** — Cloudflare quick tunnel (provides a public HTTPS URL for Google OAuth)

### 3. Get the public tunnel URL

```bash
docker logs levan-tunnel 2>&1 | grep "trycloudflare.com"
```

Copy the `https://xxxx.trycloudflare.com` URL, then update your `.env` or re-run with:

```bash
TUNNEL_URL=https://xxxx.trycloudflare.com docker compose up -d
```

> **Note:** The Cloudflare quick tunnel URL changes every time the container restarts. Update `TUNNEL_URL` and restart n8n whenever it changes.

### 4. Import the workflow

1. Open n8n at your tunnel URL
2. Go to **Workflows → Import from File**
3. Select `Levan Media Invoice Agent.json`

### 5. Configure credentials in n8n

Set up the following credentials inside n8n:

| Credential | Used By |
|---|---|
| Gmail OAuth2 | Gmail Trigger, Send Reply, Label Email nodes |
| Google Drive OAuth2 | Upload PDF to Drive node |
| Google Sheets OAuth2 | Lookup Vendor Hint, Append Invoice Row, Log Needs Attention nodes |
| HTTP Header Auth (Gemini API Key) | HTTP Request node → Gemini API |

### 6. Update node configurations

In the workflow, update the following to match your environment:

- **Gmail Trigger** — set the label to watch (e.g. `AutoInvoice`)
- **Lookup Vendor Hint** — set your Google Sheets spreadsheet ID and sheet name
- **Append Invoice Row** — set your spreadsheet ID and `Invoice Tracker` sheet name
- **Log Needs Attention** — set your spreadsheet ID and `Needs Attention` sheet name
- **Upload PDF to Drive** — set your target Google Drive folder ID
- **HTTP Request** — confirm Gemini model endpoint URL (`gemini-2.5-flash`)

### 7. Activate the workflow

Toggle the workflow to **Active** in n8n. It will begin polling Gmail every 2 minutes.

---

## Google Sheets Structure

The tracker spreadsheet requires three tabs:

**Invoice Tracker** — one row per processed invoice (columns match the field table above)

**Needs Attention** — invoices flagged for manual review:
| Date | Sender | Subject | Error | Raw AI Output |

**Vendor Hints** — optional lookup table for known vendors:
| Domain | Extraction Hint |
| `example.com` | This vendor uses a 2-page format. Invoice # is labeled "Ref No." |

**Commission Schedule** — rate lookup used in the tracker formula:
| Vendor Name | Commission Rate |

---

## Docker Notes

The custom `Dockerfile.n8n` installs `pdftoppm` (from Poppler) into the n8n image, which is required for PDF-to-image conversion. The Alpine version in the builder stage must match n8n's base Alpine version to avoid C++ ABI errors.

To rebuild after updating the Dockerfile:

```bash
docker compose down
docker compose build n8n --no-cache
docker compose up -d
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `TUNNEL_URL` | Public HTTPS URL from Cloudflare tunnel (set after first boot) |

---

## License

Private — Levan Media internal tooling.
