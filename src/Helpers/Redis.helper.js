const redis = require('redis');

const client = redis.createClient({
    url: 'redis://127.0.0.1:6379'
    /* url: "redis://host.docker.internal:6379" */
});

client.on('connect', () => {
    console.log('Client connected to Redis');
});

client.on('ready', () => {
    console.log('Client is ready to use');
});

client.on('error', (err) => {
    console.error('Redis error:', err.message);
});

client.on('end', () => {
    console.log('Client disconnected from Redis');
});

(async () => {
    try {
        await client.connect();
    } catch (err) {
        console.error('Failed to connect to Redis:', err.message);
    }
})();

process.on('SIGINT', async () => {
    try {
        await client.quit();
        console.log('Redis client disconnected');
        process.exit(0);
    } catch (err) {
        console.error('Error while quitting Redis:', err.message);
        process.exit(1);
    }
});

module.exports = client;
