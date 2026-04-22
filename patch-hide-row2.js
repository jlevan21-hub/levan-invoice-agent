const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('Levan Media Invoice Agent.json', 'utf8'));

const SPREADSHEET_ID = '1PRCJyXPERk62Q0f95Kjlh62wn_oXF5GwAYZqrQNrx8A';
const SHEETS_CRED = { id: 'zmA3lB23Srv15Wt6', name: 'Google Sheets account' };

// ── 1. Fix position collisions from earlier patches ───────────────────────────
// Append to Advertiser Tab and Reply to Invoice Email are both at [3360, -288]
// New layout (224px spacing per node):
//   Write Net Sale Formula   [3136]  (unchanged)
//   Get Advertiser Sheet ID  [3360]  (new)
//   Extract Sheet ID         [3584]  (new)
//   Hide Row 2               [3808]  (new)
//   Append to Advertiser Tab [4032]  (moved)
//   Reply to Invoice Email   [4256]  (moved)
//   Add processed label      [4480]  (moved)

const reposition = {
  'Append to Advertiser Tab':    [4032, -288],
  'Reply to Invoice Email':      [4256, -288],
  'Add processed label to email':[4480, -288],
};
wf.nodes.forEach(n => {
  if (reposition[n.name]) n.position = reposition[n.name];
});

// ── 2. New nodes ──────────────────────────────────────────────────────────────

const getSheetIdNode = {
  name: 'Get Advertiser Sheet ID',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.4,
  position: [3360, -288],
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
  position: [3584, -288],
  id: require('crypto').randomUUID(),
  parameters: {
    jsCode: `// Find the numeric sheetId for the advertiser tab by matching its title.
// We need this to call updateDimensionProperties (which requires sheetId, not name).
const advertiserName = $('Prepare Advertiser Tab').item.json.advertiserName;
const sheets = $input.first().json.sheets || [];
const match = sheets.find(s => s.properties?.title === advertiserName);
const advertiserSheetId = match?.properties?.sheetId ?? null;

return $input.all().map(item => ({
  json: {
    ...item.json,
    advertiserName,
    advertiserSheetId
  }
}));`
  }
};

const hideRow2Node = {
  name: 'Hide Row 2 on Advertiser Tab',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.4,
  position: [3808, -288],
  id: require('crypto').randomUUID(),
  continueOnFail: true,
  parameters: {
    method: 'POST',
    url: `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`,
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'googleSheetsOAuth2Api',
    sendBody: true,
    specifyBody: 'json',
    // Row indices are 0-based: startIndex 1 = row 2
    jsonBody: `={{ JSON.stringify({
      requests: [{
        updateDimensionProperties: {
          range: {
            sheetId: $json.advertiserSheetId,
            dimension: "ROWS",
            startIndex: 1,
            endIndex: 2
          },
          properties: { hiddenByUser: true },
          fields: "hiddenByUser"
        }
      }]
    }) }}`,
    options: {}
  },
  credentials: { googleSheetsOAuth2Api: SHEETS_CRED }
};

// ── 3. Insert nodes ───────────────────────────────────────────────────────────
wf.nodes.push(getSheetIdNode, extractSheetIdNode, hideRow2Node);

// ── 4. Rewire connections ─────────────────────────────────────────────────────
// Was:  Write Net Sale Formula → Append to Advertiser Tab
// Now:  Write Net Sale Formula → Get Advertiser Sheet ID → Extract Sheet ID
//                              → Hide Row 2 → Append to Advertiser Tab
wf.connections['Write Net Sale Formula'] = {
  main: [[{ node: 'Get Advertiser Sheet ID', type: 'main', index: 0 }]]
};
wf.connections['Get Advertiser Sheet ID'] = {
  main: [[{ node: 'Extract Sheet ID', type: 'main', index: 0 }]]
};
wf.connections['Extract Sheet ID'] = {
  main: [[{ node: 'Hide Row 2 on Advertiser Tab', type: 'main', index: 0 }]]
};
wf.connections['Hide Row 2 on Advertiser Tab'] = {
  main: [[{ node: 'Append to Advertiser Tab', type: 'main', index: 0 }]]
};

fs.writeFileSync('Levan Media Invoice Agent.json', JSON.stringify(wf, null, 2));
console.log('✅ Patch applied');
console.log('  • Fixed position collision between Append and Reply nodes');
console.log('  • Added: Get Advertiser Sheet ID');
console.log('  • Added: Extract Sheet ID');
console.log('  • Added: Hide Row 2 on Advertiser Tab');
