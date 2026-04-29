const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\91928\\Desktop\\AllProjects\\quiz-app\\src\\locales\\language_translations.js', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(-10).map((l, i) => `${lines.length - 10 + i + 1}: ${l}`).join('\n'));
