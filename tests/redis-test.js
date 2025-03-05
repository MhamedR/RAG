const Redis = require('ioredis');

// Create a Redis client
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

// Test the connection
async function testRedisConnection() {
  try {
    // Ping Redis
    const response = await redis.ping();
    console.log('Redis connection test result:', response);
    
    if (response === 'PONG') {
      console.log('✅ Redis connection successful!');
    } else {
      console.log('❌ Redis connection failed with unexpected response');
    }
  } catch (error) {
    console.error('❌ Redis connection error:', error.message);
  } finally {
    // Close the connection
    redis.quit();
  }
}

// Run the test
testRedisConnection(); 