const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\91928\\Desktop\\AllProjects\\quiz-app\\src\\locales\\language_translations.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, i) => {
    if (line.includes('en:') || line.includes('hi:')) {
        console.log(`Line ${i + 1}: ${line}`);
    }
});
