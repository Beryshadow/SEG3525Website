const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
// 10mb limit to prevent huge payloads DoS
app.use(express.json({ limit: '10mb' }));

// In-memory store for synced data
// Structure: Map<syncCode, { data: Object, timestamp: Number, version: Number, datasetId: String, type: String }>
const syncStore = new Map();
const MAX_STORE_SIZE = 150; // Prevent memory exhaustion DoS (approx 150 active large sessions)

const pairingStore = new Map();
const MAX_PAIRING_STORE_SIZE = 1000; // Tiny payloads, so safe to store many

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const migrationStore = new Map(); // Tracks migrations

const FIVE_MINUTES_MS = 5 * 60 * 1000;

// Pub/Sub active connections: Map<syncCode, Set<Response>>
const subscriptions = new Map();

let queueLength = 0;
const MAX_QUEUE_LENGTH = 100;
let nextAvailableTime = 0;

// Cleanup interval to remove data older than 3 days, and migrations older than 12 hours
setInterval(() => {
    const now = Date.now();
    for (const [code, entry] of syncStore.entries()) {
        if (now - entry.timestamp > THREE_DAYS_MS) {
            syncStore.delete(code);
            console.log(`[CLEANUP] Deleted expired ${entry.type} data for code: ${code}`);
        }
    }
    for (const [code, entry] of pairingStore.entries()) {
        if (now - entry.timestamp > FIVE_MINUTES_MS) {
            pairingStore.delete(code);
            console.log(`[CLEANUP] Deleted expired pairing data for code: ${code}`);
        }
    }
    for (const [code, entry] of migrationStore.entries()) {
        if (now - entry.timestamp > TWELVE_HOURS_MS) {
            migrationStore.delete(code);
            console.log(`[CLEANUP] Deleted expired migration for code: ${code}`);
        }
    }
}, 60 * 1000); // Check every minute

// Validate sync code to prevent NoSQL/Path Traversal/Prototype pollution style attacks
function isValidCode(code) {
    return typeof code === 'string' && code.length >= 4 && code.length <= 64 && /^[a-zA-Z0-9]+$/.test(code);
};

// POST: Save or update sync data
app.post('/api/sync/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`[SYNC-POST] IP: ${ip} | Code: ${code} | Action: Attempting to save/update data`);
    const { data, version, datasetId, type = 'sync' } = req.body;

    if (!isValidCode(code)) {
        return res.status(400).json({ error: 'Invalid sync code format' });
    }

    const isPairing = type === 'pairing';
    const targetStore = isPairing ? pairingStore : syncStore;
    const maxStoreSize = isPairing ? MAX_PAIRING_STORE_SIZE : MAX_STORE_SIZE;

    // New code creation queue logic
    if (!targetStore.has(code)) {
        if (queueLength >= MAX_QUEUE_LENGTH) {
            return res.status(429).json({ error: 'Try again later, we are experiencing high demand.' });
        }
        
        queueLength++;
        const now = Date.now();
        let waitTime = 0;
        
        if (now < nextAvailableTime) {
            waitTime = nextAvailableTime - now;
            nextAvailableTime += 2000;
        } else {
            nextAvailableTime = now + 2000;
        }
        
        if (waitTime > 0) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        queueLength--;
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return res.status(400).json({ error: 'Invalid data payload. Must be a JSON object.' });
    }

    if (targetStore.size >= maxStoreSize && !targetStore.has(code)) {
        let oldestCode = null;
        let oldestTime = Infinity;
        for (const [k, v] of targetStore.entries()) {
            if (v.timestamp < oldestTime) {
                oldestTime = v.timestamp;
                oldestCode = k;
            }
        }
        if (oldestCode) {
            targetStore.delete(oldestCode);
            console.log(`[EVICT] Evicted oldest code: ${oldestCode}`);
        }
    }

    const currentEntry = targetStore.get(code);
    const newVersion = typeof version === 'number' ? version : Date.now();

    if (isPairing && currentEntry) {
        // Strict collision rejection for pairing codes to prevent stealing/overwriting
        return res.status(409).json({ error: 'Conflict: Pairing code already exists' });
    } else if (currentEntry && currentEntry.version > newVersion) {
        return res.status(409).json({ error: 'Conflict: Server has a newer version', serverVersion: currentEntry.version });
    }

    // Securely store data without executing or merging
    targetStore.set(code, {
        data: data,
        timestamp: Date.now(),
        version: newVersion,
        datasetId: datasetId || null,
        type: type // 'pairing', 'sync', or 'share'
    });
    
    // Broadcast to SSE subscribers
    const subscribers = subscriptions.get(code);
    if (subscribers) {
        subscribers.forEach(subscriber => {
            subscriber.write(`data: ${JSON.stringify({ version: newVersion })}\n\n`);
        });
    }

    console.log(`[SYNC] Saved ${type} data for code: ${code}, version: ${newVersion}`);
    res.json({ success: true, version: newVersion });
});

