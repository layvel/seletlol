// Vercel Serverless Function for Team Match History Sync
// Storage endpoint using Cloud KV / Firebase REST fallback for real-time team sharing

// In-memory fallback cache for fast response
let memoryStorage = {
    matches: [
        {
            id: "match-sample-1",
            date: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
            duration: "28:15",
            result: "VICTORY",
            notes: "Excelente control de dragones y buena rotación en Mid Game. Riven y Yasuo hicieron buen combo en TF.",
            players: [
                { summonerName: "Layvel", lane: "TOP", champion: "Riven", kills: 12, deaths: 3, assists: 8 },
                { summonerName: "Invocador 2", lane: "JUNGLE", champion: "JarvanIV", kills: 4, deaths: 2, assists: 15 },
                { summonerName: "Invocador 3", lane: "MID", champion: "Yasuo", kills: 9, deaths: 4, assists: 10 },
                { summonerName: "Invocador 4", lane: "BOT", champion: "Jhin", kills: 8, deaths: 1, assists: 11 },
                { summonerName: "Invocador 5", lane: "SUPPORT", champion: "Thresh", kills: 2, deaths: 3, assists: 18 }
            ]
        },
        {
            id: "match-sample-2",
            date: new Date(Date.now() - 3600000 * 24).toISOString(),
            duration: "34:40",
            result: "DEFEAT",
            notes: "Nos faltó visión en Baron al minuto 30. Hay que mejorar la comunicación del Support y Jungla.",
            players: [
                { summonerName: "Layvel", lane: "TOP", champion: "Aatrox", kills: 6, deaths: 7, assists: 4 },
                { summonerName: "Invocador 2", lane: "JUNGLE", champion: "LeeSin", kills: 3, deaths: 6, assists: 8 },
                { summonerName: "Invocador 3", lane: "MID", champion: "Ahri", kills: 7, deaths: 5, assists: 6 },
                { summonerName: "Invocador 4", lane: "BOT", champion: "Kaisa", kills: 9, deaths: 6, assists: 3 },
                { summonerName: "Invocador 5", lane: "SUPPORT", champion: "Nautilus", kills: 1, deaths: 8, assists: 10 }
            ]
        },
        {
            id: "match-sample-3",
            date: new Date().toISOString(),
            duration: "24:10",
            result: "VICTORY",
            notes: "Dominio total de bot lane desde nivel 2. Buen peel de Nautilus y ejecuciones rápidas.",
            players: [
                { summonerName: "Layvel", lane: "TOP", champion: "Fiora", kills: 8, deaths: 2, assists: 5 },
                { summonerName: "Invocador 2", lane: "JUNGLE", champion: "Viego", kills: 10, deaths: 3, assists: 7 },
                { summonerName: "Invocador 3", lane: "MID", champion: "Syndra", kills: 6, deaths: 1, assists: 9 },
                { summonerName: "Invocador 4", lane: "BOT", champion: "Samira", kills: 14, deaths: 2, assists: 6 },
                { summonerName: "Invocador 5", lane: "SUPPORT", champion: "Leona", kills: 1, deaths: 3, assists: 17 }
            ]
        }
    ],
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
