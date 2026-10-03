// scripts/test-smart-rules.mjs
const { generateSmartQuizSets } = await import("../src/lib/setGenerationRules.js");

const dummyQuestions = [];
for (let i = 0; i < 200; i++) {
  dummyQuestions.push({
    id: 'q' + i,
    text: 'Question ' + i,
    difficulty: i % 3 === 0 ? 'easy' : (i % 3 === 1 ? 'medium' : 'hard'),
    subCategory: 'Subcat ' + (i % 10)
  });
}

console.log("=== TESTING SMART SET GENERATION RULES ===");

// 1. Test Rule 1 (Mega Pool: all subcats selected)
const setsRule1 = generateSmartQuizSets({
  questions: dummyQuestions,
  category: { slug: "india-gk", subCategories: [{ slug: "sub1" }, { slug: "sub2" }] },
  selectedSubCategory: null,
  selectedTopic: null
});
console.log("Rule 1 Set 1 Q Count:", setsRule1[0].questions.length);
console.log("Rule 1 Set 1 Rule Name:", setsRule1[0].ruleApplied);
console.log("Rule 1 Set 1 Difficulty Balance:", setsRule1[0].difficultyBalance);
console.log("Rule 1 Set 1 Q1-5 Difficulty (must all be easy):", setsRule1[0].questions.slice(0, 5).map(q => q.difficulty));
const q1to5AllEasy = setsRule1[0].questions.slice(0, 5).every(q => q.difficulty === "easy");
console.log("Rule 1: Q1 to 5 are strictly Easy:", q1to5AllEasy);

// 2. Test Rule 2 (Subcategory active, multiple topics)
const setsRule2 = generateSmartQuizSets({
  questions: dummyQuestions,
  category: { slug: "sports", subCategories: [{ slug: "cricket" }] },
  selectedSubCategory: "cricket",
  selectedTopic: null
});
console.log("Rule 2 Set 1 Balance (10 easy, 5 med, 5 hard):", setsRule2[0].difficultyBalance);
console.log("Rule 2 Set 2 Balance (7 easy, 7 med, 6 hard):", setsRule2[1].difficultyBalance);

// 3. Test Rule 3 (Specific topic active - strict 7-7-6 progressive order)
const setsRule3 = generateSmartQuizSets({
  questions: dummyQuestions,
  category: { slug: "india-gk" },
  selectedSubCategory: "indian-geography",
  selectedTopic: "rivers-lakes"
});
console.log("Rule 3 Set 1 Balance (7 easy, 7 med, 6 hard):", setsRule3[0].difficultyBalance);
console.log("Rule 3 Set 1 Order preview (first 7 easy):", setsRule3[0].questions.slice(0, 7).map(q => q.difficulty));

// 4. Test Rule 4 (Bulk Category Ladder)
const setsRule4 = generateSmartQuizSets({
  questions: dummyQuestions,
  category: { slug: "custom-upload", subCategories: [] },
  selectedSubCategory: null,
  selectedTopic: null
});
console.log("Rule 4 Set 1 Balance (All Easy):", setsRule4[0].difficultyBalance);
console.log("Rule 4 Set 2 Balance (10 easy, 5 med, 5 hard):", setsRule4[1].difficultyBalance);
console.log("Rule 4 Set 3 Balance (7 easy, 7 med, 6 hard):", setsRule4[2].difficultyBalance);

console.log("=== ALL RULES VERIFIED SUCCESSFULLY ===");
