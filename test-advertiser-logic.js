// ── Simulates the data that comes out of "Append or update row in sheet"
// This is what the advertiser tab nodes will receive as input.
// Run with: node test-advertiser-logic.js

const SAMPLE_SHEETS_OUTPUT = [
  { 'Invoice Number': 'INV-001', 'Vendor Name': 'Fox 5', 'Advertiser': 'Nike',                    'Gross Sale': 5000, 'Discount/Adjustment': 750,  'Commission Amount': 750,  'File Link': 'https://drive.google.com/file/a', 'Status': 'Pending Review' },
  { 'Invoice Number': 'INV-002', 'Vendor Name': 'NBC',   'Advertiser': 'Nike',                    'Gross Sale': 3000, 'Discount/Adjustment': 450,  'Commission Amount': 450,  'File Link': 'https://drive.google.com/file/b', 'Status': 'Pending Review' },
  { 'Invoice Number': 'INV-003', 'Vendor Name': 'Fox 5', 'Advertiser': 'Laytons Enchanted Gardens (G0658)', 'Gross Sale': 8000, 'Discount/Adjustment': 1200, 'Commission Amount': 1200, 'File Link': 'https://drive.google.com/file/c', 'Status': 'Pending Review' },
  { 'Invoice Number': 'INV-004', 'Vendor Name': 'CBS',   'Advertiser': 'Laytons Enchanted Gardens (G0658)', 'Gross Sale': 2500, 'Discount/Adjustment': 375,  'Commission Amount': 375,  'File Link': 'https://drive.google.com/file/d', 'Status': 'Pending Review' },
  { 'Invoice Number': 'INV-005', 'Vendor Name': 'ABC',   'Advertiser': 'Acme Corp',               'Gross Sale': 4000, 'Discount/Adjustment': 600,  'Commission Amount': 600,  'File Link': 'https://drive.google.com/file/e', 'Status': 'Pending Review' },
  // Edge cases
  { 'Invoice Number': 'INV-006', 'Vendor Name': 'Fox 5', 'Advertiser': '',                        'Gross Sale': 1000, 'Discount/Adjustment': 150,  'Commission Amount': 150,  'File Link': 'https://drive.google.com/file/f', 'Status': 'Pending Review' },
  { 'Invoice Number': 'INV-007', 'Vendor Name': 'NBC',   'Advertiser': 'Nike',                    'Gross Sale': 6000, 'Discount/Adjustment': 900,  'Commission Amount': 900,  'File Link': 'https://drive.google.com/file/g', 'Status': 'Pending Review' },
];

