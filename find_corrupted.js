const fs = require('fs');
const buffer = fs.readFileSync('c:\\Users\\91928\\Desktop\\AllProjects\\quiz-app\\src\\locales\\language_translations.js');
const content = buffer.toString('utf8');

for (let i = 0; i < content.length; i++) {
    const charCode = content.charCodeAt(i);
    if (charCode === 0xFFFD) {
        console.log(`Replacement character (U+FFFD) found at index ${i}`);
        // Find line number
        const linesBefore = content.substring(0, i).split('\n');
        console.log(`Line ${linesBefore.length}: ${linesBefore[linesBefore.length - 1]}<-- HERE`);
    }
}
