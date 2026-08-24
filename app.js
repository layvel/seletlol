/* ===================================================
   LEAGUE OF LEGENDS - SQUAD TRACKER & ANALYTICS
   =================================================== */

const LINES = [
    { id: 'TOP', name: 'Top', icon: 'fa-shield-halved', roleFilter: 'Fighter' },
    { id: 'JUNGLE', name: 'Jungla', icon: 'fa-tree', roleFilter: 'Fighter' },
    { id: 'MID', name: 'Mid', icon: 'fa-wand-magic-sparkles', roleFilter: 'Mage' },
    { id: 'BOT', name: 'Bot / ADC', icon: 'fa-crosshairs', roleFilter: 'Marksman' },
    { id: 'SUPPORT', name: 'Soporte', icon: 'fa-heart', roleFilter: 'Support' }
];

// Meta suggested champions by line
const META_SUGGESTIONS = {
    'TOP': ['Riven', 'Aatrox', 'Fiora', 'Darius', 'Jax', 'Garen', 'Sett', 'Camille', 'Mordekaiser', 'Volibear'],
    'JUNGLE': ['LeeSin', 'JarvanIV', 'Viego', 'XinZhao', 'KhaZix', 'Elise', 'Graves', 'Warwick', 'Amumu', 'Kayn'],
    'MID': ['Yasuo', 'Ahri', 'Syndra', 'Zed', 'Yone', 'Lux', 'Akali', 'Vex', 'Katarina', 'Orianna'],
    'BOT': ['Jhin', 'Kaisa', 'Samira', 'Ezreal', 'Jinx', 'Caitlyn', 'Vayne', 'Lucian', 'Ashe', 'MissFortune'],
    'SUPPORT': ['Thresh', 'Nautilus', 'Leona', 'Lulu', 'Blitzcrank', 'Nami', 'Pyke', 'Morgana', 'Braum', 'Senna']
};

