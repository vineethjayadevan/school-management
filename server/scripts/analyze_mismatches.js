const fs = require('fs');
const path = require('path');

const mismatches = JSON.parse(fs.readFileSync(path.join(__dirname, 'mismatches.json'), 'utf8'));

const summary = {};

mismatches.forEach(m => {
    const key = m.current;
    if (!summary[key]) {
        summary[key] = { count: 0, reason: m.reason, valid: m.validSubcategories || 'N/A' };
    }
    summary[key].count++;
});

console.log('Mismatch Summary:');
console.table(Object.entries(summary).map(([key, val]) => ({
    Current: key,
    Count: val.count,
    Reason: val.reason,
    ValidOptions: val.validOptions
})));

console.log('Unique mismatch keys:', Object.keys(summary));