// ── Shared sanitize function (same in both nodes) ─────────────────────────────
function sanitize(name) {
  return (name || 'Unknown Advertiser')
    .replace(/[[\]*?:/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100) || 'Unknown Advertiser';
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 1: "Deduplicate by Advertiser" node
// Input:  all invoice items (one per invoice)
// Output: ONE item per unique advertiser (for tab setup)
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n══ TEST 1: Deduplicate by Advertiser ══════════════════════════════');
console.log('Input:  ' + SAMPLE_SHEETS_OUTPUT.length + ' invoice items');

const seen = new Set();
const deduped = SAMPLE_SHEETS_OUTPUT
  .map(item => ({ json: { ...item, advertiserName: sanitize(item['Advertiser']) } }))
  .filter(item => {
    if (seen.has(item.json.advertiserName)) return false;
    seen.add(item.json.advertiserName);
    return true;
  });

console.log('Output: ' + deduped.length + ' unique advertiser items');
deduped.forEach((item, i) => {
  console.log('  [' + i + '] advertiserName = "' + item.json.advertiserName + '"');
});

const EXPECTED_UNIQUE = ['Nike', 'Laytons Enchanted Gardens (G0658)', 'Acme Corp', 'Unknown Advertiser'];
const PASS_1 = deduped.length === EXPECTED_UNIQUE.length &&
  deduped.every((item, i) => item.json.advertiserName === EXPECTED_UNIQUE[i]);
console.log(PASS_1 ? '✅ PASS' : '❌ FAIL — expected: ' + JSON.stringify(EXPECTED_UNIQUE));

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 2: "Expand All Invoices" node
// Input:  N unique advertiser items (after tab setup ran once per advertiser)
// Output: ALL invoice items re-expanded, each with advertiserName attached
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n══ TEST 2: Expand All Invoices ════════════════════════════════════');
console.log('Input:  ' + deduped.length + ' deduplicated items (from prior step)');
console.log('        (references $("Append or update row in sheet") for full list)');

// Simulates referencing $('Append or update row in sheet').all()
const expanded = SAMPLE_SHEETS_OUTPUT.map(item => ({
  json: { ...item, advertiserName: sanitize(item['Advertiser']) }
}));

console.log('Output: ' + expanded.length + ' invoice items');
expanded.forEach((item, i) => {
  console.log('  [' + i + '] ' + item.json['Invoice Number'] +
    ' → tab "' + item.json.advertiserName + '"');
});

const PASS_2 = expanded.length === SAMPLE_SHEETS_OUTPUT.length &&
  expanded.every(item => item.json.advertiserName !== undefined);
console.log(PASS_2 ? '✅ PASS' : '❌ FAIL — count or advertiserName missing');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 3: API call counts (the quota problem we're solving)
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n══ TEST 3: API Call Counts ════════════════════════════════════════');
const invoiceCount = SAMPLE_SHEETS_OUTPUT.length;
const uniqueCount  = deduped.length;

console.log('Invoices in batch:         ' + invoiceCount);
console.log('Unique advertisers:        ' + uniqueCount);
console.log('');
console.log('OLD (every node ran per invoice):');
console.log('  Create Tab calls:        ' + invoiceCount + '  ← caused quota error');
console.log('  Write Headers calls:     ' + invoiceCount);
console.log('  Write Formula calls:     ' + invoiceCount);
console.log('  Get Sheet ID calls:      ' + invoiceCount);
console.log('  Hide Row 2 calls:        ' + invoiceCount);
console.log('  Append calls:            ' + invoiceCount);
console.log('  TOTAL Sheets API calls:  ' + (invoiceCount * 6));
console.log('');
console.log('NEW (setup per advertiser, append per invoice):');
console.log('  Create Tab calls:        ' + uniqueCount);
console.log('  Write Headers calls:     ' + uniqueCount);
console.log('  Write Formula calls:     ' + uniqueCount);
console.log('  Get Sheet ID calls:      ' + uniqueCount);
console.log('  Hide Row 2 calls:        ' + uniqueCount);
console.log('  Append calls:            ' + invoiceCount);
console.log('  TOTAL Sheets API calls:  ' + (uniqueCount * 5 + invoiceCount));
const reduction = Math.round((1 - (uniqueCount * 5 + invoiceCount) / (invoiceCount * 6)) * 100);
console.log('  Reduction:               ~' + reduction + '%');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST 4: Sanitize edge cases
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n══ TEST 4: Sanitize Edge Cases ════════════════════════════════════');
const cases = [
  { input: 'Nike',                            expected: 'Nike' },
  { input: '',                                expected: 'Unknown Advertiser' },
  { input: null,                              expected: 'Unknown Advertiser' },
  { input: 'Laytons Enchanted Gardens (G0658)', expected: 'Laytons Enchanted Gardens (G0658)' },
  { input: 'Test/Client:Name',                expected: 'Test Client Name' },
  { input: 'A'.repeat(120),                   expected: 'A'.repeat(100) },
  { input: '   Trimmed   ',                   expected: 'Trimmed' },
];
let allPass = true;
cases.forEach(({ input, expected }) => {
  const result = sanitize(input);
  const pass = result === expected;
  if (!pass) allPass = false;
  console.log((pass ? '  ✅' : '  ❌') + ' sanitize(' + JSON.stringify(input) + ') = ' + JSON.stringify(result));
  if (!pass) console.log('      expected: ' + JSON.stringify(expected));
});
console.log(allPass ? '✅ ALL PASS' : '❌ SOME FAILED');

console.log('\n══ Summary ════════════════════════════════════════════════════════');
console.log(PASS_1 && PASS_2 && allPass ? '✅ All tests passed — safe to rebuild workflow' : '❌ Fix failures above before rebuilding');
