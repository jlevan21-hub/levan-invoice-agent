const PptxGenJS = require("pptxgenjs");

const pres = new PptxGenJS();
pres.layout = "LAYOUT_16x9";
pres.title = "Levan Media Invoice Agent";

// Color palette
const DARK_GREEN = "1a4731";
const MID_GREEN = "2d6a4f";
const LIGHT_GREEN = "52b788";
const WHITE = "FFFFFF";
const OFF_WHITE = "f0f7f4";
const GRAY_TEXT = "4a6358";
const LIGHT_GRAY = "e8f0ec";
const YELLOW = "f4a535";
const RED_SOFT = "c0392b";

const makeShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.12 });

// ─── SLIDE 1: TITLE ───────────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: DARK_GREEN };

  // Large accent shape top-right
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 7.5, y: 0, w: 2.5, h: 5.625,
    fill: { color: MID_GREEN, transparency: 60 },
    line: { color: MID_GREEN, width: 0 }
  });

  // Bottom accent bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.1, w: 10, h: 0.525,
    fill: { color: LIGHT_GREEN, transparency: 70 },
    line: { color: LIGHT_GREEN, width: 0 }
  });

  // Vertical accent line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.5, y: 1.6, w: 0.06, h: 2.4,
    fill: { color: LIGHT_GREEN },
    line: { color: LIGHT_GREEN, width: 0 }
  });

  slide.addText("LEVAN MEDIA", {
    x: 0.72, y: 1.5, w: 7, h: 0.55,
    fontSize: 13, color: LIGHT_GREEN, bold: true, charSpacing: 8, margin: 0
  });

  slide.addText("Invoice Agent", {
    x: 0.7, y: 2.05, w: 7, h: 1.3,
    fontSize: 52, color: WHITE, bold: true, fontFace: "Georgia", margin: 0
  });

  slide.addText("AI-Powered Invoice Processing — How It Works", {
    x: 0.72, y: 3.35, w: 7, h: 0.5,
    fontSize: 15, color: OFF_WHITE, italic: true, margin: 0
  });
}

// ─── SLIDE 2: THE CHALLENGE ────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: WHITE };

  // Header bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.1,
    fill: { color: DARK_GREEN },
    line: { width: 0 }
  });

  slide.addText("The Challenge", {
    x: 0.5, y: 0.15, w: 9, h: 0.75,
    fontSize: 28, color: WHITE, bold: true, fontFace: "Georgia", margin: 0
  });

  // 3 challenge cards
  const cards = [
    { icon: "📧", title: "Fragmented Delivery", body: "Invoices arrive via email from dozens of vendors in varying formats, layouts, and frequencies — with no consistent structure." },
    { icon: "⌨️", title: "Manual Data Entry", body: "Someone must open each PDF, read it, and type every field into a spreadsheet — time-consuming and prone to transcription errors." },
    { icon: "🗂️", title: "No Standardized Process", body: "No consistent process for tracking status, archiving originals, or confirming receipt — leaving gaps in the audit trail." },
  ];

  cards.forEach((card, i) => {
    const x = 0.3 + i * 3.17;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.35, w: 3.0, h: 3.7,
      fill: { color: OFF_WHITE }, shadow: makeShadow(),
      line: { color: LIGHT_GRAY, width: 1 }
    });
    // Top accent
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.35, w: 3.0, h: 0.07,
      fill: { color: DARK_GREEN },
      line: { width: 0 }
    });
    slide.addText(card.icon, { x: x + 0.15, y: 1.5, w: 0.6, h: 0.6, fontSize: 26, margin: 0 });
    slide.addText(card.title, {
      x: x + 0.15, y: 2.1, w: 2.7, h: 0.5,
      fontSize: 14, color: DARK_GREEN, bold: true, margin: 0
    });
    slide.addText(card.body, {
      x: x + 0.15, y: 2.6, w: 2.7, h: 2.2,
      fontSize: 12, color: GRAY_TEXT, margin: 0, valign: "top"
    });
  });
}