// Global App State
const state = {
    version: '14.1.1',
    championsDict: {},
    championsList: [],
    currentStep: 'roster', // 'roster', 'history', 'analytics'
    
    // Cloud Sync & Filter state
    historyFilterResult: 'ALL',
    historySearchQuery: '',
    cloudSyncStatus: 'online',

    // Modal Target state for Champion Picker
    modalTargetSummonerId: null,
    modalTargetLaneId: null,
    modalRoleFilter: 'ALL',
    modalSearchQuery: '',

    // Dynamic 5 to 7 Friends Roster with Champion Pools per Line
    summoners: [
        {
            id: 1,
            name: 'Layvel#LAS',
            profileIconId: 7117,
            level: 1124,
            verified: true,
            preferredLanes: ['TOP', 'MID', 'BOT'],
            pools: {
                'TOP': ['Riven', 'Aatrox', 'Fiora'],
                'MID': ['Yasuo', 'Ahri', 'Zed'],
                'BOT': ['Lucian', 'Jhin', 'Samira']
            }
        },
        {
            id: 2,
            name: 'Invocador 2',
            profileIconId: 54,
            level: 759,
            verified: false,
            preferredLanes: ['JUNGLE', 'MID', 'BOT'],
            pools: {
                'JUNGLE': ['LeeSin', 'JarvanIV', 'Viego'],
                'MID': ['Syndra', 'Ahri'],
                'BOT': ['Ezreal', 'Jinx']
            }
        },
        {
            id: 3,
            name: 'Invocador 3',
            profileIconId: 78,
            level: 388,
            verified: false,
            preferredLanes: ['MID', 'BOT', 'SUPPORT'],
            pools: {
                'MID': ['Yasuo', 'Syndra', 'Lux'],
                'BOT': ['Kaisa', 'Vayne'],
                'SUPPORT': ['Thresh', 'Nautilus']
            }
        },
        {
            id: 4,
            name: 'Invocador 4',
            profileIconId: 92,
            level: 424,
            verified: false,
            preferredLanes: ['TOP', 'BOT', 'SUPPORT'],
            pools: {
                'TOP': ['Darius', 'Garen', 'Jax'],
                'BOT': ['Jhin', 'Samira', 'Caitlyn'],
                'SUPPORT': ['Leona', 'Lulu']
            }
        },
        {
            id: 5,
            name: 'Invocador 5',
            profileIconId: 105,
            level: 462,
            verified: false,
            preferredLanes: ['TOP', 'JUNGLE', 'SUPPORT'],
            pools: {
                'TOP': ['Mordekaiser', 'Volibear'],
                'JUNGLE': ['Warwick', 'XinZhao'],
                'SUPPORT': ['Thresh', 'Nautilus', 'Leona']
            }
        },
        {
            id: 6,
            name: 'Invocador 6',
            profileIconId: 120,
            level: 350,
            verified: false,
            preferredLanes: ['JUNGLE', 'SUPPORT'],
            pools: {
                'JUNGLE': ['Amumu', 'Kayn'],
                'SUPPORT': ['Blitzcrank', 'Nami']
            }
        },
        {
            id: 7,
            name: 'Invocador 7',
            profileIconId: 135,
            level: 280,
            verified: false,
            preferredLanes: ['TOP', 'MID'],
            pools: {
                'TOP': ['Sett', 'Aatrox'],
                'MID': ['Yone', 'Katarina']
            }
        }
    ],

    // Rich Sample Match History featuring Duos, Trios and 5-man premades
    matchesHistory: [
        {
            id: "match-sample-1",
            date: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
            duration: "28:15",
            result: "VICTORY",
            notes: "Excelente control de dragones y buena rotación en Mid Game. Riven y Yasuo hicieron un combo devastador en la pelea de Baron.",
            players: [
                { summonerName: "Layvel#LAS", lane: "TOP", champion: "Riven", kills: 12, deaths: 3, assists: 8 },
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
            notes: "Nos faltó visión en Baron al minuto 30. Hay que mejorar la comunicación entre Support y Jungla cuando el enemigo tenga ventaja de visión.",
            players: [
                { summonerName: "Layvel#LAS", lane: "TOP", champion: "Aatrox", kills: 6, deaths: 7, assists: 4 },
                { summonerName: "Invocador 2", lane: "JUNGLE", champion: "LeeSin", kills: 3, deaths: 6, assists: 8 },
                { summonerName: "Invocador 3", lane: "MID", champion: "Ahri", kills: 7, deaths: 5, assists: 6 },
                { summonerName: "Invocador 4", lane: "BOT", champion: "Kaisa", kills: 9, deaths: 6, assists: 3 },
                { summonerName: "Invocador 5", lane: "SUPPORT", champion: "Nautilus", kills: 1, deaths: 8, assists: 10 }
            ]
        },
        {
            id: "match-sample-3",
            date: new Date(Date.now() - 3600000 * 8).toISOString(),
            duration: "26:10",
            result: "VICTORY",
            notes: "Partida en Dúo (Layvel + Invocador 3). Dominio total de top y mid desde nivel 3 con ganks coordinados.",
            players: [
                { summonerName: "Layvel#LAS", lane: "TOP", champion: "Fiora", kills: 11, deaths: 2, assists: 6 },
                { summonerName: "Invocador 3", lane: "MID", champion: "Yasuo", kills: 10, deaths: 3, assists: 8 }
            ]
        },
        {
            id: "match-sample-4",
            date: new Date().toISOString(),
            duration: "24:50",
            result: "VICTORY",
            notes: "Trío premade (Layvel, Invocador 2 e Invocador 4). Excelente iniciación y snowball temprano.",
            players: [
                { summonerName: "Layvel#LAS", lane: "BOT", champion: "Lucian", kills: 14, deaths: 2, assists: 7 },
                { summonerName: "Invocador 2", lane: "JUNGLE", champion: "Viego", kills: 8, deaths: 3, assists: 10 },
                { summonerName: "Invocador 4", lane: "SUPPORT", champion: "Leona", kills: 2, deaths: 3, assists: 16 }
            ]
        }
    ]
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    loadLocalRosterAndHistory();
    await loadRiotDataDragon();
    await loadMatchesFromCloud();
    switchStep('roster');
}

function loadLocalRosterAndHistory() {
    const savedRoster = localStorage.getItem('LOL_TEAM_SUMMONERS_ROSTER');
    if (savedRoster) {
        try {
            const parsed = JSON.parse(savedRoster);
            if (Array.isArray(parsed) && parsed.length >= 2) {
                state.summoners = parsed;
            }
        } catch (e) {}
    }

    const savedHistory = localStorage.getItem('LOL_TEAM_MATCHES_HISTORY');
    if (savedHistory) {
        try {
            const parsedH = JSON.parse(savedHistory);
            if (Array.isArray(parsedH) && parsedH.length > 0) {
                state.matchesHistory = parsedH;
            }
        } catch (e) {}
    }
}

// LOAD RIOT DATA DRAGON API
async function loadRiotDataDragon() {
    const badgeText = document.getElementById('cloudStatusText');
    try {
        const verResp = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const verData = await verResp.json();
        if (verData && verData.length > 0) {
            state.version = verData[0];
        }

        const champResp = await fetch(`https://ddragon.leagueoflegends.com/cdn/${state.version}/data/es_ES/champion.json`);
        const champData = await champResp.json();

        state.championsDict = champData.data;
        state.championsList = Object.values(champData.data).sort((a, b) => a.name.localeCompare(b.name));

        if (badgeText) badgeText.textContent = `🟢 Sincronizado en Nube (v${state.version})`;
    } catch (err) {
        console.warn('Error fetching Data Dragon:', err);
    }
}

// STEP NAVIGATION SWITCHER
function switchStep(stepKey) {
    state.currentStep = stepKey;

    document.querySelectorAll('.stepper-nav .step-btn').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick') || '';
        const isMatch = onclickAttr.includes(`'${stepKey}'`) || onclickAttr.includes(`(${stepKey})`);
        btn.classList.toggle('active', isMatch);
    });

    document.querySelectorAll('.step-content').forEach(sec => {
        sec.classList.remove('active');
    });

    let targetId = 'stepRosterContent';
    if (stepKey === 'roster' || stepKey === 1) targetId = 'stepRosterContent';
    else if (stepKey === 'history') targetId = 'stepHistoryContent';
    else if (stepKey === 'analytics') targetId = 'stepAnalyticsContent';

    const targetSec = document.getElementById(targetId);
    if (targetSec) targetSec.classList.add('active');

    if (stepKey === 'roster' || stepKey === 1) {
        renderSummonersGrid();
    } else if (stepKey === 'history') {
        renderMatchesHistory();
    } else if (stepKey === 'analytics') {
        renderAnalyticsDashboard();
    }
}

/* ===================================================
   SECTION 1: SUMMONERS ROSTER & CHAMPION POOLS PER LANE
   =================================================== */

