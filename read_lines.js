const fs = require('fs');
const lines = fs.readFileSync('c:\\Users\\91928\\Desktop\\AllProjects\\quiz-app\\src\\locales\\language_translations.js', 'utf8').split('\n');
console.log(lines.slice(490, 520).map((l, i) => `${i + 491}: ${l}`).join('\n'));
