// Rebuilds the advertiser tab feature with the correct architecture:
//
//  "Append or update row in sheet"
//       │
//       ├─► Reply to Invoice Email ─► Add processed label  (existing, restored)
//       │
//       └─► Deduplicate by Advertiser  (1 item per unique advertiser)
//                │
//                ▼  (setup runs ONCE per advertiser)
//           Create Advertiser Tab
//                │
//           Write Advertiser Tab Headers
//                │
//           Write Net Sale Formula
//                │
//           Get Advertiser Sheet ID
//                │
//           Extract Sheet ID
//                │
//           Hide Row 2 on Advertiser Tab
//                │
//           Expand All Invoices  (re-expands back to ALL invoice items)
//                │
//           Append to Advertiser Tab  (runs once per invoice)

const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('Levan Media Invoice Agent.json', 'utf8'));

const SPREADSHEET_ID = '1PRCJyXPERk62Q0f95Kjlh62wn_oXF5GwAYZqrQNrx8A';
const SHEETS_CRED    = { id: 'zmA3lB23Srv15Wt6', name: 'Google Sheets account' };
const HEADERS = [
  'Date Received','Vendor Name','Invoice Number','Invoice Date','Due Date',
  'Advertiser','Description','Gross Sale','Discount/Adjustment','Net Sale',
  'Commission Rate','Commission Amount','Payment Terms','Status',
  'File Link','Sender Email','Confidence'
];
const NET_SALE_FORMULA = '=ARRAYFORMULA(IF(ISBLANK(H2:H), "", H2:H-I2:I-L2:L))';

// ── STEP 1: Remove all old advertiser tab nodes ───────────────────────────────
const NODES_TO_REMOVE = [
  'Prepare Advertiser Tab',
  'Create Advertiser Tab',
  'Write Advertiser Tab Headers',
  'Write Net Sale Formula',
  'Get Advertiser Sheet ID',
  'Extract Sheet ID',
  'Hide Row 2 on Advertiser Tab',
  'Append to Advertiser Tab',
];
wf.nodes = wf.nodes.filter(n => !NODES_TO_REMOVE.includes(n.name));
NODES_TO_REMOVE.forEach(name => delete wf.connections[name]);
console.log('Removed ' + NODES_TO_REMOVE.length + ' old nodes');

// ── STEP 2: Restore Reply to Invoice Email to its original position ───────────
const replyNode = wf.nodes.find(n => n.name === 'Reply to Invoice Email');
const addLabelNode = wf.nodes.find(n => n.name === 'Add processed label to email');
if (replyNode)    replyNode.position    = [2464, -288];
if (addLabelNode) addLabelNode.position = [2688, -288];

// ── STEP 3: Restore the direct Append → Reply connection ─────────────────────
wf.connections['Append or update row in sheet'] = {
  main: [[{ node: 'Reply to Invoice Email', type: 'main', index: 0 }]]
};

// ── STEP 4: Define new nodes ─────────────────────────────────────────────────
// Branch runs parallel to Reply — both receive output from "Append or update row in sheet"
// New branch sits below the main flow (y = 100)

const Y = 100;  // y-position for the new advertiser tab branch

const deduplicateNode = {
  name: 'Deduplicate by Advertiser',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [2464, Y],
  id: require('crypto').randomUUID(),
  parameters: {
    jsCode: `// Returns ONE item per unique advertiser.
// The tab setup nodes (Create, Headers, Formula, Hide) run on these
// deduplicated items so they only fire once per advertiser, not once per invoice.
function sanitize(name) {
  return (name || 'Unknown Advertiser')
    .replace(/[\\[\\]*?:\\/\\\\]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim()
    .substring(0, 100) || 'Unknown Advertiser';
}

const seen = new Set();
return $input.all()
  .map(item => ({
    json: { ...item.json, advertiserName: sanitize(item.json['Advertiser'] || '') }
  }))
  .filter(item => {
    if (seen.has(item.json.advertiserName)) return false;
    seen.add(item.json.advertiserName);
    return true;
  });`
  }
};

const createTabNode = {
  name: 'Create Advertiser Tab',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.4,
  position: [2688, Y],
  id: require('crypto').randomUUID(),
  continueOnFail: true,
  parameters: {
    method: 'POST',
    url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'googleSheetsOAuth2Api',
    sendBody: true,
    specifyBody: 'json',
    jsonBody: `={{ JSON.stringify({ requests: [{ addSheet: { properties: { title: $json.advertiserName } } }] }) }}`,
    options: {}
  },
  credentials: { googleSheetsOAuth2Api: SHEETS_CRED }
};