function renderSummonersGrid() {
    const grid = document.getElementById('summonersGrid');
    if (!grid) return;
    grid.innerHTML = '';

    state.summoners.forEach(sum => {
        if (!sum.pools) sum.pools = {};

        const card = document.createElement('div');
        card.className = 'summoner-card';

        const iconUrl = `https://ddragon.leagueoflegends.com/cdn/${state.version}/img/profileicon/${sum.profileIconId || 7117}.png`;

        // 1. Line Checkboxes
        const linesHTML = LINES.map(line => {
            const isChecked = sum.preferredLanes.includes(line.id);
            return `
                <label class="lane-checkbox-label ${isChecked ? 'selected' : ''}">
                    <div class="lane-info">
                        <span class="lane-badge-icon"><i class="fa-solid ${line.icon}"></i></span>
                        <span>${line.name}</span>
                    </div>
                    <input type="checkbox" 
                           ${isChecked ? 'checked' : ''} 
                           onchange="toggleSummonerLane(${sum.id}, '${line.id}', this.checked)">
                    ${isChecked ? '<i class="fa-solid fa-check" style="color: var(--cyan-hextech)"></i>' : ''}
                </label>
            `;
        }).join('');

        // 2. Champion Pools Blocks for Active Lines
        let poolsHTML = '';
        if (sum.preferredLanes.length === 0) {
            poolsHTML = `<p style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">Selecciona al menos una línea arriba para definir su pool de campeones.</p>`;
        } else {
            poolsHTML = sum.preferredLanes.map(lineId => {
                const lineMeta = LINES.find(l => l.id === lineId) || { name: lineId, icon: 'fa-shield' };
                const champs = sum.pools[lineId] || [];

                const champChipsHTML = champs.map(cKey => {
                    const cObj = state.championsDict[cKey] || { id: cKey, name: cKey };
                    const champImg = `https://ddragon.leagueoflegends.com/cdn/${state.version}/img/champion/${cObj.id || cKey}.png`;
                    return `
                        <div class="champ-tag-chip">
                            <img src="${champImg}" class="champ-tag-img" alt="${cKey}" onerror="this.style.display='none'">
                            <span>${escapeHtml(cObj.name || cKey)}</span>
                            <button class="remove-champ-tag-btn" onclick="removeChampFromLane(${sum.id}, '${lineId}', '${cKey}')" title="Quitar campeón">&times;</button>
                        </div>
                    `;
                }).join('');

                return `
                    <div class="lane-pool-block">
                        <div class="lane-pool-header">
                            <span><i class="fa-solid ${lineMeta.icon}"></i> Pool para ${lineMeta.name}</span>
                            <button class="add-champ-to-lane-btn" onclick="openChampPickerForLane(${sum.id}, '${lineId}')">
                                <i class="fa-solid fa-plus"></i> Añadir Campeón
                            </button>
                        </div>
                        <div class="lane-pool-chips">
                            ${champChipsHTML.length > 0 ? champChipsHTML : '<span style="font-size:0.75rem; color:var(--text-muted);">Sin campeones asignados. Pulsa Añadir.</span>'}
                        </div>
                    </div>
                `;
            }).join('');
        }

        const deleteBtnHTML = state.summoners.length > 2 ? `
            <button class="delete-summoner-btn" onclick="deleteSummonerFromRoster(${sum.id})" title="Eliminar de la plantilla">
                <i class="fa-solid fa-user-minus"></i> Eliminar
            </button>
        ` : '';

        card.innerHTML = `
            <div class="summoner-card-header">
                <div class="summoner-avatar-box">
                    <img src="${iconUrl}" class="summoner-avatar-img" alt="Avatar Invocador">
                    <div class="summoner-name-wrapper">
                        <input type="text" class="summoner-name-input" value="${escapeHtml(sum.name)}" 
                               placeholder="Nombre#TAG (ej: Layvel#LAS)"
                               onchange="updateSummonerName(${sum.id}, this.value)">
                        <button class="riot-search-btn" onclick="searchRiotSummoner(${sum.id})">
                            <i class="fa-solid fa-satellite-dish"></i> ${sum.verified ? `Niv. ${sum.level || 1124} Verificado` : 'Conectar Riot API'}
                        </button>
                    </div>
                </div>
                ${deleteBtnHTML}
            </div>
            
            <div class="lanes-selector-title">Líneas de Preferencia (${sum.preferredLanes.length} seleccionadas):</div>
            <div class="lanes-options-group">
                ${linesHTML}
            </div>

            <div class="lanes-selector-title" style="margin-top: 0.6rem;">Campeones por Línea:</div>
            <div class="summoner-pools-container">
                ${poolsHTML}
            </div>
        `;
        grid.appendChild(card);
    });
}

function addNewSummonerToRoster() {
    const nextNum = state.summoners.length + 1;
    const newSum = {
        id: Date.now(),
        name: `Invocador ${nextNum}`,
        profileIconId: 7117 + (nextNum * 3),
        level: 300,
        verified: false,
        preferredLanes: ['MID', 'TOP'],
        pools: {
            'MID': ['Ahri', 'Yasuo'],
            'TOP': ['Riven', 'Garen']
        }
    };
    state.summoners.push(newSum);
    renderSummonersGrid();
    saveRosterConfig();
}

function deleteSummonerFromRoster(summonerId) {
    if (state.summoners.length <= 2) {
        alert('Se requieren al menos 2 invocadores en la plantilla.');
        return;
    }
    if (!confirm('¿Eliminar a este invocador de la plantilla?')) return;
    state.summoners = state.summoners.filter(s => s.id !== summonerId);
    renderSummonersGrid();
    saveRosterConfig();
}

function saveRosterConfig() {
    localStorage.setItem('LOL_TEAM_SUMMONERS_ROSTER', JSON.stringify(state.summoners));
    try {
        fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SAVE_ROSTER', summoners: state.summoners })
        });
    } catch(e) {}
    updateCloudStatusBadge('online', '🟢 Plantilla Guardada');
    alert('¡Plantilla de invocadores y campeones guardada en la nube con éxito!');
}

function updateSummonerName(summonerId, newName) {
    const sum = state.summoners.find(s => s.id === summonerId);
    if (sum) {
        sum.name = newName.trim() || `Invocador ${summonerId}`;
        saveRosterConfig();
    }
}

