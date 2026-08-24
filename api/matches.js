// Vercel Serverless Function for Team Match History Sync
// Storage endpoint using Cloud KV / Firebase REST fallback for real-time team sharing

// In-memory fallback cache for fast response (100% blank clean state)
let memoryStorage = {
    matches: [],
    summoners: [],
    lastUpdated: new Date().toISOString()
};

// External Cloud REST Storage for persistence across Vercel deployments
const CLOUD_STORAGE_URL = "https://seletlol-team-default-rtdb.firebaseio.com/team_data.json";

export default async function handler(req, res) {
    // Enable CORS for Vercel deployment
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'GET') {
            // Try fetching from Cloud Storage
            try {
                const cloudRes = await fetch(CLOUD_STORAGE_URL, { signal: AbortSignal.timeout(3500) });
                if (cloudRes.ok) {
                    const cloudData = await cloudRes.json();
                    if (cloudData && Array.isArray(cloudData.matches)) {
                        memoryStorage.matches = cloudData.matches;
                    }
                }
            } catch (cloudErr) {
                console.log('Using memory storage fallback:', cloudErr.message);
            }

            return res.status(200).json({
                success: true,
                matches: memoryStorage.matches,
                lastUpdated: memoryStorage.lastUpdated
            });
        }

        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            
            if (body.action === 'ADD_MATCH' && body.match) {
                const newMatch = {
                    id: 'match-' + Date.now(),
                    date: body.match.date || new Date().toISOString(),
                    duration: body.match.duration || '25:00',
                    result: body.match.result || 'VICTORY',
                    notes: body.match.notes || '',
                    players: body.match.players || []
                };

                memoryStorage.matches.unshift(newMatch);
                memoryStorage.lastUpdated = new Date().toISOString();

                // Sync to Cloud Storage
                try {
                    await fetch(CLOUD_STORAGE_URL, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(memoryStorage)
                    });
                } catch (e) {
                    console.error('Cloud save warning:', e.message);
                }

                return res.status(200).json({
                    success: true,
                    match: newMatch,
                    matches: memoryStorage.matches
                });
            }

            if (body.action === 'DELETE_MATCH' && body.matchId) {
                memoryStorage.matches = memoryStorage.matches.filter(m => m.id !== body.matchId);
                memoryStorage.lastUpdated = new Date().toISOString();

                try {
                    await fetch(CLOUD_STORAGE_URL, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(memoryStorage)
                    });
                } catch (e) {
                    console.error('Cloud sync error:', e.message);
                }

                return res.status(200).json({
                    success: true,
                    matches: memoryStorage.matches
                });
            }

            if (body.action === 'IMPORT_ALL' && Array.isArray(body.matches)) {
                memoryStorage.matches = body.matches;
                memoryStorage.lastUpdated = new Date().toISOString();

                try {
                    await fetch(CLOUD_STORAGE_URL, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(memoryStorage)
                    });
                } catch (e) {}

                return res.status(200).json({
                    success: true,
                    matches: memoryStorage.matches
                });
            }

            return res.status(400).json({ error: 'Acción no válida' });
        }

        return res.status(405).json({ error: 'Método no permitido' });
    } catch (err) {
        console.error('Error in matches serverless endpoint:', err);
        return res.status(500).json({ error: 'Error interno del servidor', details: err.message });
    }
}
