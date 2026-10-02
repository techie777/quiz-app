async function testEndpoints() {
  const endpoints = [
    "/api/gk/counts",
    "/api/gk/data?category=India%20GK",
    "/api/gk/topic-sets?topicId=topic_general-knowledge_muqize8e",
    "/gk",
    "/fun-facts",
    "/true-false",
  ];

  console.log("Testing endpoints on http://localhost:3000 ...");

  for (const ep of endpoints) {
    try {
      const res = await fetch(`http://localhost:3000${ep}`);
      console.log(`[${res.status}] ${ep}`);
      if (!res.ok) {
        console.error(`Endpoint ${ep} returned status ${res.status}`);
      }
    } catch (err) {
      console.error(`Endpoint ${ep} failed with error:`, err.message);
    }
  }

  console.log("All endpoint tests completed!");
}

testEndpoints();
