import fs from 'node:fs';
import path from 'node:path';

const APP_CONFIG_PATH = path.resolve('app-config.json');
const DIST_PATH = path.resolve('dist');
const ASSETS_PATH = path.join(DIST_PATH, 'assets');

function sync() {
    console.log('--- Starting Custom Asset Sync ---');

    if (!fs.existsSync(APP_CONFIG_PATH)) {
        console.error('Error: app-config.json not found in root.');
        return;
    }

    // Read current config
    const config = JSON.parse(fs.readFileSync(APP_CONFIG_PATH, 'utf-8'));

    // Find assets in dist
    const files = fs.readdirSync(DIST_PATH);
    const jsFiles = files.filter(f => f.endsWith('.js') && f !== 'inline.js' && f !== 'sync-config.js' && f !== 'sw.js');
    const cssFiles = files.filter(f => f.endsWith('.css'));
    const assetFiles = files.filter(f => !f.endsWith('.js') && !f.endsWith('.css') && f !== 'index.html' && f !== 'app-config.json');

    console.log('Found JS assets:', jsFiles);
    console.log('Found CSS assets:', cssFiles);

    // 1. Generate dist/inline.js (ZMP needs this for meta tags)
    const inlineJSContent = `document.head.innerHTML += \`<meta charset="UTF-8"/>\`;
document.head.innerHTML += \`<meta name="viewport" content="width=device-width, initial-scale=1.0"/>\`;
`;
    const inlineJSPath = path.join(DIST_PATH, 'inline.js');
    fs.writeFileSync(inlineJSPath, inlineJSContent);
    console.log('Generated dist/inline.js');

    // 2. Update config
    // Ensure "inline.js" is the first item in listSyncJS
    config.listSyncJS = Array.from(new Set(['inline.js', ...jsFiles]));
    config.listCSS = Array.from(new Set(cssFiles));
    config.listAsyncJS = [];

    // Write back to root app-config.json
    fs.writeFileSync(APP_CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log('Updated app-config.json in root.');

    // Also update dist/app-config.json if it exists
    const distConfigPath = path.join(DIST_PATH, 'app-config.json');
    if (fs.existsSync(distConfigPath)) {
        fs.writeFileSync(distConfigPath, JSON.stringify(config, null, 2));
        console.log('Updated app-config.json in dist.');
    }

    console.log('--- Sync Completed Successfully ---');
}

sync();