// ─── SLIDE 3: THE SOLUTION ─────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: DARK_GREEN };

  slide.addText("The Solution", {
    x: 0.5, y: 0.3, w: 9, h: 0.7,
    fontSize: 32, color: WHITE, bold: true, fontFace: "Georgia", margin: 0
  });

  slide.addText("A fully automated AI agent that monitors, reads, and logs every invoice — with zero manual data entry", {
    x: 0.5, y: 1.0, w: 9, h: 0.6,
    fontSize: 14, color: OFF_WHITE, italic: true, margin: 0
  });

  // 4 stat boxes
  const stats = [
    { value: "2 min", label: "Poll Interval" },
    { value: "50 pages", label: "Max per PDF" },
    { value: "15+ fields", label: "Extracted per Invoice" },
    { value: "0", label: "Manual Steps for Valid Invoices" },
  ];

  stats.forEach((stat, i) => {
    const x = 0.3 + i * 2.38;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.9, w: 2.1, h: 2.8,
      fill: { color: MID_GREEN },
      line: { color: LIGHT_GREEN, width: 1 }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.9, w: 2.1, h: 0.07,
      fill: { color: LIGHT_GREEN },
      line: { width: 0 }
    });
    slide.addText(stat.value, {
      x: x + 0.1, y: 2.2, w: 1.9, h: 0.9,
      fontSize: 30, color: WHITE, bold: true, align: "center", margin: 0
    });
    slide.addText(stat.label, {
      x: x + 0.1, y: 3.15, w: 1.9, h: 1.2,
      fontSize: 11, color: OFF_WHITE, align: "center", margin: 0
    });
  });
}

// ─── SLIDE 4: HOW IT WORKS ─────────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: WHITE };

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.1,
    fill: { color: DARK_GREEN },
    line: { width: 0 }
  });

  slide.addText("How It Works — Step by Step", {
    x: 0.5, y: 0.15, w: 9, h: 0.75,
    fontSize: 28, color: WHITE, bold: true, fontFace: "Georgia", margin: 0
  });

  const steps = [
    { num: "1", title: "Email Received", desc: "Vendor sends invoice to designated Gmail inbox" },
    { num: "2", title: "PDF Validated", desc: "Confirms attachment is a valid PDF" },
    { num: "3", title: "Vendor Lookup", desc: "Checks known vendor database for context hints" },
    { num: "4", title: "PDF → Images", desc: "Converts each page to high-quality images (up to 50 pages)" },
    { num: "5", title: "AI Extraction", desc: "Gemini 2.5 Flash reads all pages and extracts invoice data" },
    { num: "6", title: "Data Validated", desc: "Checks all required fields are present and complete" },
    { num: "7", title: "Routed to Outcome", desc: "Valid invoices processed; errors flagged for human review" },
  ];

  // Two rows: 4 top, 3 bottom, with arrow connectors
  const row1 = steps.slice(0, 4);
  const row2 = steps.slice(4, 7);

  row1.forEach((step, i) => {
    const x = 0.25 + i * 2.38;
    const y = 1.3;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.1, h: 1.55,
      fill: { color: OFF_WHITE }, shadow: makeShadow(),
      line: { color: LIGHT_GRAY, width: 1 }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.1, h: 0.07,
      fill: { color: DARK_GREEN },
      line: { width: 0 }
    });
    slide.addShape(pres.shapes.OVAL, {
      x: x + 0.08, y: y + 0.1, w: 0.34, h: 0.34,
      fill: { color: DARK_GREEN },
      line: { width: 0 }
    });
    slide.addText(step.num, {
      x: x + 0.08, y: y + 0.1, w: 0.34, h: 0.34,
      fontSize: 11, color: WHITE, bold: true, align: "center", valign: "middle", margin: 0
    });
    slide.addText(step.title, {
      x: x + 0.05, y: y + 0.5, w: 2.0, h: 0.4,
      fontSize: 11, color: DARK_GREEN, bold: true, margin: 0
    });
    slide.addText(step.desc, {
      x: x + 0.05, y: y + 0.9, w: 2.0, h: 0.55,
      fontSize: 9, color: GRAY_TEXT, margin: 0, valign: "top"
    });

    // Arrow right (not after last in row)
    if (i < 3) {
      slide.addShape(pres.shapes.LINE, {
        x: x + 2.12, y: y + 0.77, w: 0.24, h: 0,
        line: { color: LIGHT_GREEN, width: 2 }
      });
    }
  });

  // Curved indicator: end of row1 → start of row2
  slide.addShape(pres.shapes.LINE, {
    x: 9.57, y: 2.07, w: 0, h: 0.8,
    line: { color: LIGHT_GREEN, width: 2, dashType: "dash" }
  });

  row2.forEach((step, i) => {
    // Reverse order for visual flow (right to left on row2 reads as continuing)
    const x = 0.25 + (2 - i) * 2.38 + 1.43;
    const y = 3.25;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.1, h: 1.55,
      fill: { color: i === 0 ? "e8f5ee" : OFF_WHITE }, shadow: makeShadow(),
      line: { color: i === 0 ? LIGHT_GREEN : LIGHT_GRAY, width: 1 }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.1, h: 0.07,
      fill: { color: i === 0 ? LIGHT_GREEN : MID_GREEN },
      line: { width: 0 }
    });
    slide.addShape(pres.shapes.OVAL, {
      x: x + 0.08, y: y + 0.1, w: 0.34, h: 0.34,
      fill: { color: i === 0 ? LIGHT_GREEN : MID_GREEN },
      line: { width: 0 }
    });
    slide.addText(step.num, {
      x: x + 0.08, y: y + 0.1, w: 0.34, h: 0.34,
      fontSize: 11, color: WHITE, bold: true, align: "center", valign: "middle", margin: 0
    });
    slide.addText(step.title, {
      x: x + 0.05, y: y + 0.5, w: 2.0, h: 0.4,
      fontSize: 11, color: DARK_GREEN, bold: true, margin: 0
    });
    slide.addText(step.desc, {
      x: x + 0.05, y: y + 0.9, w: 2.0, h: 0.55,
      fontSize: 9, color: GRAY_TEXT, margin: 0, valign: "top"
    });

    // Arrow left between row2 steps
    if (i < 2) {
      slide.addShape(pres.shapes.LINE, {
        x: x - 0.26, y: y + 0.77, w: 0.24, h: 0,
        line: { color: LIGHT_GREEN, width: 2 }
      });
    }
  });
}

