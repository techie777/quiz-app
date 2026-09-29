async function check() {
  console.log("Checking http://localhost:3000/api/categories ...");
  const res = await fetch('http://localhost:3000/api/categories');
  console.log("Status:", res.status);
  const data = await res.json();
  const cats = data.categories || data;
  console.log("Categories returned:", cats.length);
  const withQ = cats.filter(c => (c.questionCount || 0) > 0);
  console.log("Categories with active questions:", withQ.length);
  console.log("Sample active categories:", withQ.slice(0, 10).map(c => `${c.topic} (${c.topicHi || ''}) - ${c.questionCount} Qs`));

  console.log("\nChecking http://localhost:3000/api/gk/home?language=hi ...");
  const gkRes = await fetch('http://localhost:3000/api/gk/home?language=hi');
  const gkData = await gkRes.json();
  console.log("GK Parent tiles:", gkData.parentTiles?.length);
  console.log("GK Pinned topics:", gkData.pinnedTopics?.length);
  console.log("GK Total topics:", gkData.allTopics?.length);
}

check().catch(console.error);