const writeHeadersNode = {
  name: 'Write Advertiser Tab Headers',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.4,
  position: [2912, Y],
  id: require('crypto').randomUUID(),
  continueOnFail: true,
  parameters: {
    method: 'PUT',
    url: `={{ "https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/" + encodeURIComponent("'" + $json.advertiserName + "'!A1:Q1") + "?valueInputOption=USER_ENTERED" }}`,
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'googleSheetsOAuth2Api',
    sendBody: true,
    specifyBody: 'json',
    jsonBody: JSON.stringify({ values: [HEADERS] }),
    options: {}
  },
  credentials: { googleSheetsOAuth2Api: SHEETS_CRED }
};

const writeFormulaNode = {
  name: 'Write Net Sale Formula',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.4,
  position: [3136, Y],
  id: require('crypto').randomUUID(),
  continueOnFail: true,
  parameters: {
    method: 'PUT',
    url: `={{ "https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/" + encodeURIComponent("'" + $json.advertiserName + "'!J2") + "?valueInputOption=USER_ENTERED" }}`,
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'googleSheetsOAuth2Api',
    sendBody: true,
    specifyBody: 'json',
    jsonBody: JSON.stringify({ values: [[NET_SALE_FORMULA]] }),
    options: {}
  },
  credentials: { googleSheetsOAuth2Api: SHEETS_CRED }
};

