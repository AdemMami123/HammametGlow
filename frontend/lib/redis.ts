import { createClient } from 'redis';

// Redis client configuration
const redisClient = createClient({
  url: process.env.REDIS_URL,
  password: process.env.REDIS_TOKEN,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Connect to Redis
export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

// Set value with expiration
export async function setRedis(key: string, value: string, expirationInSeconds?: number) {
  const client = await connectRedis();
  if (expirationInSeconds) {
    await client.setEx(key, expirationInSeconds, value);
  } else {
    await client.set(key, value);
  }
}

// Get value
export async function getRedis(key: string) {
  const client = await connectRedis();
  return await client.get(key);
}

// Delete value
export async function deleteRedis(key: string) {
  const client = await connectRedis();
  return await client.del(key);
}

// Set hash
export async function setHashRedis(key: string, field: string, value: string) {
  const client = await connectRedis();
  return await client.hSet(key, field, value);
}

// Get hash
export async function getHashRedis(key: string, field: string) {
  const client = await connectRedis();
  return await client.hGet(key, field);
}

// Get all hash fields
export async function getAllHashRedis(key: string) {
  const client = await connectRedis();
  return await client.hGetAll(key);
}

export default redisClient;