function toggleSummonerLane(summonerId, laneId, isChecked) {
    const sum = state.summoners.find(s => s.id === summonerId);
    if (!sum) return;

    if (isChecked) {
        if (!sum.preferredLanes.includes(laneId)) {
            sum.preferredLanes.push(laneId);
            if (!sum.pools[laneId] || sum.pools[laneId].length === 0) {
                sum.pools[laneId] = META_SUGGESTIONS[laneId] ? META_SUGGESTIONS[laneId].slice(0, 3) : ['Ahri', 'Yasuo'];
            }
        }
    } else {
        sum.preferredLanes = sum.preferredLanes.filter(l => l !== laneId);
    }

    renderSummonersGrid();
    saveRosterConfig();
}

function presetStandardTeam() {
    state.summoners.forEach((s, idx) => {
        const laneKeys = ['TOP', 'JUNGLE', 'MID', 'BOT', 'SUPPORT'];
        const primary = laneKeys[idx % 5];
        const secondary = laneKeys[(idx + 1) % 5];
        s.preferredLanes = [primary, secondary];
        s.pools = {};
        s.pools[primary] = META_SUGGESTIONS[primary] ? META_SUGGESTIONS[primary].slice(0, 3) : ['Ahri'];
        s.pools[secondary] = META_SUGGESTIONS[secondary] ? META_SUGGESTIONS[secondary].slice(0, 2) : ['Yasuo'];
    });

    renderSummonersGrid();
    saveRosterConfig();
}

async function searchRiotSummoner(summonerId) {
    const sum = state.summoners.find(s => s.id === summonerId);
    if (!sum) return;

    const inputName = sum.name;
    try {
        const resp = await fetch(`/api/summoner?region=las&name=${encodeURIComponent(inputName)}`);
        const data = await resp.json();
        if (data && data.success) {
            sum.verified = true;
            sum.profileIconId = data.iconId;
            sum.level = data.level;
            if (data.mainChamps && data.mainChamps.length > 0) {
                sum.preferredLanes.forEach(l => {
                    if (!sum.pools[l]) sum.pools[l] = [];
                    data.mainChamps.slice(0, 2).forEach(c => {
                        if (!sum.pools[l].includes(c)) sum.pools[l].push(c);
                    });
                });
            }
            renderSummonersGrid();
            saveRosterConfig();
            alert(`¡Invocador ${inputName} verificado con éxito en Riot API (Nivel ${data.level})!`);
        }
    } catch(e) {
        alert('No se pudo verificar en Riot API. Verifica que el nombre esté en formato Nombre#TAG.');
    }
}

/* ===================================================
   CHAMPION PICKER MODAL ENGINE
   =================================================== */

function openChampPickerForLane(summonerId, laneId) {
    state.modalTargetSummonerId = summonerId;
    state.modalTargetLaneId = laneId;
    state.modalRoleFilter = 'ALL';
    state.modalSearchQuery = '';

    const label = document.getElementById('modalTargetLabel');
    const sum = state.summoners.find(s => s.id === summonerId);
    const line = LINES.find(l => l.id === laneId);

    if (label) label.textContent = `${line?.name || laneId} - ${sum?.name || 'Invocador'}`;

    const searchInput = document.getElementById('champSearchInput');
    if (searchInput) searchInput.value = '';

    renderModalChampions();
    document.getElementById('champPickerModal').style.display = 'flex';
}

function closeChampModal() {
    document.getElementById('champPickerModal').style.display = 'none';
    state.modalTargetSummonerId = null;
    state.modalTargetLaneId = null;
}

function filterChampions() {
    state.modalSearchQuery = (document.getElementById('champSearchInput')?.value || '').toLowerCase().trim();
    renderModalChampions();
}

function setModalRoleFilter(role) {
    state.modalRoleFilter = role;
    document.querySelectorAll('#modalRoleFilters .pill').forEach(p => {
        p.classList.toggle('active', p.textContent.toLowerCase().includes(role.toLowerCase()) || (role === 'ALL' && p.textContent === 'Todos'));
    });
    renderModalChampions();
}

function renderModalChampions() {
    const grid = document.getElementById('modalChampsGrid');
    if (!grid) return;

    const list = state.championsList.filter(c => {
        const matchesQuery = c.name.toLowerCase().includes(state.modalSearchQuery) || c.id.toLowerCase().includes(state.modalSearchQuery);
        const matchesRole = state.modalRoleFilter === 'ALL' || (c.tags && c.tags.includes(state.modalRoleFilter));
        return matchesQuery && matchesRole;
    });

    grid.innerHTML = list.map(c => {
        const imgUrl = `https://ddragon.leagueoflegends.com/cdn/${state.version}/img/champion/${c.id}.png`;
        return `
            <div class="champ-card-item" onclick="selectChampionForPool('${c.id}')">
                <img src="${imgUrl}" class="champ-card-avatar" alt="${c.name}">
                <span class="champ-card-name">${escapeHtml(c.name)}</span>
            </div>
        `;
    }).join('');
}

function selectChampionForPool(champKey) {
    if (!state.modalTargetSummonerId || !state.modalTargetLaneId) return;

    const sum = state.summoners.find(s => s.id === state.modalTargetSummonerId);
    if (sum) {
        if (!sum.pools[state.modalTargetLaneId]) sum.pools[state.modalTargetLaneId] = [];
        if (!sum.pools[state.modalTargetLaneId].includes(champKey)) {
            sum.pools[state.modalTargetLaneId].push(champKey);
        }
        renderSummonersGrid();
        saveRosterConfig();
    }
    closeChampModal();
}

function removeChampFromLane(summonerId, laneId, champKey) {
    const sum = state.summoners.find(s => s.id === summonerId);
    if (sum && sum.pools && sum.pools[laneId]) {
        sum.pools[laneId] = sum.pools[laneId].filter(c => c !== champKey);
        renderSummonersGrid();
        saveRosterConfig();
    }
}

/* ===================================================
   SECTION 2: MATCH TRACKER & CLOUD PERSISTENCE
   =================================================== */

