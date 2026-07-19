const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
// 100mb limit to prevent huge payloads DoS
app.use(express.json({ limit: '100mb' }));

// In-memory store for synced data
// Structure: Map<syncCode, { data: Object, timestamp: Number, version: Number }>
const syncStore = new Map();
const MAX_STORE_SIZE = 10; // Prevent memory exhaustion DoS

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

// Cleanup interval to remove data older than 12 hours
setInterval(() => {
    const now = Date.now();
    for (const [code, entry] of syncStore.entries()) {
        if (now - entry.timestamp > TWELVE_HOURS_MS) {
            syncStore.delete(code);
            console.log(`[CLEANUP] Deleted expired sync data for code: ${code}`);
        }
    }
}, 60 * 1000); // Check every minute

// Validate sync code to prevent NoSQL/Path Traversal/Prototype pollution style attacks
const isValidCode = (code) => {
    return typeof code === 'string' && /^[a-zA-Z0-9_-]{1,32}$/.test(code);
};

// POST: Save or update sync data
app.post('/api/sync/:code', (req, res) => {
    const { code } = req.params;
    const { data, version } = req.body;

    if (!isValidCode(code)) {
        return res.status(400).json({ error: 'Invalid sync code format' });
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return res.status(400).json({ error: 'Invalid data payload. Must be a JSON object.' });
    }

    if (syncStore.size >= MAX_STORE_SIZE && !syncStore.has(code)) {
        let oldestCode = null;
        let oldestTime = Infinity;
        for (const [k, v] of syncStore.entries()) {
            if (v.timestamp < oldestTime) {
                oldestTime = v.timestamp;
                oldestCode = k;
            }
        }
        if (oldestCode) {
            syncStore.delete(oldestCode);
            console.log(`[EVICT] Evicted oldest sync code: ${oldestCode}`);
        }
    }

    const currentEntry = syncStore.get(code);
    const newVersion = typeof version === 'number' ? version : Date.now();

    if (currentEntry && currentEntry.version > newVersion) {
        return res.status(409).json({ error: 'Conflict: Server has a newer version', serverVersion: currentEntry.version });
    }

    // Securely store data without executing or merging
    syncStore.set(code, {
        data: data,
        timestamp: Date.now(),
        version: newVersion
    });

    console.log(`[SYNC] Saved data for code: ${code}, version: ${newVersion}`);
    res.json({ success: true, version: newVersion });
});

// GET: Retrieve sync data
app.get('/api/sync/:code', (req, res) => {
    const { code } = req.params;
    
    if (!isValidCode(code)) {
        return res.status(400).json({ error: 'Invalid sync code format' });
    }

    const entry = syncStore.get(code);

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
    const { code } = req.params;
    
    if (!isValidCode(code)) {
        return res.status(400).json({ error: 'Invalid sync code format' });
    }

    const entry = syncStore.get(code);

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
    console.log(`Sync data will automatically expire after 12 hours of inactivity.`);
});
