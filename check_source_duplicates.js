const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\91928\\Desktop\\AllProjects\\quiz-app\\src\\locales\\language_translations.js', 'utf8');

function checkTopLevelDuplicates(str, sectionName) {
    const lines = str.split('\n');
    const keys = [];
    lines.forEach(line => {
        // Look for 4 spaces indentation for top-level keys
        const match = line.match(/^    ([a-zA-Z0-9]+):\s+\{/);
        if (match) {
            keys.push(match[1]);
        }
    });
    const counts = {};
    keys.forEach(k => counts[k] = (counts[k] || 0) + 1);
    const duplicates = Object.keys(counts).filter(k => counts[k] > 1);
    if (duplicates.length > 0) {
        console.log(`Top-level duplicates in ${sectionName}:`, duplicates);
    } else {
        console.log(`No top-level duplicates in ${sectionName}`);
    }
}

const hiStart = content.indexOf('hi: {');
const enSection = content.substring(0, hiStart);
const hiSection = content.substring(hiStart);

checkTopLevelDuplicates(enSection, 'English');
checkTopLevelDuplicates(hiSection, 'Hindi');