// ─── SLIDE 5: DATA EXTRACTED ───────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: WHITE };

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.1,
    fill: { color: DARK_GREEN },
    line: { width: 0 }
  });

  slide.addText("Data Extracted Per Invoice", {
    x: 0.5, y: 0.15, w: 9, h: 0.75,
    fontSize: 28, color: WHITE, bold: true, fontFace: "Georgia", margin: 0
  });

  const leftFields = [
    "Vendor Name", "Invoice Number", "Invoice Date",
    "Due Date", "Advertiser", "Description", "Gross Sale"
  ];
  const rightFields = [
    "Discount / Adjustment", "Net Sale", "Commission Rate",
    "Commission Amount", "Payment Terms", "Status", "File Link"
  ];

  [[leftFields, 0.4], [rightFields, 5.1]].forEach(([fields, xStart]) => {
    fields.forEach((field, i) => {
      const y = 1.25 + i * 0.56;
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xStart, y, w: 4.4, h: 0.46,
        fill: { color: i % 2 === 0 ? OFF_WHITE : WHITE },
        line: { color: LIGHT_GRAY, width: 1 }
      });
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xStart, y, w: 0.05, h: 0.46,
        fill: { color: LIGHT_GREEN },
        line: { width: 0 }
      });
      slide.addText(field, {
        x: xStart + 0.15, y: y + 0.02, w: 4.1, h: 0.42,
        fontSize: 12, color: DARK_GREEN, valign: "middle", margin: 0
      });
    });
  });
}

// ─── SLIDE 6: ROUTING OUTCOMES ─────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: WHITE };

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.1,
    fill: { color: DARK_GREEN },
    line: { width: 0 }
  });

  slide.addText("Intelligent Routing", {
    x: 0.5, y: 0.15, w: 9, h: 0.75,
    fontSize: 28, color: WHITE, bold: true, fontFace: "Georgia", margin: 0
  });

  const boxes = [
    {
      label: "Valid Invoice",
      emoji: "✅",
      color: "2d6a4f",
      bgColor: "e8f5ee",
      borderColor: "52b788",
      bullets: [
        "PDF archived to Google Drive",
        "Row added to Invoice Tracker",
        "Auto-reply sent to vendor",
        "Email labeled Processed"
      ]
    },
    {
      label: "Needs Attention",
      emoji: "⚠️",
      color: "7d5a00",
      bgColor: "fff8e1",
      borderColor: "f4a535",
      bullets: [
        "Logged to Needs Attention tab",
        "Alert email sent to team",
        "Labeled for follow-up"
      ]
    },
    {
      label: "Not an Invoice",
      emoji: "❌",
      color: "5a5a5a",
      bgColor: "f5f5f5",
      borderColor: "bbbbbb",
      bullets: [
        "Silently skipped",
        "No action taken"
      ]
    }
  ];

  boxes.forEach((box, i) => {
    const x = 0.3 + i * 3.17;
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.3, w: 3.0, h: 3.9,
      fill: { color: box.bgColor }, shadow: makeShadow(),
      line: { color: box.borderColor, width: 2 }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.3, w: 3.0, h: 0.08,
      fill: { color: box.borderColor },
      line: { width: 0 }
    });
    slide.addText(box.emoji + "  " + box.label, {
      x: x + 0.15, y: 1.4, w: 2.7, h: 0.55,
      fontSize: 14, color: box.color, bold: true, margin: 0
    });
    slide.addShape(pres.shapes.LINE, {
      x: x + 0.15, y: 2.0, w: 2.7, h: 0,
      line: { color: box.borderColor, width: 1 }
    });
    const bulletItems = box.bullets.map((b, bi) => ({
      text: b,
      options: { bullet: true, breakLine: bi < box.bullets.length - 1 }
    }));
    slide.addText(bulletItems, {
      x: x + 0.15, y: 2.1, w: 2.7, h: 2.9,
      fontSize: 12, color: box.color, valign: "top", margin: 0,
      paraSpaceAfter: 6
    });
  });
}

