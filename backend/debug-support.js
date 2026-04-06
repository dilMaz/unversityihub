// Debug script for support system
const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testSupportSystem() {
  console.log('🔍 Testing Support System...\n');
  
  // Test 1: Check if server is running
  try {
    console.log('1. Testing server connection...');
    const response = await axios.get(`${BASE_URL}/api/test`);
    console.log('✅ Server is running:', response.data);
  } catch (error) {
    console.log('❌ Server is not running or unreachable');
    console.log('   Error:', error.message);
    console.log('   Please start the backend server with: node app.js');
    return;
  }
  
  // Test 2: Test support endpoint without auth (should fail)
  try {
    console.log('\n2. Testing support endpoint without auth...');
    await axios.get(`${BASE_URL}/api/support/my`);
    console.log('❌ Support endpoint should require authentication');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Support endpoint correctly requires authentication');
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }
  
  // Test 3: Test login endpoint
  try {
    console.log('\n3. Testing login endpoint...');
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Login endpoint working');
    
    // Test 4: Test support endpoint with auth
    console.log('\n4. Testing support endpoint with auth...');
    const token = loginResponse.data.token;
    const supportResponse = await axios.get(`${BASE_URL}/api/support/my`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Support endpoint working with auth');
    console.log('   Support requests:', supportResponse.data);
    
  } catch (error) {
    console.log('❌ Login or support test failed');
    console.log('   Error:', error.response?.data || error.message);
  }
  
  console.log('\n🎯 Debug Summary:');
  console.log('- If server is not running: Start with "node app.js"');
  console.log('- If auth fails: Check if user exists and credentials are correct');
  console.log('- If support endpoint fails: Check database connection and routes');
  console.log('\n📝 To create a test user, register first or check existing users in database');
}

testSupportSystem().catch(console.error);