async function loadMatchesFromCloud() {
    updateCloudStatusBadge('syncing', 'Sincronizando...');
    try {
        const resp = await fetch('/api/matches');
        const data = await resp.json();
        if (data && data.success && Array.isArray(data.matches)) {
            state.matchesHistory = data.matches;
            localStorage.setItem('LOL_TEAM_MATCHES_HISTORY', JSON.stringify(state.matchesHistory));
            updateCloudStatusBadge('online', '🟢 Sincronizado en Nube');
        }
    } catch (e) {
        console.warn('Using local matches history:', e.message);
        updateCloudStatusBadge('online', '🟡 Guardado Local Activo');
    }

    if (state.currentStep === 'history') renderMatchesHistory();
    else if (state.currentStep === 'analytics') renderAnalyticsDashboard();
}

function updateCloudStatusBadge(status, text) {
    const badge = document.getElementById('cloudStatusBadge');
    const textEl = document.getElementById('cloudStatusText');
    if (textEl) textEl.textContent = text;
    if (badge) {
        badge.className = `api-status-badge status-${status}`;
    }
}

async function saveMatchToCloud(matchObj) {
    updateCloudStatusBadge('syncing', 'Guardando...');
    state.matchesHistory.unshift(matchObj);
    localStorage.setItem('LOL_TEAM_MATCHES_HISTORY', JSON.stringify(state.matchesHistory));

    try {
        await fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ADD_MATCH', match: matchObj })
        });
        updateCloudStatusBadge('online', '🟢 Sincronizado en Nube');
    } catch (e) {
        updateCloudStatusBadge('online', '🟡 Guardado Localmente');
    }

    renderMatchesHistory();
    renderAnalyticsDashboard();
}

async function deleteMatchFromHistory(matchId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta partida del registro del equipo?')) return;

    state.matchesHistory = state.matchesHistory.filter(m => m.id !== matchId);
    localStorage.setItem('LOL_TEAM_MATCHES_HISTORY', JSON.stringify(state.matchesHistory));

    try {
        await fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'DELETE_MATCH', matchId: matchId })
        });
    } catch (e) {}

    renderMatchesHistory();
    renderAnalyticsDashboard();
}

function renderMatchesHistory() {
    const listEl = document.getElementById('matchesHistoryList');
    if (!listEl) return;

    const total = state.matchesHistory.length;
    const victories = state.matchesHistory.filter(m => m.result === 'VICTORY').length;
    const defeats = state.matchesHistory.filter(m => m.result === 'DEFEAT').length;
    const winrate = total > 0 ? Math.round((victories / total) * 100) : 0;

    const elTotal = document.getElementById('kpiTotalMatches');
    const elVic = document.getElementById('kpiVictories');
    const elDef = document.getElementById('kpiDefeats');
    const elWr = document.getElementById('kpiWinrate');

    if (elTotal) elTotal.textContent = total;
    if (elVic) elVic.textContent = victories;
    if (elDef) elDef.textContent = defeats;
    if (elWr) elWr.textContent = `${winrate}%`;

    const search = (document.getElementById('historySearchInput')?.value || '').toLowerCase().trim();
    let filtered = state.matchesHistory.filter(m => {
        if (state.historyFilterResult === 'VICTORY' && m.result !== 'VICTORY') return false;
        if (state.historyFilterResult === 'DEFEAT' && m.result !== 'DEFEAT') return false;
        if (search) {
            const hasChamp = m.players.some(p => (p.champion || '').toLowerCase().includes(search));
            const hasNotes = (m.notes || '').toLowerCase().includes(search);
            const hasSummoner = m.players.some(p => (p.summonerName || '').toLowerCase().includes(search));
            if (!hasChamp && !hasNotes && !hasSummoner) return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: rgba(9,20,40,0.6); border: 1px dashed var(--gold-dark); border-radius: 8px;">
                <i class="fa-solid fa-folder-open" style="font-size: 3rem; color: var(--gold-primary); margin-bottom: 1rem;"></i>
                <h3 style="color: var(--gold-bright); font-family: var(--font-heading); margin-bottom: 0.5rem;">No hay partidas registradas con este filtro</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Registra las partidas jugadas con tus amigos o impórtalas con Riot API.</p>
                <button class="hextech-btn primary large-glow" onclick="openRegisterMatchModal()">
                    <i class="fa-solid fa-plus-circle"></i> + Registrar Nueva Partida
                </button>
            </div>
        `;
        return;
    }

    listEl.innerHTML = filtered.map(m => {
        const isVictory = m.result === 'VICTORY';
        const dateStr = new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

        const playersHTML = m.players.map(p => {
            const cObj = state.championsDict[p.champion] || { id: p.champion, name: p.champion };
            const champImg = `https://ddragon.leagueoflegends.com/cdn/${state.version}/img/champion/${cObj.id || p.champion}.png`;
            const kdaText = `${p.kills} / ${p.deaths} / ${p.assists}`;
            return `
                <div class="player-match-badge">
                    <img src="${champImg}" class="player-champ-icon" alt="${p.champion}" onerror="this.src='https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/7117.png'">
                    <div class="player-badge-info">
                        <span class="player-name-text">${escapeHtml(p.summonerName)}</span>
                        <span class="player-role-line"><i class="fa-solid fa-shield"></i> ${p.lane} - ${escapeHtml(cObj.name || p.champion)}</span>
                        <span class="player-kda-stat">KDA: ${kdaText}</span>
                    </div>
                </div>
            `;
        }).join('');

        const notesHTML = m.notes ? `
            <div class="match-card-notes">
                <i class="fa-solid fa-comment-dots"></i> <strong>Puntos de Aprendizaje:</strong> ${escapeHtml(m.notes)}
            </div>
        ` : '';

        return `
            <div class="match-history-card ${isVictory ? 'victory-card' : 'defeat-card'}">
                <div class="match-card-header">
                    <div class="match-header-left">
                        <span class="badge-result ${isVictory ? 'victory' : 'defeat'}">
                            <i class="fa-solid ${isVictory ? 'fa-trophy' : 'fa-skull'}"></i> ${isVictory ? 'VICTORIA' : 'DERROTA'}
                        </span>
                        <span class="match-date-info"><i class="fa-solid fa-calendar"></i> ${dateStr} &bull; ${m.players.length} Amigos en Equipo</span>
                    </div>
                    <div class="match-header-right">
                        <span class="match-duration-tag"><i class="fa-solid fa-clock"></i> ${escapeHtml(m.duration || '25 min')}</span>
                        <button class="delete-match-btn" onclick="deleteMatchFromHistory('${m.id}')" title="Eliminar partida">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
                <div class="match-players-row">
                    ${playersHTML}
                </div>
                ${notesHTML}
            </div>
        `;
    }).join('');
}

