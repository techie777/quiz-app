const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\91928\\Desktop\\AllProjects\\quiz-app\\src\\locales\\language_translations.js', 'utf8');

function findDuplicateKeys(obj, path = '') {
    const keys = new Set();
    const duplicates = [];
    
    // This is hard to do with a string because of nesting
    // I'll try a regex approach for each level or just use the node parser
}

// Actually, I'll just use a more robust way to check for syntax errors
try {
    const script = content.replace('export const translations =', 'const x =');
    // Using Function to avoid eval scope issues
    new Function(script + '; return x;');
    console.log('No syntax errors found by Function constructor');
} catch (e) {
    console.error('Syntax error detected:', e.message);
    // Try to find the line number
    const match = e.stack.match(/<anonymous>:(\d+):(\d+)/);
    if (match) {
        console.log(`Likely error around line ${match[1]}`);
    }
}
