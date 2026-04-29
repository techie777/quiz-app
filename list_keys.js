const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\91928\\Desktop\\AllProjects\\quiz-app\\src\\locales\\language_translations.js', 'utf8');
const script = content.replace('export const translations =', 'const x =');
const translations = (new Function(script + '; return x;'))();
console.log('EN Keys:', Object.keys(translations.en));
console.log('HI Keys:', Object.keys(translations.hi));
if (translations.hi.quizzes) {
    console.log('HI Quizzes Keys:', Object.keys(translations.hi.quizzes));
}
if (translations.en.quizzes) {
    console.log('EN Quizzes Keys:', Object.keys(translations.en.quizzes));
}
