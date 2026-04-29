const fs = require('fs');
try {
    const content = fs.readFileSync('c:\\Users\\91928\\Desktop\\AllProjects\\quiz-app\\src\\locales\\language_translations.js', 'utf8');
    // Simple way to check if it's valid JS by removing the export
    const script = content.replace('export const translations =', 'global.translations =');
    eval(script);
    console.log('EN Keys:', Object.keys(global.translations.en));
    console.log('HI Keys:', Object.keys(global.translations.hi));
} catch (e) {
    console.error('Error parsing file:', e);
}
