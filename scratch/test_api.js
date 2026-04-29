const { GET } = require('../src/app/api/leaderboard/route');
const { NextResponse } = require('next/server');

// Mock request
const req = {};

async function testLeaderboard() {
  try {
    const res = await GET(req);
    const data = await res.json();
    console.log('Leaderboard API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('API Test Error:', error);
  }
}

testLeaderboard();
