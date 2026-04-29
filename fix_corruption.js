const fs = require('fs');
const path = 'c:\\Users\\91928\\Desktop\\AllProjects\\quiz-app\\src\\locales\\language_translations.js';
let content = fs.readFileSync(path, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');
const lines = content.split('\n');

// Find hi section
const hiStart = lines.findIndex(l => l.includes('hi: {'));
if (hiStart === -1) {
    console.log('Could not find hi section');
    process.exit(1);
}

// Search for govtExams AFTER hiStart
const govtStart = lines.findIndex((l, i) => i > hiStart && l.includes('govtExams: {'));
if (govtStart === -1) {
    console.log('Could not find govtExams in hi section');
    process.exit(1);
}

// Find where support or quizzes starts (end of corrupted area)
const corruptEnd = lines.findIndex((l, i) => i > govtStart && (l.includes('support: {') || l.includes('quizzes: {')));
if (corruptEnd === -1) {
    console.log('Could not find end of corrupted section');
    process.exit(1);
}

const newSectionLines = [
    '        govtExams: {',
    '          title: "सरकारी परीक्षा",',
    '          desc: "SSC, IBPS, रेलवे और अन्य परीक्षाओं की सटीक तैयारी। TCS/NTA स्टाइल इंटरफेस के साथ पूर्ण सिमुलेशन।",',
    '          links: {',
    '            mockTests: "मॉक टेस्ट",',
    '            pypPapers: "पुराने पेपर",',
    '            studyMaterial: "अध्ययन सामग्री",',
    '            careerGuide: "करियर गाइड",',
    '            action: "तैयारी शुरू करें"',
    '          }',
    '        },',
    '        personalize: {',
    '          title: "व्यक्तिगत अनुभव चाहते हैं?",',
    '          desc: "हमें बताएं कि आपको क्या पसंद है और हम आपकी पसंद के अनुसार क्विज़ दिखाएंगे।",',
    '          action: "अभी कस्टमाइज़ करें"',
    '        },'
];

lines.splice(govtStart, corruptEnd - govtStart, ...newSectionLines);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('File fixed successfully');
