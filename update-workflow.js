const fs = require('fs');
const { v4: uuidv4 } = require('crypto').webcrypto ?
  require('crypto') : { v4: () => require('crypto').randomUUID() };

const wf = JSON.parse(fs.readFileSync('Levan Media Invoice Agent.json', 'utf8'));

const SPREADSHEET_ID = '1PRCJyXPERk62Q0f95Kjlh62wn_oXF5GwAYZqrQNrx8A';
const SHEETS_CRED = { id: 'zmA3lB23Srv15Wt6', name: 'Google Sheets account' };

const HEADERS = [
  'Date Received','Vendor Name','Invoice Number','Invoice Date','Due Date',
  'Advertiser','Description','Gross Sale','Discount/Adjustment','Net Sale',
  'Commission Rate','Commission Amount','Payment Terms','Status',
  'File Link','Sender Email','Confidence'
];

// ── New node definitions ─────────────────────────────────────────────────────

const prepareNode = {
  name: 'Prepare Advertiser Tab',
  type: 'n8n-nodes-base.code',
  typeVersion: 2,
  position: [2464, -288],
  id: require('crypto').randomUUID(),
  parameters: {
    jsCode: `// Sanitize advertiser name for use as a Google Sheets tab name.
// Sheet tab rules: max 100 chars, no [ ] * ? : / \\
return $input.all().map((item, i) => {
  const parseItem = $('Parse & Validate').all()[i];
  const advertiserRaw = parseItem?.json?.row?.Advertiser || 'Unknown Advertiser';
  const advertiserName = advertiserRaw
    .replace(/[\\[\\]*?:\\/\\\\]/g, ' ')
    .replace(/\\s+/g, ' ')
    .trim()
    .substring(0, 100) || 'Unknown Advertiser';
  return {
    json: {
      ...item.json,
      advertiserName
    }
  };
});`
  }
};

const createTabNode = {
  name: 'Create Advertiser Tab',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.4,
  position: [2688, -288],
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
  credentials: {
    googleSheetsOAuth2Api: SHEETS_CRED
  }
};

const writeHeadersNode = {
  name: 'Write Advertiser Tab Headers',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.4,
  position: [2912, -288],
  id: require('crypto').randomUUID(),
  continueOnFail: true,
  parameters: {
    method: 'PUT',
    url: `={{ "https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/" + encodeURIComponent("'" + $('Prepare Advertiser Tab').item.json.advertiserName + "'!A1:Q1") + "?valueInputOption=USER_ENTERED" }}`,
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'googleSheetsOAuth2Api',
    sendBody: true,
    specifyBody: 'json',
    jsonBody: JSON.stringify({ values: [HEADERS] }),
    options: {}
  },
  credentials: {
    googleSheetsOAuth2Api: SHEETS_CRED
  }
};