// POST: Migrate sync code
app.post('/api/sync/:code/migrate', (req, res) => {
    const code = req.params.code.toUpperCase();
    const newCode = req.body.newCode ? req.body.newCode.toUpperCase() : null;
    const { datasetId } = req.body;

    if (!isValidCode(code) || !isValidCode(newCode)) {
        return res.status(400).json({ error: 'Invalid sync code format' });
    }

    migrationStore.set(code, {
        newCode: newCode,
        timestamp: Date.now(),
        datasetId: datasetId || null
    });

    if (syncStore.has(code)) {
        syncStore.delete(code); // Clean up the old data immediately to save space
    }

    console.log(`[MIGRATE] Code ${code} migrated to ${newCode}`);
    res.json({ success: true });
});

// DELETE: Clear all sync data for a dataset
app.delete('/api/sync/clear/:datasetId', (req, res) => {
    const { datasetId } = req.params;
    if (!datasetId || typeof datasetId !== 'string') {
        return res.status(400).json({ error: 'Invalid datasetId' });
    }

    let deletedCount = 0;
    for (const [code, entry] of syncStore.entries()) {
        if (entry.datasetId === datasetId) {
            syncStore.delete(code);
            deletedCount++;
        }
    }
    for (const [code, entry] of pairingStore.entries()) {
        if (entry.datasetId === datasetId) {
            pairingStore.delete(code);
            deletedCount++;
        }
    }
    for (const [code, entry] of migrationStore.entries()) {
        if (entry.datasetId === datasetId) {
            migrationStore.delete(code);
            deletedCount++;
        }
    }

    console.log(`[CLEAR] Deleted ${deletedCount} entries for dataset: ${datasetId}`);
    res.json({ success: true, deletedCount });
});

// Simple GET rate limiting
const getRateLimits = new Map();

// GET: Subscribe to SSE updates for a sync code
app.get('/api/sync/:code/subscribe', (req, res) => {
    const code = req.params.code.toUpperCase();
    if (!isValidCode(code)) {
        return res.status(400).json({ error: 'Invalid sync code format' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); 

    if (!subscriptions.has(code)) {
        subscriptions.set(code, new Set());
    }
    const subscribers = subscriptions.get(code);
    subscribers.add(res);
    
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`[SYNC-PUB/SUB] IP: ${ip} | Code: ${code} | Action: Client subscribed via SSE`);

    res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);

    if (!syncStore.has(code) && !pairingStore.has(code) && !migrationStore.has(code)) {
        res.write(`data: ${JSON.stringify({ error: 'not_found' })}\n\n`);
    }

    req.on('close', () => {
        subscribers.delete(res);
        if (subscribers.size === 0) {
            subscriptions.delete(code);
        }
        console.log(`[SYNC-PUB/SUB] IP: ${ip} | Code: ${code} | Action: Client disconnected`);
    });
});

// GET: Retrieve sync data
app.get('/api/sync/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`[SYNC-GET] IP: ${ip} | Code: ${code} | Action: Querying sync data`);
    
    // IP based rate limiting for GET to prevent brute forcing pairing codes
    const now = Date.now();
    const clientLimit = getRateLimits.get(ip) || { count: 0, resetTime: now + 60000 };
    
    if (now > clientLimit.resetTime) {
        clientLimit.count = 1;
        clientLimit.resetTime = now + 60000;
    } else {
        clientLimit.count++;
        if (clientLimit.count > 60) { // Max 60 requests per minute per IP
            return res.status(429).json({ error: 'Rate limit exceeded. Too many requests.' });
        }
    }
    getRateLimits.set(ip, clientLimit);
    
    if (!isValidCode(code)) {
        return res.status(400).json({ error: 'Invalid sync code format' });
    }

    if (migrationStore.has(code)) {
        const migratedTo = migrationStore.get(code).newCode;
        return res.json({
            data: { newSyncCode: migratedTo },
            version: Date.now(),
            timestamp: Date.now()
        });
    }

    const entry = syncStore.get(code) || pairingStore.get(code);

    if (!entry) {
        return res.status(404).json({ error: 'No data found for this sync code' });
    }

    res.json({
        data: entry.data,
        version: entry.version,
        timestamp: entry.timestamp
    });
});



// GET: Retrieve only the sync version
app.get('/api/sync/:code/version', (req, res) => {
    const code = req.params.code.toUpperCase();
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`[SYNC-GET-VERSION] IP: ${ip} | Code: ${code} | Action: Polling version`);
    
    if (!isValidCode(code)) {
        return res.status(400).json({ error: 'Invalid sync code format' });
    }

    if (migrationStore.has(code)) {
        return res.json({ version: Date.now() }); // Force a pull so the client receives the migration payload
    }

    const entry = syncStore.get(code) || pairingStore.get(code);

    if (!entry) {
        return res.status(404).json({ error: 'No data found for this sync code' });
    }

    res.json({ version: entry.version });
});

// Serve static files from the Vite build directory
app.use(express.static(path.join(__dirname, '../build')));

// Fallback to index.html for React Router
app.get('/*path', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`P2P Sync Server running on port ${PORT}`);
    console.log(`Sync data automatically expires after 5 minutes of inactivity.`);
    console.log(`Share data automatically expires after 3 days of inactivity.`);
});
