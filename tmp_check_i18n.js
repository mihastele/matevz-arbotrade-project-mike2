const fs = require('fs');
const path = require('path');
const keys = fs.readFileSync(path.join(__dirname, 'frontend_i18n_keys.txt'), 'utf8').split('\n').filter(Boolean);
function makeModule(srcPath, tmp) {
    let src = fs.readFileSync(srcPath, 'utf8');
    src = src.replace(/export\s+default\s+/, 'module.exports = ');
    fs.writeFileSync(tmp, src, 'utf8');
}
makeModule('frontend/src/i18n/locales/sl.ts', '/tmp/sl_tmp.js');
makeModule('frontend/src/i18n/locales/en.ts', '/tmp/en_tmp.js');
let sl, en;
try {
    sl = require('/tmp/sl_tmp.js');
} catch (e) {
    console.error('Failed to load sl locale:', e && e.message);
    process.exit(1);
}
try {
    en = require('/tmp/en_tmp.js');
} catch (e) {
    console.error('Failed to load en locale:', e && e.message);
    process.exit(1);
}
function hasKey(obj, path) {
    const parts = path.split('.');
    let cur = obj;
    for (const p of parts) {
        if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
        else return false;
    }
    return true;
}
const missingSl = [];
const missingEn = [];
const keyRegex = /^[a-z0-9_\.]+$/i;
const filteredKeys = keys.filter(k => keyRegex.test(k));
for (const k of filteredKeys) {
    if (!hasKey(sl, k)) missingSl.push(k);
    if (!hasKey(en, k)) missingEn.push(k);
}
console.log('Checked ' + filteredKeys.length + ' valid keys (filtered from ' + keys.length + ').');
console.log('MISSING in sl (' + missingSl.length + '):\n' + missingSl.join('\n') + '\n\nMISSING in en (' + missingEn.length + '):\n' + missingEn.join('\n'));
