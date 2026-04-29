const fs = require('fs');
const path = 'c:\\Users\\91928\\Desktop\\AllProjects\\quiz-app\\src\\locales\\language_translations.js';
let content = fs.readFileSync(path, 'utf8');

// Add to en.quizzes
content = content.replace('quizzes: {', 'quizzes: {\n      mix: {\n        title: "Mega Mix Challenge",\n        play: "Configure & Play"\n      },');

// Add to hi.quizzes
// First find where hi starts
const hiStart = content.indexOf('hi: {');
const hiQuizzes = content.indexOf('quizzes: {', hiStart);
if (hiQuizzes !== -1) {
    content = content.slice(0, hiQuizzes + 10) + '\n      mix: {\n        title: "मेगा मिक्स चैलेंज",\n        play: "कॉन्फ़िगर करें और खेलें"\n      },' + content.slice(hiQuizzes + 10);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Added mix translations');