function filterHistoryResult(res) {
    state.historyFilterResult = res;
    document.querySelectorAll('.filter-pills .pill').forEach(p => p.classList.remove('active'));
    if (res === 'ALL') document.getElementById('filterResultAll')?.classList.add('active');
    else if (res === 'VICTORY') document.getElementById('filterResultVictory')?.classList.add('active');
    else if (res === 'DEFEAT') document.getElementById('filterResultDefeat')?.classList.add('active');
    renderMatchesHistory();
}

/* ===================================================
   MODAL REGISTER MATCH HANDLING (DYNAMIC SQUAD PARTICIPANTS)
   =================================================== */

function openRegisterMatchModal() {
    const grid = document.getElementById('registerMatchPlayersGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const defaultLanes = ['TOP', 'JUNGLE', 'MID', 'BOT', 'SUPPORT'];

    state.summoners.forEach((s, i) => {
        const isCheckedDefault = i < 5;
        const laneId = s.preferredLanes[0] || defaultLanes[i % 5] || 'MID';
        const defaultChamp = (s.pools && s.pools[laneId] && s.pools[laneId][0]) ? s.pools[laneId][0] : 'Ahri';

        const row = document.createElement('div');
        row.className = 'player-input-row';
        row.style.opacity = isCheckedDefault ? '1' : '0.4';
        row.innerHTML = `
            <div class="player-name-badge">
                <input type="checkbox" class="player-active-checkbox" name="playerActive_${i}" ${isCheckedDefault ? 'checked' : ''} onchange="this.closest('.player-input-row').style.opacity = this.checked ? '1' : '0.4'">
                <i class="fa-solid fa-user-shield"></i>
                <span style="font-weight:700;">${escapeHtml(s.name)}</span>
                <input type="hidden" name="playerSummonerName_${i}" value="${escapeHtml(s.name)}">
            </div>
            <select class="select-line-input" name="playerLane_${i}">
                <option value="TOP" ${laneId === 'TOP' ? 'selected' : ''}>Top</option>
                <option value="JUNGLE" ${laneId === 'JUNGLE' ? 'selected' : ''}>Jungla</option>
                <option value="MID" ${laneId === 'MID' ? 'selected' : ''}>Mid</option>
                <option value="BOT" ${laneId === 'BOT' ? 'selected' : ''}>Bot / ADC</option>
                <option value="SUPPORT" ${laneId === 'SUPPORT' ? 'selected' : ''}>Soporte</option>
            </select>
            <input type="text" class="select-champ-input" name="playerChampion_${i}" placeholder="Campeón" value="${defaultChamp}">
            <div class="kda-input-group">
                <input type="number" name="playerKills_${i}" value="5" min="0" title="Asesinatos (Kills)">
                <span class="kda-slash">/</span>
                <input type="number" name="playerDeaths_${i}" value="2" min="0" title="Muertes (Deaths)">
                <span class="kda-slash">/</span>
                <input type="number" name="playerAssists_${i}" value="8" min="0" title="Asistencias (Assists)">
            </div>
        `;
        grid.appendChild(row);
    });

    document.getElementById('matchRegisterModal').style.display = 'flex';
}

function closeMatchRegisterModal() {
    document.getElementById('matchRegisterModal').style.display = 'none';
}

function handleSaveMatchSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const result = form.querySelector('input[name="matchResult"]:checked')?.value || 'VICTORY';
    const duration = document.getElementById('matchDurationInput')?.value || '25 min';
    const notes = document.getElementById('matchNotesInput')?.value || '';

    const players = [];
    state.summoners.forEach((s, i) => {
        const isActive = form.querySelector(`input[name="playerActive_${i}"]`)?.checked;
        if (isActive) {
            const sumName = form.querySelector(`input[name="playerSummonerName_${i}"]`)?.value || s.name;
            const lane = form.querySelector(`select[name="playerLane_${i}"]`)?.value || 'MID';
            const champ = form.querySelector(`input[name="playerChampion_${i}"]`)?.value || 'Ahri';
            const kills = parseInt(form.querySelector(`input[name="playerKills_${i}"]`)?.value || 0);
            const deaths = parseInt(form.querySelector(`input[name="playerDeaths_${i}"]`)?.value || 0);
            const assists = parseInt(form.querySelector(`input[name="playerAssists_${i}"]`)?.value || 0);

            players.push({
                summonerName: sumName,
                lane: lane,
                champion: champ,
                kills: kills,
                deaths: deaths,
                assists: assists
            });
        }
    });

    if (players.length < 2) {
        alert('Debes seleccionar al menos 2 amigos participantes para registrar la partida.');
        return;
    }

    const newMatch = {
        id: 'match-' + Date.now(),
        date: new Date().toISOString(),
        duration: duration,
        result: result,
        notes: notes,
        players: players
    };

    saveMatchToCloud(newMatch);
    closeMatchRegisterModal();
    switchStep('history');
}

