async function testClientState() {
  const catRes = await fetch('http://localhost:3000/api/categories');
  const catJson = await catRes.json();
  const quizzes = catJson.categories || catJson;

  const gkRes = await fetch('http://localhost:3000/api/gk/home?language=hi');
  const gkHomeData = await gkRes.json();

  // Page.jsx logic:
  const explorerCategories = quizzes.filter((cat) => {
    const topicLower = (cat.topic || "").toLowerCase();
    if (topicLower === "india gk" || topicLower === "world gk") return false;
    const count =
      cat.questionCount ??
      cat._count?.questions ??
      (Array.isArray(cat.questions) ? cat.questions.length : 0);
    return count > 0;
  });

  const parentTiles = gkHomeData?.parentTiles || [];
  const pinnedTopics = gkHomeData?.pinnedTopics || [];
  const allCards = [...parentTiles, ...pinnedTopics, ...explorerCategories];

  console.log("=== CHIPS ROW SIMULATION ===");
  console.log("1. ✨ सभी");
  console.log("2. 🏛️ भारत सामान्य ज्ञान");
  console.log("3. 🌍 विश्व सामान्य ज्ञान");
  console.log(`+ ${explorerCategories.length} standard category chips:`);
  console.log(explorerCategories.slice(0, 10).map((c, i) => `   ${i+4}. ${c.emoji || '📝'} ${c.topicHi || c.topic}`));

  console.log("\n=== CATEGORY CARDS GRID SIMULATION ===");
  console.log(`Total cards rendered in 'All' view: ${allCards.length}`);
  console.log("Top 12 cards:");
  allCards.slice(0, 12).forEach((card, idx) => {
    const title = card.topicHi || card.nameHi || card.topic || card.name;
    const qCount = card.questionCount ?? card._count?.questions ?? (Array.isArray(card.questions) ? card.questions.length : 0);
    const tag = card.isGkParent ? "[GK Parent]" : card.isGkTopic ? "[GK Pinned]" : "[Standard Category]";
    console.log(`   ${idx + 1}. ${tag} ${title} (${qCount} प्रश्न)`);
  });
}

testClientState().catch(console.error);
