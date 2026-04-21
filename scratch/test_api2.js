
const axios = require('axios');

async function testFetch() {
  const urlCategoryId = '69d03ea778a47c2438020855';
  console.log('Testing deep link for ID:', urlCategoryId);
  const res = await axios.get(`http://localhost:3000/api/categories?id=${urlCategoryId}&limit=1`);
  const cat = res.data.categories[0];
  console.log('Fetched category:', cat?.topic, 'ID:', cat?.id);
  
  if (cat?.topic === 'Computer GK') {
    console.log('API is correctly returning Computer GK.');
  } else {
    console.log('API is returning the WRONG category:', cat?.topic);
  }
}
testFetch();