const appendAdvertiserNode = {
  name: 'Append to Advertiser Tab',
  type: 'n8n-nodes-base.googleSheets',
  typeVersion: 4.7,
  position: [3136, -288],
  id: require('crypto').randomUUID(),
  parameters: {
    operation: 'appendOrUpdate',
    documentId: {
      __rl: true,
      value: SPREADSHEET_ID,
      mode: 'id'
    },
    sheetName: {
      __rl: true,
      value: "={{ $('Prepare Advertiser Tab').item.json.advertiserName }}",
      mode: 'name'
    },
    columns: {
      mappingMode: 'defineBelow',
      value: {
        'Invoice Number': "={{ $('Parse & Validate').all()[$itemIndex].json.row['Invoice Number'] }}",
        'Date Received': "={{ $('Parse & Validate').all()[$itemIndex].json.row['Date Received'] }}",
        'Vendor Name': "={{ $('Parse & Validate').all()[$itemIndex].json.row['Vendor Name'] }}",
        'Invoice Date': "={{ $('Parse & Validate').all()[$itemIndex].json.row['Invoice Date'] }}",
        'Due Date': "={{ $('Parse & Validate').all()[$itemIndex].json.row['Due Date'] }}",
        'Advertiser': "={{ $('Parse & Validate').all()[$itemIndex].json.row['Advertiser'] }}",
        'Description': "={{ $('Parse & Validate').all()[$itemIndex].json.row.Description }}",
        'Gross Sale': "={{ $('Parse & Validate').all()[$itemIndex].json.row['Gross Sale'] }}",
        'Discount/Adjustment': "={{ $('Parse & Validate').all()[$itemIndex].json.row['Discount/Adjustment'] }}",
        'Net Sale': "={{ $('Parse & Validate').all()[$itemIndex].json.row['Net Sale'] }}",
        'Commission Rate': '==IFERROR(VLOOKUP(B2,\'Commission Schedule\'!A:B,2,FALSE),0.15)',
        'Commission Amount': "={{ $('Parse & Validate').all()[$itemIndex].json.row['Discount/Adjustment'] }}",
        'Payment Terms': "={{ $('Parse & Validate').all()[$itemIndex].json.row['Payment Terms'] }}",
        'Status': "={{ $('Parse & Validate').all()[$itemIndex].json.row.Status }}",
        'File Link': "={{ $json.webViewLink }}",
        'Sender Email': "={{ $('Parse & Validate').all()[$itemIndex].json.row['Sender Email'] }}",
        'Confidence': "={{ $('Parse & Validate').all()[$itemIndex].json.row.Confidence }}"
      },
      matchingColumns: ['Invoice Number'],
      schema: HEADERS.map(h => ({
        id: h,
        displayName: h,
        required: false,
        defaultMatch: false,
        display: true,
        type: 'string',
        canBeUsedToMatch: true
      })),
      attemptToConvertTypes: false,
      convertFieldsToString: false
    },
    options: {
      cellFormat: 'USER_ENTERED'
    }
  },
  credentials: {
    googleSheetsOAuth2Api: SHEETS_CRED
  }
};

// ── Shift existing downstream nodes to make room ─────────────────────────────
const nodesToShift = ['Reply to Invoice Email', 'Add processed label to email'];
wf.nodes.forEach(n => {
  if (nodesToShift.includes(n.name)) {
    n.position[0] += 896; // shift right by 4 node-widths
  }
});

// ── Insert new nodes ──────────────────────────────────────────────────────────
wf.nodes.push(prepareNode, createTabNode, writeHeadersNode, appendAdvertiserNode);

// ── Update connections ────────────────────────────────────────────────────────
// Remove: Append or update row in sheet → Reply to Invoice Email
wf.connections['Append or update row in sheet'].main[0] =
  wf.connections['Append or update row in sheet'].main[0].filter(
    c => c.node !== 'Reply to Invoice Email'
  );

// Add: Append or update row in sheet → Prepare Advertiser Tab
wf.connections['Append or update row in sheet'].main[0].push(
  { node: 'Prepare Advertiser Tab', type: 'main', index: 0 }
);

// Add remaining chain
wf.connections['Prepare Advertiser Tab'] = {
  main: [[{ node: 'Create Advertiser Tab', type: 'main', index: 0 }]]
};
wf.connections['Create Advertiser Tab'] = {
  main: [[{ node: 'Write Advertiser Tab Headers', type: 'main', index: 0 }]]
};
wf.connections['Write Advertiser Tab Headers'] = {
  main: [[{ node: 'Append to Advertiser Tab', type: 'main', index: 0 }]]
};
wf.connections['Append to Advertiser Tab'] = {
  main: [[{ node: 'Reply to Invoice Email', type: 'main', index: 0 }]]
};

fs.writeFileSync('Levan Media Invoice Agent.json', JSON.stringify(wf, null, 2));
console.log('✅ Workflow updated successfully');
console.log('New nodes added:');
console.log('  • Prepare Advertiser Tab');
console.log('  • Create Advertiser Tab');
console.log('  • Write Advertiser Tab Headers');
console.log('  • Append to Advertiser Tab');