// ─── SLIDE 7: KEY CAPABILITIES ─────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: DARK_GREEN };

  slide.addText("Key Capabilities", {
    x: 0.5, y: 0.25, w: 9, h: 0.7,
    fontSize: 32, color: WHITE, bold: true, fontFace: "Georgia", margin: 0
  });

  const capabilities = [
    { title: "Handles Any Volume", body: "Single invoices or batch PDFs with 50+ invoices processed automatically" },
    { title: "Multi-Page Support", body: "AI reads all pages together as one document, not page by page" },
    { title: "Works With Unknown Vendors", body: "No prior setup required per vendor — works on first invoice" },
    { title: "Auto-Reply to Vendors", body: "Confirms receipt immediately upon successful processing" },
    { title: "Human-in-the-Loop", body: "Incomplete extractions flagged for review — never silently lost" },
    { title: "Full Audit Trail", body: "Every PDF archived in Google Drive with direct link from the tracker" },
  ];

  // 2 columns × 3 rows
  capabilities.forEach((cap, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.35 + col * 4.88;
    const y = 1.15 + row * 1.38;

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 4.5, h: 1.2,
      fill: { color: MID_GREEN },
      line: { color: LIGHT_GREEN, width: 1 }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.06, h: 1.2,
      fill: { color: LIGHT_GREEN },
      line: { width: 0 }
    });
    slide.addText(cap.title, {
      x: x + 0.15, y: y + 0.1, w: 4.2, h: 0.35,
      fontSize: 13, color: WHITE, bold: true, margin: 0
    });
    slide.addText(cap.body, {
      x: x + 0.15, y: y + 0.47, w: 4.2, h: 0.6,
      fontSize: 11, color: OFF_WHITE, margin: 0
    });
  });
}

// ─── SLIDE 8: TECHNOLOGY STACK ─────────────────────────────────────────────────
{
  const slide = pres.addSlide();
  slide.background = { color: WHITE };

  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.1,
    fill: { color: DARK_GREEN },
    line: { width: 0 }
  });

  slide.addText("Technology Stack", {
    x: 0.5, y: 0.15, w: 9, h: 0.75,
    fontSize: 28, color: WHITE, bold: true, fontFace: "Georgia", margin: 0
  });

  const systems = [
    { name: "Gmail", role: "Monitors inbox for incoming invoices", emoji: "📬" },
    { name: "Google Gemini 2.5 Flash", role: "AI that reads and extracts invoice data", emoji: "🤖" },
    { name: "Google Drive", role: "Archives original PDF invoices", emoji: "☁️" },
    { name: "Google Sheets", role: "Central invoice tracking and reporting", emoji: "📊" },
    { name: "n8n", role: "Workflow automation platform", emoji: "⚙️" },
  ];

  systems.forEach((sys, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.5 + col * 3.03;
    const y = 1.35 + row * 2.0;
    const w = 2.7;
    const h = 1.75;

    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h,
      fill: { color: OFF_WHITE }, shadow: makeShadow(),
      line: { color: LIGHT_GRAY, width: 1 }
    });
    slide.addShape(pres.shapes.RECTANGLE, {
      x, y, w, h: 0.07,
      fill: { color: DARK_GREEN },
      line: { width: 0 }
    });
    slide.addText(sys.emoji, {
      x: x + 0.15, y: y + 0.15, w: 0.55, h: 0.55,
      fontSize: 22, margin: 0
    });
    slide.addText(sys.name, {
      x: x + 0.15, y: y + 0.72, w: w - 0.3, h: 0.4,
      fontSize: 12, color: DARK_GREEN, bold: true, margin: 0
    });
    slide.addText(sys.role, {
      x: x + 0.15, y: y + 1.12, w: w - 0.3, h: 0.5,
      fontSize: 10, color: GRAY_TEXT, margin: 0, valign: "top"
    });
  });

  // Bottom tagline
  slide.addText("Powered by n8n + Google AI — zero manual touchpoints for clean invoices", {
    x: 0.5, y: 5.1, w: 9, h: 0.4,
    fontSize: 11, color: GRAY_TEXT, italic: true, align: "center", margin: 0
  });
}

pres.writeFile({ fileName: "C:\\Users\\jleva\\levan-invoice-agent\\Levan Media Invoice Agent - Executive Overview.pptx" })
  .then(() => console.log("✅ Saved successfully"))
  .catch(err => console.error("❌ Error:", err));