async function fetchRecentMatchesFromRiot() {
    const mainSummoner = state.summoners[0]?.name || 'Layvel#LAS';
    updateCloudStatusBadge('syncing', 'Consultando Riot API...');

    try {
        const resp = await fetch(`/api/riot-matches?name=${encodeURIComponent(mainSummoner)}&region=las`);
        const data = await resp.json();

        if (data && data.success && Array.isArray(data.matches)) {
            let addedCount = 0;
            data.matches.forEach(newM => {
                const exists = state.matchesHistory.some(existingM => existingM.id === newM.id);
                if (!exists) {
                    state.matchesHistory.unshift(newM);
                    addedCount++;
                }
            });

            localStorage.setItem('LOL_TEAM_MATCHES_HISTORY', JSON.stringify(state.matchesHistory));
            
            try {
                await fetch('/api/matches', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'IMPORT_ALL', matches: state.matchesHistory })
                });
            } catch(e) {}

            updateCloudStatusBadge('online', '🟢 Sincronizado en Nube');
            renderMatchesHistory();
            renderAnalyticsDashboard();

            alert(`⚡ ¡Consulta de Riot API completada!\nSe agregaron ${addedCount} partidas recientes encontradas para ${mainSummoner}.`);
        } else {
            throw new Error('No se pudieron obtener partidas');
        }
    } catch (err) {
        console.error('Error fetching recent Riot matches:', err);
        updateCloudStatusBadge('online', '🟡 Error API (Caché local)');
        alert('No se pudo conectar a la API de Riot en este momento. Intenta de nuevo.');
    }
}

/* ===================================================
   SECTION 3: ANALYTICS DASHBOARD & DUO SYNERGY MATRIX
   =================================================== */

function renderAnalyticsDashboard() {
    const tbody = document.getElementById('analyticsSummonersTbody');
    const lanesContainer = document.getElementById('lanesWinrateContainer');
    const notesFeed = document.getElementById('improvementNotesFeed');
    if (!tbody || !lanesContainer) return;

    // 1. Calculate per-summoner stats
    const summonerStats = {};
    state.summoners.forEach(s => {
        summonerStats[s.name.toLowerCase()] = {
            displayName: s.name,
            totalGames: 0, wins: 0, losses: 0,
            totalKills: 0, totalDeaths: 0, totalAssists: 0,
            championsCount: {}
        };
    });

    state.matchesHistory.forEach(m => {
        const isWin = m.result === 'VICTORY';
        m.players.forEach(p => {
            const key = (p.summonerName || '').toLowerCase();
            if (!summonerStats[key]) {
                summonerStats[key] = {
                    displayName: p.summonerName,
                    totalGames: 0, wins: 0, losses: 0,
                    totalKills: 0, totalDeaths: 0, totalAssists: 0,
                    championsCount: {}
                };
            }
            const st = summonerStats[key];
            st.totalGames++;
            if (isWin) st.wins++; else st.losses++;
            st.totalKills += p.kills || 0;
            st.totalDeaths += p.deaths || 0;
            st.totalAssists += p.assists || 0;
            if (p.champion) {
                st.championsCount[p.champion] = (st.championsCount[p.champion] || 0) + 1;
            }
        });
    });

    tbody.innerHTML = Object.values(summonerStats).map(st => {
        const wr = st.totalGames > 0 ? Math.round((st.wins / st.totalGames) * 100) : 0;
        const avgKda = st.totalGames > 0 
            ? ((st.totalKills + st.totalAssists) / Math.max(1, st.totalDeaths)).toFixed(1)
            : '0.0';
        
        let favChamp = '-';
        let maxCount = 0;
        Object.entries(st.championsCount).forEach(([ch, cnt]) => {
            if (cnt > maxCount) { maxCount = cnt; favChamp = ch; }
        });

        const cObj = state.championsDict[favChamp] || { name: favChamp };

        return `
            <tr>
                <td><strong>${escapeHtml(st.displayName)}</strong></td>
                <td>${st.totalGames}</td>
                <td><span style="color: #1dd1a1;">${st.wins}V</span> / <span style="color: #ff4757;">${st.losses}D</span></td>
                <td><strong style="color: var(--cyan-hextech);">${wr}%</strong></td>
                <td>${avgKda}</td>
                <td>${escapeHtml(cObj.name || favChamp)}</td>
            </tr>
        `;
    }).join('');

    // 2. Render Duo Synergy Matrix
    renderSynergyMatrix();

    // 3. Calculate lane winrates
    const laneStats = {
        TOP: { games: 0, wins: 0 },
        JUNGLE: { games: 0, wins: 0 },
        MID: { games: 0, wins: 0 },
        BOT: { games: 0, wins: 0 },
        SUPPORT: { games: 0, wins: 0 }
    };

    state.matchesHistory.forEach(m => {
        const isWin = m.result === 'VICTORY';
        m.players.forEach(p => {
            if (laneStats[p.lane]) {
                laneStats[p.lane].games++;
                if (isWin) laneStats[p.lane].wins++;
            }
        });
    });

    const laneNames = { TOP: 'Top Lane', JUNGLE: 'Jungla', MID: 'Mid Lane', BOT: 'Bot / ADC', SUPPORT: 'Soporte' };
    const laneIcons = { TOP: 'fa-shield-halved', JUNGLE: 'fa-tree', MID: 'fa-wand-magic-sparkles', BOT: 'fa-crosshairs', SUPPORT: 'fa-heart' };

    lanesContainer.innerHTML = Object.keys(laneStats).map(lKey => {
        const l = laneStats[lKey];
        const wr = l.games > 0 ? Math.round((l.wins / l.games) * 100) : 0;
        return `
            <div class="lane-winrate-item">
                <div class="lane-win-header">
                    <span class="lane-name-label"><i class="fa-solid ${laneIcons[lKey]}"></i> ${laneNames[lKey]}</span>
                    <span class="lane-win-rate-value">${wr}% (${l.wins}/${l.games})</span>
                </div>
                <div class="winrate-bar-container">
                    <div class="winrate-bar-fill ${wr >= 60 ? 'high-wr' : ''}" style="width: ${wr}%;"></div>
                </div>
            </div>
        `;
    }).join('');

    // 4. Improvement Notes Feed
    const allNotes = state.matchesHistory.filter(m => m.notes && m.notes.trim());
    if (!notesFeed) return;

    if (allNotes.length === 0) {
        notesFeed.innerHTML = `<p style="color: var(--text-secondary); font-style: italic;">No hay notas grabadas aún. Escribe puntos a mejorar cuando registres partidas.</p>`;
    } else {
        notesFeed.innerHTML = allNotes.map(m => {
            const dateStr = new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
            return `
                <div class="note-item-card">
                    <i class="fa-solid fa-lightbulb"></i>
                    <div>
                        <strong style="color: var(--gold-bright); font-size: 0.85rem;">Partida (${dateStr} - ${m.result}):</strong>
                        <p style="color: var(--text-primary); margin-top: 0.2rem;">${escapeHtml(m.notes)}</p>
                    </div>
                </div>
            `;
        }).join('');
    }
}

