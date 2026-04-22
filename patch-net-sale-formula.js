const fs = require('fs');
const wf = JSON.parse(fs.readFileSync('Levan Media Invoice Agent.json', 'utf8'));

const SPREADSHEET_ID = '1PRCJyXPERk62Q0f95Kjlh62wn_oXF5GwAYZqrQNrx8A';
const SHEETS_CRED = { id: 'zmA3lB23Srv15Wt6', name: 'Google Sheets account' };
const NET_SALE_FORMULA = '=ARRAYFORMULA(IF(ISBLANK(H2:H), "", H2:H-I2:I-L2:L))';

// ── 1. Add the Write Net Sale Formula node ────────────────────────────────────
const writeFormulaNode = {
  name: 'Write Net Sale Formula',
  type: 'n8n-nodes-base.httpRequest',
  typeVersion: 4.4,
  position: [3136, -288],   // takes the old Append position
  id: require('crypto').randomUUID(),
  continueOnFail: true,     // no-op on existing tabs (formula already there)
  parameters: {
    method: 'PUT',
    url: `={{ "https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/" + encodeURIComponent("'" + $('Prepare Advertiser Tab').item.json.advertiserName + "'!J2") + "?valueInputOption=USER_ENTERED" }}`,
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'googleSheetsOAuth2Api',
    sendBody: true,
    specifyBody: 'json',
    jsonBody: JSON.stringify({ values: [[NET_SALE_FORMULA]] }),
    options: {}
  },
  credentials: {
    googleSheetsOAuth2Api: SHEETS_CRED
  }
};

// ── 2. Push Append to Advertiser Tab one slot to the right ────────────────────
const appendNode = wf.nodes.find(n => n.name === 'Append to Advertiser Tab');
if (!appendNode) {
  console.error('❌ Could not find "Append to Advertiser Tab" node');
  process.exit(1);
}
appendNode.position[0] = 3360;

// ── 3. Remove Net Sale from the Append node column mapping ────────────────────
//    Writing to column J would conflict with the ARRAYFORMULA in J2.
const cols = appendNode.parameters.columns;
delete cols.value['Net Sale'];
// Mark it removed in the schema so n8n knows to skip it
const schemaNS = cols.schema.find(s => s.id === 'Net Sale');
if (schemaNS) schemaNS.removed = true;

// ── 4. Insert the new node ────────────────────────────────────────────────────
wf.nodes.push(writeFormulaNode);

// ── 5. Rewire connections ─────────────────────────────────────────────────────
// Was:  Write Advertiser Tab Headers → Append to Advertiser Tab
// Now:  Write Advertiser Tab Headers → Write Net Sale Formula → Append to Advertiser Tab
wf.connections['Write Advertiser Tab Headers'] = {
  main: [[{ node: 'Write Net Sale Formula', type: 'main', index: 0 }]]
};
wf.connections['Write Net Sale Formula'] = {
  main: [[{ node: 'Append to Advertiser Tab', type: 'main', index: 0 }]]
};

fs.writeFileSync('Levan Media Invoice Agent.json', JSON.stringify(wf, null, 2));
console.log('✅ Patch applied successfully');
console.log('  • Added node:  Write Net Sale Formula  (writes ARRAYFORMULA to J2)');
console.log('  • Fixed:       Net Sale removed from Append column mapping (prevents overwriting formula)');
