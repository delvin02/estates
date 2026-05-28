import { env } from '$env/dynamic/private';
import Redis from 'ioredis';

export const redisConnection = new Redis(env.REDIS_URL ?? 'redis://localhost:6379', {
	maxRetriesPerRequest: null
});

redisConnection.on('error', (err) => console.error('Redis error', err));