function renderSynergyMatrix() {
    const container = document.getElementById('synergyMatrixContainer');
    if (!container) return;

    const duoStats = {};

    state.matchesHistory.forEach(m => {
        const isWin = m.result === 'VICTORY';
        const participantNames = m.players.map(p => (p.summonerName || '').trim().toLowerCase()).filter(Boolean);

        for (let i = 0; i < participantNames.length; i++) {
            for (let j = i + 1; j < participantNames.length; j++) {
                const p1 = participantNames[i];
                const p2 = participantNames[j];
                const key = [p1, p2].sort().join('___');

                if (!duoStats[key]) {
                    const name1 = m.players.find(p => p.summonerName.toLowerCase() === p1)?.summonerName || p1;
                    const name2 = m.players.find(p => p.summonerName.toLowerCase() === p2)?.summonerName || p2;
                    duoStats[key] = { name1, name2, games: 0, wins: 0 };
                }

                duoStats[key].games++;
                if (isWin) duoStats[key].wins++;
            }
        }
    });

    const duosArray = Object.values(duoStats);
    if (duosArray.length === 0) {
        container.innerHTML = `<p style="color: var(--text-secondary); font-style: italic;">Registra partidas con 2 o más amigos para calcular automáticamente la matriz de sinergias.</p>`;
        return;
    }

    let bestDuoKey = null;
    let maxWR = -1;
    duosArray.forEach(d => {
        const wr = d.games > 0 ? (d.wins / d.games) : 0;
        if (d.games >= 2 && wr > maxWR) {
            maxWR = wr;
            bestDuoKey = `${d.name1.toLowerCase()}___${d.name2.toLowerCase()}`;
        }
    });

    container.innerHTML = duosArray.map(d => {
        const wr = d.games > 0 ? Math.round((d.wins / d.games) * 100) : 0;
        const currentKey = [d.name1.toLowerCase(), d.name2.toLowerCase()].sort().join('___');
        const isBest = currentKey === bestDuoKey;

        return `
            <div class="synergy-card ${isBest ? 'best-duo' : ''}">
                ${isBest ? '<span class="synergy-best-tag"><i class="fa-solid fa-crown"></i> Mejor Dupla</span>' : ''}
                <div class="synergy-duo-names">
                    <i class="fa-solid fa-handshake" style="color: var(--gold-primary)"></i> ${escapeHtml(d.name1)} + ${escapeHtml(d.name2)}
                </div>
                <div class="synergy-stats-line">
                    <span>Partidas Juntas: <strong>${d.games}</strong></span>
                    <span class="synergy-wr-val">${wr}% (${d.wins}V/${d.games - d.wins}D)</span>
                </div>
                <div class="winrate-bar-container" style="height: 6px; margin-top: 0.3rem;">
                    <div class="winrate-bar-fill ${wr >= 60 ? 'high-wr' : ''}" style="width: ${wr}%;"></div>
                </div>
            </div>
        `;
    }).join('');
}

/* ===================================================
   EXPORT & IMPORT JSON BACKUPS
   =================================================== */

function exportMatchesJSON() {
    const data = {
        app: "LOL_SQUAD_TRACKER",
        version: state.version,
        timestamp: new Date().toISOString(),
        summoners: state.summoners,
        matches: state.matchesHistory
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `lol_squad_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function importMatchesJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (parsed && Array.isArray(parsed.matches)) {
                state.matchesHistory = parsed.matches;
                if (Array.isArray(parsed.summoners)) {
                    state.summoners = parsed.summoners;
                }
                localStorage.setItem('LOL_TEAM_MATCHES_HISTORY', JSON.stringify(state.matchesHistory));
                localStorage.setItem('LOL_TEAM_SUMMONERS_ROSTER', JSON.stringify(state.summoners));
                
                try {
                    await fetch('/api/matches', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'IMPORT_ALL', matches: state.matchesHistory })
                    });
                } catch(err) {}

                alert('¡Respaldo importado correctamente!');
                renderSummonersGrid();
                renderMatchesHistory();
                renderAnalyticsDashboard();
            } else {
                alert('El archivo JSON no contiene una estructura válida de historial de partidas.');
            }
        } catch (err) {
            alert('Error al leer el archivo JSON: ' + err.message);
        }
    };
    reader.readAsText(file);
}

// UTILITY HELPERS
function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
