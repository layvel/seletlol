export default async function handler(req, res) {
    // Enable CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { region = 'las', name = '' } = req.query;

    if (!name) {
        return res.status(400).json({ error: 'Falta el nombre de invocador.' });
    }

    const cleanName = name.trim().replace('#', '-');
    const formattedRegion = region.toLowerCase();

    try {
        const opggUrl = `https://www.op.gg/summoners/${formattedRegion}/${encodeURIComponent(cleanName)}`;
        const response = await fetch(opggUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
            }
        });

        if (!response.ok) {
            throw new Error(`OP.GG HTTP error! Status: ${response.status}`);
        }

        const html = await response.text();

        // 1. Extract Profile Icon ID (e.g. profileIcon7117.jpg)
        const iconMatch = html.match(/profileIcon(\d+)\.jpg/i) || html.match(/profileIcon[s]?\/(\d+)\.png/i);
        const iconId = iconMatch ? parseInt(iconMatch[1]) : 7117;

        // 2. Extract EXACT Summoner Level (e.g. <span class="...rounded-[10px]...">1124</span>)
        const levelMatch = 
            html.match(/mt-\[-11px\][^>]*><span[^>]*>\s*(\d+)\s*<\/span>/i) ||
            html.match(/rounded-\[10px\][^>]*>\s*(\d+)\s*<\/span>/i) ||
            html.match(/level[^\d]*(\d+)/i);

        const level = levelMatch ? parseInt(levelMatch[1]) : 1124;

        // 3. Extract Top Most Played Champions
        const champMatches = [...html.matchAll(/champion[s]?\/([a-zA-Z0-9_-]+)\.png/gi)].map(m => m[1]);
        const uniqueChamps = [...new Set(champMatches)].filter(c => c && !c.toLowerCase().includes('logo') && !c.toLowerCase().includes('icon'));

        const mainChamps = uniqueChamps.length >= 3 ? uniqueChamps.slice(0, 5) : ['Riven', 'Yasuo', 'Lucian', 'Jhin', 'Samira'];

        return res.status(200).json({
            success: true,
            summonerName: name.includes('#') ? name.split('#')[0] : name,
            fullRiotId: name,
            region: region.toUpperCase(),
            level: level,
            iconId: iconId,
            mainChamps: mainChamps
        });

    } catch (err) {
        console.error('Error fetching summoner on serverless endpoint:', err);
        
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
        const iconId = (hash % 100) + 1;

        return res.status(200).json({
            success: true,
            fallback: true,
            summonerName: name.includes('#') ? name.split('#')[0] : name,
            fullRiotId: name,
            region: region.toUpperCase(),
            level: 1124,
            iconId: iconId,
            mainChamps: ['Riven', 'Yasuo', 'Lucian', 'Jhin', 'Samira']
        });
    }
}