const getSheetIdNode = {
  name: 'Get Advertiser Sheet ID',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.4,
  position: [3360, Y],
  id: require('crypto').randomUUID(),
  continueOnFail: true,
  parameters: {
    method: 'GET',
    url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties(sheetId,title)`,
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'googleSheetsOAuth2Api',
    options: {}
  },
  credentials: { googleSheetsOAuth2Api: SHEETS_CRED }
};

const extractSheetIdNode = {
  name: 'Extract Sheet ID',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [3584, Y],
  id: require('crypto').randomUUID(),
  parameters: {
    jsCode: `// Find the numeric sheetId for the advertiser tab.
// Required by updateDimensionProperties (which uses sheetId, not title).
const advertiserName = $json.advertiserName;
const sheets = $input.first().json.sheets || [];
const match = sheets.find(s => s.properties?.title === advertiserName);
const advertiserSheetId = match?.properties?.sheetId ?? null;

return $input.all().map(item => ({
  json: { ...item.json, advertiserName, advertiserSheetId }
}));`
  }
};

const hideRow2Node = {
  name: 'Hide Row 2 on Advertiser Tab',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.4,
  position: [3808, Y],
  id: require('crypto').randomUUID(),
  continueOnFail: true,
  parameters: {
    method: 'POST',
    url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'googleSheetsOAuth2Api',
    sendBody: true,
    specifyBody: 'json',
    jsonBody: `={{ JSON.stringify({ requests: [{ updateDimensionProperties: { range: { sheetId: $json.advertiserSheetId, dimension: "ROWS", startIndex: 1, endIndex: 2 }, properties: { hiddenByUser: true }, fields: "hiddenByUser" } }] }) }}`,
    options: {}
  },
  credentials: { googleSheetsOAuth2Api: SHEETS_CRED }
};

const expandInvoicesNode = {
  name: 'Expand All Invoices',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [4032, Y],
  id: require('crypto').randomUUID(),
  parameters: {
    jsCode: `// Tab setup is done. Now re-expand to ALL invoice items so we can
// append each one to its advertiser tab.
// We reference the Sheets output (which has all column values + Advertiser).
function sanitize(name) {
  return (name || 'Unknown Advertiser')
    .replace(/[\\[\\]*?:\\/\\\\]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim()
    .substring(0, 100) || 'Unknown Advertiser';
}

const sheetsItems = $('Append or update row in sheet').all();
return sheetsItems.map(item => ({
  json: {
    ...item.json,
    advertiserName: sanitize(item.json['Advertiser'] || '')
  }
}));`
  }
};

const appendAdvertiserNode = {
  name: 'Append to Advertiser Tab',
  type: 'n8n-nodes-base.googleSheets',
  typeVersion: 4.7,
  position: [4256, Y],
  id: require('crypto').randomUUID(),
  parameters: {
    operation: 'appendOrUpdate',
    documentId: { __rl: true, value: SPREADSHEET_ID, mode: 'id' },
    sheetName: {
      __rl: true,
      value: '={{ $json.advertiserName }}',
      mode: 'name'
    },
    columns: {
      mappingMode: 'defineBelow',
      value: {
        'Invoice Number':      '={{ $json["Invoice Number"] }}',
        'Date Received':       '={{ $json["Date Received"] }}',
        'Vendor Name':         '={{ $json["Vendor Name"] }}',
        'Invoice Date':        '={{ $json["Invoice Date"] }}',
        'Due Date':            '={{ $json["Due Date"] }}',
        'Advertiser':          '={{ $json["Advertiser"] }}',
        'Description':         '={{ $json["Description"] }}',
        'Gross Sale':          '={{ $json["Gross Sale"] }}',
        'Discount/Adjustment': '={{ $json["Discount/Adjustment"] }}',
        // Net Sale intentionally omitted — handled by ARRAYFORMULA in J2
        'Commission Rate':     "==IFERROR(VLOOKUP(B2,'Commission Schedule'!A:B,2,FALSE),0.15)",
        'Commission Amount':   '={{ $json["Commission Amount"] }}',
        'Payment Terms':       '={{ $json["Payment Terms"] }}',
        'Status':              '={{ $json["Status"] }}',
        'File Link':           '={{ $json["File Link"] }}',
        'Sender Email':        '={{ $json["Sender Email"] }}',
        'Confidence':          '={{ $json["Confidence"] }}'
      },
      matchingColumns: ['Invoice Number'],
      schema: HEADERS.filter(h => h !== 'Net Sale').map(h => ({
        id: h, displayName: h, required: false, defaultMatch: false,
        display: true, type: 'string', canBeUsedToMatch: true
      })),
      attemptToConvertTypes: false,
      convertFieldsToString: false
    },
    options: { cellFormat: 'USER_ENTERED' }
  },
  credentials: { googleSheetsOAuth2Api: SHEETS_CRED }
};

// ── STEP 5: Insert new nodes ──────────────────────────────────────────────────
wf.nodes.push(
  deduplicateNode, createTabNode, writeHeadersNode, writeFormulaNode,
  getSheetIdNode, extractSheetIdNode, hideRow2Node,
  expandInvoicesNode, appendAdvertiserNode
);

// ── STEP 6: Wire new branch connections ──────────────────────────────────────
// "Append or update row in sheet" now fans out to BOTH branches
wf.connections['Append or update row in sheet'].main[0].push(
  { node: 'Deduplicate by Advertiser', type: 'main', index: 0 }
);

wf.connections['Deduplicate by Advertiser']       = { main: [[{ node: 'Create Advertiser Tab',           type: 'main', index: 0 }]] };
wf.connections['Create Advertiser Tab']            = { main: [[{ node: 'Write Advertiser Tab Headers',    type: 'main', index: 0 }]] };
wf.connections['Write Advertiser Tab Headers']     = { main: [[{ node: 'Write Net Sale Formula',          type: 'main', index: 0 }]] };
wf.connections['Write Net Sale Formula']           = { main: [[{ node: 'Get Advertiser Sheet ID',         type: 'main', index: 0 }]] };
wf.connections['Get Advertiser Sheet ID']          = { main: [[{ node: 'Extract Sheet ID',                type: 'main', index: 0 }]] };
wf.connections['Extract Sheet ID']                 = { main: [[{ node: 'Hide Row 2 on Advertiser Tab',    type: 'main', index: 0 }]] };
wf.connections['Hide Row 2 on Advertiser Tab']     = { main: [[{ node: 'Expand All Invoices',             type: 'main', index: 0 }]] };
wf.connections['Expand All Invoices']              = { main: [[{ node: 'Append to Advertiser Tab',        type: 'main', index: 0 }]] };

// ── STEP 7: Save ──────────────────────────────────────────────────────────────
fs.writeFileSync('Levan Media Invoice Agent.json', JSON.stringify(wf, null, 2));
console.log('\n✅ Rebuild complete');

// ── STEP 8: Verify ────────────────────────────────────────────────────────────
const saved = JSON.parse(fs.readFileSync('Levan Media Invoice Agent.json', 'utf8'));

// Branch 1: Reply chain
let cur = 'Append or update row in sheet';
const replyChain = [];
while (cur) {
  replyChain.push(cur);
  cur = saved.connections[cur]?.main?.[0]?.[0]?.node;
}
console.log('\nBranch 1 (Reply):');
replyChain.forEach((n, i) => console.log('  ' + (i+1) + '. ' + n));

// Branch 2: Advertiser tab chain
const branch2Start = saved.connections['Append or update row in sheet']?.main?.[0]?.[1]?.node;
let cur2 = branch2Start;
const tabChain = [];
const vis = new Set();
while (cur2 && !vis.has(cur2)) {
  vis.add(cur2);
  tabChain.push(cur2);
  cur2 = saved.connections[cur2]?.main?.[0]?.[0]?.node;
}
console.log('\nBranch 2 (Advertiser Tabs):');
tabChain.forEach((n, i) => console.log('  ' + (i+1) + '. ' + n));

console.log('\nTotal nodes: ' + saved.nodes.length);
