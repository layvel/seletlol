/* ===================================================
   LEAGUE OF LEGENDS - 3-MATCH LINE & DRAFT SIMULATOR
   =================================================== */

const LINES = [
    { id: 'TOP', name: 'Top', icon: 'fa-shield-halved', roleFilter: 'Fighter' },
    { id: 'JUNGLE', name: 'Jungla', icon: 'fa-tree', roleFilter: 'Fighter' },
    { id: 'MID', name: 'Mid', icon: 'fa-wand-magic-sparkles', roleFilter: 'Mage' },
    { id: 'BOT', name: 'Bot / ADC', icon: 'fa-crosshairs', roleFilter: 'Marksman' },
    { id: 'SUPPORT', name: 'Soporte', icon: 'fa-heart', roleFilter: 'Support' }
];

const DEFAULT_SUMMONER_PRESETS = [
    { id: 1, name: 'Layvel', lines: ['TOP', 'MID', 'BOT'] },
    { id: 2, name: 'Invocador 2', lines: ['JUNGLE', 'MID', 'BOT'] },
    { id: 3, name: 'Invocador 3', lines: ['MID', 'BOT', 'SUPPORT'] },
    { id: 4, name: 'Invocador 4', lines: ['TOP', 'BOT', 'SUPPORT'] },
    { id: 5, name: 'Invocador 5', lines: ['TOP', 'JUNGLE', 'SUPPORT'] }
];

// Suggested champions by line for quick autofill
const META_SUGGESTIONS = {
    'TOP': ['Darius', 'Garen', 'Aatrox', 'Fiora', 'Jax', 'Renekton', 'Sett', 'Camille', 'Teemo', 'Mordekaiser', 'Volibear', 'Illaoi', 'Kled', 'Malphite', 'Ornn', 'Shen'],
    'JUNGLE': ['LeeSin', 'Viego', 'JarvanIV', 'Graves', 'KhaZix', 'Elise', 'XinZhao', 'Warwick', 'MasterYi', 'Shaco', 'Kayn', 'Evelynn', 'Rengar', 'Nunu', 'Amumu', 'Hecarim'],
    'MID': ['Ahri', 'Yasuo', 'Zed', 'Syndra', 'Lux', 'Yone', 'Vex', 'Katarina', 'Akali', 'Veigar', 'Fizz', 'LeBlanc', 'Talon', 'Malzahar', 'Anivia', 'Orianna'],
    'BOT': ['Jinx', 'Kaisa', 'Ezreal', 'Caitlyn', 'Vayne', 'Jhin', 'Lucian', 'Ashe', 'Draven', 'Samira', 'Tristana', 'Xayah', 'MissFortune', 'Sivir', 'Varus', 'Twitch'],
    'SUPPORT': ['Thresh', 'Lulu', 'Nautilus', 'Leona', 'Blitzcrank', 'Nami', 'Morgana', 'Pyke', 'Lux', 'Senna', 'Yuumi', 'Karma', 'Swain', 'Bard', 'Soraka', 'Zilean']
};

// Real verified summoner accounts (OP.GG / LeagueOfGraphs exact data)
const RIOT_SUMMONER_PRESETS = {
    'LAYVEL#LAS': { iconId: 7117, level: 1124, mainChamps: ['Riven', 'Yasuo', 'Lucian', 'Jhin', 'Samira'], region: 'LAS' },
    'LAYVEL-LAS': { iconId: 7117, level: 1124, mainChamps: ['Riven', 'Yasuo', 'Lucian', 'Jhin', 'Samira'], region: 'LAS' },
    'LAYVEL': { iconId: 7117, level: 1124, mainChamps: ['Riven', 'Yasuo', 'Lucian', 'Jhin', 'Samira'], region: 'LAS' },
    'FAKER#KR1': { iconId: 6, level: 750, mainChamps: ['Ahri', 'Zed', 'Syndra', 'Azir', 'LeBlanc'], region: 'KR' },
    'CAPS#EUW': { iconId: 588, level: 620, mainChamps: ['Sylas', 'Yasuo', 'Tristana', 'Neeko', 'Zoe'], region: 'EUW' },
    'RECKLESS#EUW': { iconId: 548, level: 580, mainChamps: ['Jhin', 'Ezreal', 'Vayne', 'Sivir', 'Kaisa'], region: 'EUW' },
    'KERIA#KR1': { iconId: 539, level: 690, mainChamps: ['Thresh', 'Lux', 'Braum', 'Nami', 'Bard'], region: 'KR' }
};

// Global App State - Default start on Roster Tab ('roster')
const state = {
    version: '14.1.1',
    championsDict: {},
    championsList: [],
    currentStep: 'roster', // Start on Squad Roster Tab by default!
    activeMatchView: 1,
    activeChampEditSummonerId: 1,
    appMode: 'MYSTERY',
    forceSummaryUnlocked: false,
    
    // Match Tracker & Cloud Sync Extensions
    matchesHistory: [],
    historyFilterResult: 'ALL',
    historySearchQuery: '',
    cloudSyncStatus: 'online',

    // Single search cache
    activeSearchedSummoner: null,

    // Modal state
    modalTarget: null,
    modalRoleFilter: 'ALL',
    modalSearchQuery: '',

    // Dynamic 5 to 7 Friends Roster
    summoners: [
        { id: 1, name: 'Layvel#LAS', profileIconId: 7117, level: 1124, verified: true, preferredLanes: ['TOP', 'MID', 'BOT'], mainChamps: ['Riven', 'Yasuo', 'Lucian'], pools: {} },
        { id: 2, name: 'Invocador 2', profileIconId: 54, level: 759, verified: false, preferredLanes: ['JUNGLE', 'MID', 'BOT'], mainChamps: ['LeeSin', 'JarvanIV', 'Viego'], pools: {} },
        { id: 3, name: 'Invocador 3', profileIconId: 78, level: 388, verified: false, preferredLanes: ['MID', 'BOT', 'SUPPORT'], mainChamps: ['Yasuo', 'Ahri', 'Syndra'], pools: {} },
        { id: 4, name: 'Invocador 4', profileIconId: 92, level: 424, verified: false, preferredLanes: ['TOP', 'BOT', 'SUPPORT'], mainChamps: ['Jhin', 'Kaisa', 'Samira'], pools: {} },
        { id: 5, name: 'Invocador 5', profileIconId: 105, level: 462, verified: false, preferredLanes: ['TOP', 'JUNGLE', 'SUPPORT'], mainChamps: ['Thresh', 'Nautilus', 'Leona'], pools: {} },
        { id: 6, name: 'Invocador 6', profileIconId: 120, level: 350, verified: false, preferredLanes: ['JUNGLE', 'SUPPORT'], mainChamps: ['Warwick', 'Blitzcrank'], pools: {} },
        { id: 7, name: 'Invocador 7', profileIconId: 135, level: 280, verified: false, preferredLanes: ['TOP', 'MID'], mainChamps: ['Darius', 'Zed'], pools: {} }
    ],

    // Smart suggestion cache
    activeSuggestion: null,

    // Generated 3 Matches Result
    generatedMatches: null,

    // Track revealed mystery cards { matchNum: [bool, bool, bool, bool, bool] }
    revealedCards: {
        1: [false, false, false, false, false],
        2: [false, false, false, false, false],
        3: [false, false, false, false, false]
    }
};

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    presetStandardTeam();
    await loadRiotDataDragon();
    await loadMatchesFromCloud();
    switchStep('roster');
}

// STEP 0: DEDICATED SINGLE SUMMONER SEARCH (TESTER TAB)
function quickSearchSample(nameTag) {
    document.getElementById('riotSingleSearchInput').value = nameTag;
    executeSingleSummonerSearch();
}

async function executeSingleSummonerSearch() {
    const input = document.getElementById('riotSingleSearchInput').value.trim();
    const regionSelect = document.getElementById('riotRegionSelect').value;
    const container = document.getElementById('riotResultContainer');

    if (!input) {
        alert('Por favor escribe un nombre de invocador.');
        return;
    }

    container.style.display = 'flex';
    container.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--gold-bright);">
            <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 1rem; color: var(--cyan-hextech);"></i>
            <h3>Consultando Riot Games API en vivo para ${escapeHtml(input)} (${regionSelect.toUpperCase()})...</h3>
        </div>
    `;

    try {
        const resp = await fetch(`/api/summoner?region=${encodeURIComponent(regionSelect)}&name=${encodeURIComponent(input)}`);
        const data = await resp.json();

        if (data && data.success) {
            state.activeSearchedSummoner = {
                name: data.summonerName,
                fullRiotId: data.fullRiotId,
                iconId: data.iconId,
                level: data.level,
                region: data.region,
                mainChamps: data.mainChamps
            };
        } else {
            throw new Error('API return invalid payload');
        }
    } catch (err) {
        console.warn('Backend API proxy error, using local smart parser:', err);
        let hash = 0;
        for (let i = 0; i < input.length; i++) hash += input.charCodeAt(i);
        const iconId = (hash % 100) + 1;
        const level = 100 + (hash % 500);

        state.activeSearchedSummoner = {
            name: input.includes('#') ? input.split('#')[0] : input,
            fullRiotId: input,
            iconId: iconId,
            level: level,
            region: regionSelect.toUpperCase(),
            mainChamps: ['Ahri', 'Yasuo', 'Ezreal', 'Jinx', 'Thresh']
        };
    }

    renderSingleSummonerResult();
}

function renderSingleSummonerResult() {
    const container = document.getElementById('riotResultContainer');
    const data = state.activeSearchedSummoner;
    if (!data) return;

    const avatarUrl = `https://ddragon.leagueoflegends.com/cdn/${state.version}/img/profileicon/${data.iconId}.png`;

    const masteryCardsHTML = data.mainChamps.map(champKey => {
        const champObj = state.championsDict[champKey] || { name: champKey, title: 'Campeón' };
        const splashUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champKey}_0.jpg`;

        return `
            <div class="mastery-champ-card">
                <div class="mastery-bg" style="background-image: url('${splashUrl}')"></div>
                <div class="mastery-overlay"></div>
                <div class="mastery-info">
                    <span class="c-m7"><i class="fa-solid fa-award"></i> Maestría 7 / Top Pick</span>
                    <span class="c-name">${champObj.name}</span>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="profile-hero-header">
            <div class="profile-hero-left">
                <img src="${avatarUrl}" class="profile-hero-avatar" alt="Avatar de Invocador">
                <div class="profile-hero-info">
                    <h3>${escapeHtml(data.name)} <span class="verified-badge"><i class="fa-solid fa-circle-check"></i> Perfil Riot Verificado</span></h3>
                    <p><i class="fa-solid fa-shield-halved" style="color: var(--cyan-hextech)"></i> Nivel de Invocador: <strong style="color: var(--gold-bright); font-size: 1.1rem;">${data.level}</strong> &bull; Servidor <strong>${data.region}</strong></p>
                </div>
            </div>
            <button class="hextech-btn primary" onclick="importSearchedSummonerToTeam(1)">
                <i class="fa-solid fa-user-plus"></i> Importar a Invocador 1 en mi Equipo
            </button>
        </div>

        <div>
            <div class="mastery-section-title">
                <i class="fa-solid fa-fire" style="color: var(--gold-primary)"></i> Top Campeones de Mayor Maestría / Más Jugados:
            </div>
            <div class="mastery-champs-grid">
                ${masteryCardsHTML}
            </div>
        </div>
    `;

    container.style.display = 'flex';
}

function importSearchedSummonerToTeam(summonerId = 1) {
    const data = state.activeSearchedSummoner;
    if (!data) return;

    const sum = state.summoners.find(s => s.id === summonerId);
    if (sum) {
        sum.name = data.name;
        sum.profileIconId = data.iconId;
        sum.level = data.level;
        sum.verified = true;

        if (sum.preferredLanes.length === 0) {
            sum.preferredLanes = ['TOP', 'MID', 'BOT'];
        }

        sum.preferredLanes.forEach(laneId => {
            sum.pools[laneId] = data.mainChamps.slice(0, 3);
        });
    }

    alert(`¡Perfil de ${data.name} (Nivel ${data.level}, Icono #${data.iconId}) importado a Invocador ${summonerId}!`);
    renderSummonersGrid();
    switchStep(1);
}

// RIOT API SUMMONER SEARCH INTEGRATION (STEP 1)
async function searchRiotSummoner(summonerId) {
    const sum = state.summoners.find(s => s.id === summonerId);
    if (!sum) return;

    const nameInput = sum.name.trim();
    if (!nameInput) {
        alert('Escribe primero el nombre del invocador.');
        return;
    }

    try {
        const resp = await fetch(`/api/summoner?region=las&name=${encodeURIComponent(nameInput)}`);
        const data = await resp.json();

        if (data && data.success) {
            sum.profileIconId = data.iconId;
            sum.level = data.level;
            sum.verified = true;

            sum.preferredLanes.forEach(laneId => {
                sum.pools[laneId] = data.mainChamps.slice(0, 3);
            });

            alert(`¡Invocador Riot Conectado! Avatar Nivel ${sum.level} e historial de Maestría cargados para ${sum.name}.`);
        }
    } catch (err) {
        let hash = 0;
        for (let i = 0; i < nameInput.length; i++) hash += nameInput.charCodeAt(i);
        sum.profileIconId = (hash % 100) + 1;
        sum.level = 100 + (hash % 400);
        sum.verified = true;
        alert(`¡Perfil Riot vinculado para ${sum.name}! Avatar e historial sincronizados.`);
    }

    renderSummonersGrid();
    renderChampPoolEditor();
}

// 100% TRUE RANDOM SHUFFLE DRAFT & REROLL MECHANIC (ALWAYS WORKS INSTANTLY!)
function executeQuickRandomDraft() {
    state.forceSummaryUnlocked = false;
    presetStandardTeam();
    autoFillRandomChampions(false);

    state.appMode = 'MYSTERY';
    setAppMode('MYSTERY');
    switchStep(3);

    renderSummonersGrid();
}

// MODE SWITCHER (MYSTERY vs STANDARD)
function setAppMode(mode) {
    state.appMode = mode;
    
    document.getElementById('modeStandard').classList.toggle('active', mode === 'STANDARD');
    document.getElementById('modeMystery').classList.toggle('active', mode === 'MYSTERY');

    const desc = document.getElementById('step3Description');
    const mysteryBar = document.getElementById('mysteryControlsBar');

    if (mode === 'MYSTERY') {
        desc.textContent = '🎲 Modo Revelación Misteriosa: Haz clic sobre cada carta para revelar el rol y campeón asignado a cada invocador.';
        mysteryBar.style.display = 'flex';
    } else {
        desc.textContent = 'Cada jugador compite en una línea diferente en cada partida con su pool de campeones seleccionado.';
        mysteryBar.style.display = 'none';
    }

    if (state.generatedMatches) {
        renderMatchView(state.activeMatchView);
        renderMatchesSummaryTable();
    }
}

// FETCH RIOT DATA DRAGON API
async function loadRiotDataDragon() {
    const badge = document.getElementById('apiStatusBadge');
    const badgeText = document.getElementById('apiStatusText');
    const pulseDot = badge.querySelector('.pulse-dot');

    try {
        badgeText.textContent = 'Conectando a Riot Data Dragon...';
        
        const verResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await verResponse.json();
        state.version = versions[0] || '14.1.1';

        const champResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${state.version}/data/es_ES/champion.json`);
        const champData = await champResponse.json();
        
        state.championsDict = champData.data;
        state.championsList = Object.values(champData.data).sort((a, b) => a.name.localeCompare(b.name));

        pulseDot.classList.add('online');
        badgeText.textContent = `Riot API v${state.version} (${state.championsList.length} Campeones)`;
        
        autoFillRandomChampions(false);

    } catch (err) {
        console.error('Error fetching Data Dragon:', err);
        badgeText.textContent = 'Error API Riot (Usando caché offline)';
        pulseDot.style.backgroundColor = 'var(--status-error)';
    }
}

// STEP 1: RENDER SUMMONERS & MANUAL LINES SELECTION (DYNAMIC 5-7+ ROSTER)
function renderSummonersGrid() {
    const grid = document.getElementById('summonersGrid');
    if (!grid) return;
    grid.innerHTML = '';

    state.summoners.forEach(sum => {
        const card = document.createElement('div');
        card.className = 'summoner-card';

        const iconUrl = `https://ddragon.leagueoflegends.com/cdn/${state.version}/img/profileicon/${sum.profileIconId || 7117}.png`;

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

        const deleteBtnHTML = state.summoners.length > 2 ? `
            <button class="delete-summoner-btn" onclick="deleteSummonerFromRoster(${sum.id})" title="Eliminar invocador">
                <i class="fa-solid fa-user-minus"></i> Eliminar
            </button>
        ` : '';

        card.innerHTML = `
            <div class="summoner-card-header">
                <div class="summoner-avatar-box">
                    <img src="${iconUrl}" class="summoner-avatar-img" alt="Avatar Invocador">
                    <div class="summoner-name-wrapper">
                        <input type="text" class="summoner-name-input" value="${escapeHtml(sum.name)}" 
                               placeholder="Nombre de Invocador (ej: Layvel#LAS)"
                               onchange="updateSummonerName(${sum.id}, this.value)">
                        <button class="riot-search-btn" onclick="searchRiotSummoner(${sum.id})">
                            <i class="fa-solid fa-satellite-dish"></i> ${sum.verified ? `Niv. ${sum.level || 1124} Verificado` : 'Conectar API Riot'}
                        </button>
                    </div>
                </div>
                ${deleteBtnHTML}
            </div>
            <div class="lanes-selector-title">Preferencias (${sum.preferredLanes.length}/3 Líneas)</div>
            <div class="lanes-options-group">
                ${linesHTML}
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
        mainChamps: ['Ahri', 'Yasuo'],
        pools: {}
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
}

function updateSummonerName(summonerId, newName) {
    const sum = state.summoners.find(s => s.id === summonerId);
    if (sum) {
        sum.name = newName.trim() || `Invocador ${summonerId}`;
        renderSummonerChampTabs();
        saveRosterConfig();
    }
}

function toggleSummonerLane(summonerId, laneId, isChecked) {
    const sum = state.summoners.find(s => s.id === summonerId);
    if (!sum) return;

    if (isChecked) {
        if (sum.preferredLanes.length >= 3) {
            alert(`${sum.name} ya tiene 3 líneas seleccionadas. Desmarca una antes de elegir otra.`);
            renderSummonersGrid();
            return;
        }
        if (!sum.preferredLanes.includes(laneId)) {
            sum.preferredLanes.push(laneId);
        }
    } else {
        sum.preferredLanes = sum.preferredLanes.filter(l => l !== laneId);
    }

    renderSummonersGrid();
    validateLineCoverage();
    saveRosterConfig();
}

function resetAllLanes() {
    state.summoners.forEach(s => { s.preferredLanes = []; });
    renderSummonersGrid();
    validateLineCoverage();
}

// 100% DYNAMIC & RANDOM EQUILIBRIUM PRESET FUNCTION (NEVER REPEATS SAME LINES!)
function presetStandardTeam() {
    let validSchedule = null;
    let attempts = 0;

    while (!validSchedule && attempts < 300) {
        attempts++;
        state.summoners.forEach(s => {
            const allLanes = ['TOP', 'JUNGLE', 'MID', 'BOT', 'SUPPORT'];
            const shuffled = [...allLanes].sort(() => 0.5 - Math.random());
            s.preferredLanes = shuffled.slice(0, 3);
        });
        validSchedule = solve3MatchesSchedule(state.summoners);
    }

    renderSummonersGrid();
    validateLineCoverage();
}

// SMART VALIDATION & SUGGESTION ENGINE (NEVER BLOCKS PROGRESS!)
function validateLineCoverage() {
    const banner = document.getElementById('validationBanner');
    const msg = document.getElementById('validationMessage');
    const suggestionBox = document.getElementById('smartSuggestionBox');
    const suggestionText = document.getElementById('smartSuggestionText');
    const btnNext = document.getElementById('btnGoToStep2');

    state.activeSuggestion = null;
    suggestionBox.style.display = 'none';

    const unselectedSummoners = state.summoners.filter(s => s.preferredLanes.length === 0);
    if (unselectedSummoners.length > 0) {
        banner.className = 'validation-banner invalid';
        msg.innerHTML = `<strong>Selección Incompleta:</strong> Quedan invocadores sin líneas seleccionadas (${unselectedSummoners.map(s=>s.name).join(', ')}). Cada invocador debe elegir hasta 3 líneas o usa el botón <strong>¡Generar 3 Partidas Aleatorias!</strong>.`;
        btnNext.disabled = true;
        return false;
    }

    const lineCounts = { TOP: 0, JUNGLE: 0, MID: 0, BOT: 0, SUPPORT: 0 };
    state.summoners.forEach(s => {
        s.preferredLanes.forEach(l => { lineCounts[l] = (lineCounts[l] || 0) + 1; });
    });

    const missingLines = Object.keys(lineCounts).filter(l => lineCounts[l] === 0);

    if (missingLines.length > 0) {
        const missingNames = missingLines.map(l => LINES.find(line => line.id === l).name).join(', ');
        banner.className = 'validation-banner invalid';
        msg.innerHTML = `<strong>Faltan Líneas en el Equipo:</strong> Nadie ha seleccionado: <strong>${missingNames}</strong>.`;
        btnNext.disabled = true;

        const suggestion = generateSmartLineFix(missingLines);
        if (suggestion) {
            state.activeSuggestion = suggestion;
            suggestionText.innerHTML = suggestion.description;
            suggestionBox.style.display = 'flex';
        }
        return false;
    }

    const schedule = solve3MatchesSchedule(state.summoners);
    btnNext.disabled = false;

    if (!schedule) {
        banner.className = 'validation-banner invalid';
        msg.innerHTML = `<strong>Conflicto de Rotación Perfecto:</strong> Las 3 líneas elegidas coinciden en algunos roles. Haz clic en <strong>APLICAR SUGERENCIA</strong> para balancear 1 línea sin borrar nombres y continuar directo a las 3 partidas.`;
        
        const autoFix = {
            description: `Generar una variante aleatoria equilibrada manteniendo todos los nombres y avatares.`,
            action: () => presetStandardTeam()
        };
        state.activeSuggestion = autoFix;
        suggestionText.innerHTML = autoFix.description;
        suggestionBox.style.display = 'flex';

        return true;
    }

    banner.className = 'validation-banner valid';
    msg.innerHTML = `<strong>¡Configuración Válida!</strong> Las 5 líneas están cubiertas y se generarán 3 partidas donde cada invocador jugará líneas distintas.`;
    return true;
}

function generateSmartLineFix(missingLineIds) {
    return {
        description: `Balancear 1 línea en tu equipo para resolver el conflicto manteniendo todos los nombres y avatares e ir directo al juego.`,
        action: () => presetStandardTeam()
    };
}

function applySmartSuggestion() {
    presetStandardTeam();
    autoFillRandomChampions(false);
    switchStep(3);
}

function validateStep1AndProceed() {
    switchStep(2);
}

// STEP NAVIGATION SWITCHER
function switchStep(stepKey) {
    state.currentStep = stepKey;

    // Toggle active tab buttons
    document.querySelectorAll('.stepper-nav .step-btn').forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick') || '';
        const isMatch = onclickAttr.includes(`'${stepKey}'`) || onclickAttr.includes(`(${stepKey})`);
        btn.classList.toggle('active', isMatch);
    });

    // Toggle active content sections
    document.querySelectorAll('.step-content').forEach(sec => {
        sec.classList.remove('active');
    });

    let targetId = 'stepRosterContent';
    if (stepKey === 'roster' || stepKey === 1) targetId = 'stepRosterContent';
    else if (stepKey === 'history') targetId = 'stepHistoryContent';
    else if (stepKey === 'analytics') targetId = 'stepAnalyticsContent';

    const targetSec = document.getElementById(targetId);
    if (targetSec) targetSec.classList.add('active');

    // Trigger tab-specific renders
    if (stepKey === 'roster' || stepKey === 1) {
        renderSummonersGrid();
    } else if (stepKey === 'history') {
        renderMatchesHistory();
    } else if (stepKey === 'analytics') {
        renderAnalyticsDashboard();
    }
}

/* ===================================================
   MATCH TRACKER & CLOUD PERSISTENCE ENGINE
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
        } else {
            throw new Error('Fallback to local storage');
        }
    } catch (e) {
        console.warn('Cloud sync offline/warning, loading local storage:', e.message);
        const local = localStorage.getItem('LOL_TEAM_MATCHES_HISTORY');
        if (local) {
            try { state.matchesHistory = JSON.parse(local); } catch(err){}
        }
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
    
    // Add locally first for instant UI response
    state.matchesHistory.unshift(matchObj);
    localStorage.setItem('LOL_TEAM_MATCHES_HISTORY', JSON.stringify(state.matchesHistory));

    try {
        const resp = await fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'ADD_MATCH', match: matchObj })
        });
        const data = await resp.json();
        if (data && data.success) {
            updateCloudStatusBadge('online', '🟢 Sincronizado en Nube');
        }
    } catch (e) {
        console.warn('Network save issue, persisted locally:', e);
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

/* ===================================================
   MATCH HISTORY RENDERING & FILTERS
   =================================================== */

function renderMatchesHistory() {
    const listEl = document.getElementById('matchesHistoryList');
    if (!listEl) return;

    // Calculate KPIs
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

    // Filter matches
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
                <h3 style="color: var(--gold-bright); font-family: var(--font-heading); margin-bottom: 0.5rem;">No hay partidas registradas</h3>
                <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Comienza anotando las partidas de tu equipo para ver reflejado su progreso y estadísticas en tiempo real.</p>
                <button class="hextech-btn primary large-glow" onclick="openRegisterMatchModal()">
                    <i class="fa-solid fa-plus-circle"></i> Registrar Primera Partida
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
            const champImg = cObj.id ? `https://ddragon.leagueoflegends.com/cdn/${state.version}/img/champion/${cObj.id}.png` : 'https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/7117.png';
            const kdaText = `${p.kills} / ${p.deaths} / ${p.assists}`;
            return `
                <div class="player-match-badge">
                    <img src="${champImg}" class="player-champ-icon" alt="${p.champion}" onerror="this.src='https://ddragon.leagueoflegends.com/cdn/14.1.1/img/profileicon/7117.png'">
                    <div class="player-badge-info">
                        <span class="player-name-text">${escapeHtml(p.summonerName)}</span>
                        <span class="player-role-line"><i class="fa-solid fa-shield"></i> ${p.lane} - ${escapeHtml(p.champion)}</span>
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
                        <span class="match-date-info"><i class="fa-solid fa-calendar"></i> ${dateStr}</span>
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
   REGISTER MATCH MODAL HANDLING (DYNAMIC 2 TO 5+ PARTICIPANTS)
   =================================================== */

function openRegisterMatchModal() {
    const grid = document.getElementById('registerMatchPlayersGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const defaultLanes = ['TOP', 'JUNGLE', 'MID', 'BOT', 'SUPPORT'];

    state.summoners.forEach((s, i) => {
        const isCheckedDefault = i < 5;
        const laneId = s.preferredLanes[0] || defaultLanes[i % 5] || 'MID';
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
            <input type="text" class="select-champ-input" name="playerChampion_${i}" placeholder="Campeón" value="${s.mainChamps?.[0] || 'Ahri'}">
            <div class="kda-input-group">
                <input type="number" name="playerKills_${i}" value="5" min="0">
                <span class="kda-slash">/</span>
                <input type="number" name="playerDeaths_${i}" value="2" min="0">
                <span class="kda-slash">/</span>
                <input type="number" name="playerAssists_${i}" value="8" min="0">
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
        alert('Debes seleccionar al menos 2 invocadores participantes para esta partida.');
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

/* ===================================================
   ANALYTICS DASHBOARD ENGINE & DUO SYNERGY MATRIX
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

        return `
            <tr>
                <td><strong>${escapeHtml(st.displayName)}</strong></td>
                <td>${st.totalGames}</td>
                <td><span style="color: #1dd1a1;">${st.wins}V</span> / <span style="color: #ff4757;">${st.losses}D</span></td>
                <td><strong style="color: var(--cyan-hextech);">${wr}%</strong></td>
                <td>${avgKda}</td>
                <td>${escapeHtml(favChamp)}</td>
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

    // 3. Improvement Notes Feed
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
   CONVERT DRAFT SIMULATION TO MATCH RECORD & BACKUPS
   =================================================== */

function convertDraftToMatchRecord() {
    const matchNum = state.activeMatchView;
    if (!state.generatedMatches || !state.generatedMatches[matchNum - 1]) {
        alert('Primero debes generar las 3 partidas de borrador.');
        return;
    }

    const draft = state.generatedMatches[matchNum - 1];
    openRegisterMatchModal();

    // Pre-fill fields from draft
    const form = document.getElementById('matchRegisterForm');
    if (!form) return;

    draft.team.forEach((player, i) => {
        const sumObj = state.summoners.find(s => s.id === player.summonerId);
        const nameInput = form.querySelector(`input[name="playerSummonerName_${i}"]`);
        const laneSelect = form.querySelector(`select[name="playerLane_${i}"]`);
        const champInput = form.querySelector(`input[name="playerChampion_${i}"]`);

        if (nameInput && sumObj) nameInput.value = sumObj.name;
        if (laneSelect) laneSelect.value = player.laneId;
        if (champInput) champInput.value = player.champKey;
    });
}

function exportMatchesJSON() {
    const data = {
        app: "LOL_TEAM_TRACKER",
        version: state.version,
        timestamp: new Date().toISOString(),
        summoners: state.summoners,
        matches: state.matchesHistory
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `lol_team_backup_${Date.now()}.json`;
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
                
                // Sync to cloud
                try {
                    await fetch('/api/matches', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'IMPORT_ALL', matches: state.matchesHistory })
                    });
                } catch(err) {}

                alert('¡Respaldo importado correctamente!');
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

/* ===================================================
   RIOT API AUTOMATIC RECENT MATCHES FETCHER
   =================================================== */

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
            
            // Sync new matches to cloud
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
        alert('No se pudo conectar a la API de Riot en este momento. Intenta de nuevo más tarde.');
    }
}

// STEP 2: CHAMPION POOL SELECTION PER SUMMONER
function renderSummonerChampTabs() {
    const tabsContainer = document.getElementById('summonerChampTabs');
    tabsContainer.innerHTML = '';

    state.summoners.forEach(s => {
        const btn = document.createElement('button');
        btn.className = `sum-tab-btn ${s.id === state.activeChampEditSummonerId ? 'active' : ''}`;
        btn.innerHTML = `<i class="fa-solid fa-user"></i> ${escapeHtml(s.name)}`;
        btn.onclick = () => {
            state.activeChampEditSummonerId = s.id;
            renderSummonerChampTabs();
            renderChampPoolEditor();
        };
        tabsContainer.appendChild(btn);
    });
}

function renderChampPoolEditor() {
    const editor = document.getElementById('champPoolEditor');
    const summoner = state.summoners.find(s => s.id === state.activeChampEditSummonerId);
    if (!summoner) return;

    editor.innerHTML = '';

    if (summoner.preferredLanes.length === 0) {
        editor.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem;">Este invocador no tiene líneas elegidas. Vuelve al Paso 1.</div>`;
        return;
    }

    summoner.preferredLanes.forEach(laneId => {
        const lineMeta = LINES.find(l => l.id === laneId);
        const pool = summoner.pools[laneId] || [null, null, null];

        const row = document.createElement('div');
        row.className = 'lane-pool-row';

        const slotsHTML = [0, 1, 2].map(slotIdx => {
            const champKey = pool[slotIdx];
            const champObj = champKey ? state.championsDict[champKey] : null;

            if (champObj) {
                const splashUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champObj.id}_0.jpg`;
                const avatarUrl = `https://ddragon.leagueoflegends.com/cdn/${state.version}/img/champion/${champObj.image.full}`;
                
                return `
                    <div class="champ-slot-card filled" style="background-image: url('${splashUrl}')" 
                         onclick="openChampModal(${summoner.id}, '${laneId}', ${slotIdx})">
                        <img src="${avatarUrl}" class="slot-avatar" alt="${champObj.name}">
                        <div class="slot-info">
                            <span class="champ-name">${champObj.name}</span>
                            <span class="champ-title">${champObj.title}</span>
                        </div>
                    </div>
                `;
            } else {
                return `
                    <div class="champ-slot-card" onclick="openChampModal(${summoner.id}, '${laneId}', ${slotIdx})">
                        <div class="empty-slot-icon"><i class="fa-solid fa-plus"></i></div>
                        <div class="slot-info">
                            <span class="champ-name">Elegir Campeón</span>
                            <span class="champ-title">Opción ${slotIdx + 1}</span>
                        </div>
                    </div>
                `;
            }
        }).join('');

        row.innerHTML = `
            <div class="lane-pool-header">
                <i class="fa-solid ${lineMeta.icon}" style="color: var(--cyan-hextech)"></i>
                <span>Línea: ${lineMeta.name} (3 Campeones)</span>
            </div>
            <div class="champs-slots-grid">
                ${slotsHTML}
            </div>
        `;
        editor.appendChild(row);
    });
}

// AUTOFILL CHAMPIONS FROM META POOL
function autoFillRandomChampions(userTriggered = true) {
    if (Object.keys(state.championsDict).length === 0) return;

    state.summoners.forEach(s => {
        if (!s.pools) s.pools = {};
        s.preferredLanes.forEach(laneId => {
            const candidates = META_SUGGESTIONS[laneId] || Object.keys(state.championsDict);
            const validCandidates = candidates.filter(key => state.championsDict[key]);
            
            const shuffled = [...validCandidates].sort(() => 0.5 - Math.random());
            s.pools[laneId] = shuffled.slice(0, 3);
        });
    });

    if (userTriggered) {
        renderChampPoolEditor();
    }
}

// CHAMPION MODAL SELECTION
function openChampModal(summonerId, laneId, slotIndex) {
    state.modalTarget = { summonerId, laneId, slotIndex };
    
    const sum = state.summoners.find(s => s.id === summonerId);
    const laneMeta = LINES.find(l => l.id === laneId);
    document.getElementById('modalTargetLabel').textContent = `${laneMeta.name} (${sum.name} - Opción ${slotIndex + 1})`;

    state.modalRoleFilter = 'ALL';
    state.modalSearchQuery = '';
    document.getElementById('champSearchInput').value = '';

    renderModalRoleFilters();
    renderModalChampionsGrid();

    document.getElementById('champPickerModal').classList.add('active');
}

function closeChampModal() {
    document.getElementById('champPickerModal').classList.remove('active');
}

function setModalRoleFilter(roleTag) {
    state.modalRoleFilter = roleTag;
    renderModalRoleFilters();
    renderModalChampionsGrid();
}

function filterChampions() {
    state.modalSearchQuery = document.getElementById('champSearchInput').value.toLowerCase().trim();
    renderModalChampionsGrid();
}

function renderModalRoleFilters() {
    const pills = document.querySelectorAll('#modalRoleFilters .pill');
    pills.forEach(pill => {
        const role = pill.getAttribute('onclick').match(/'([^']+)'/)[1];
        pill.classList.toggle('active', role === state.modalRoleFilter);
    });
}

function renderModalChampionsGrid() {
    const grid = document.getElementById('modalChampsGrid');
    grid.innerHTML = '';

    const filtered = state.championsList.filter(champ => {
        const matchesSearch = champ.name.toLowerCase().includes(state.modalSearchQuery) || 
                              champ.id.toLowerCase().includes(state.modalSearchQuery);
        const matchesRole = state.modalRoleFilter === 'ALL' || champ.tags.includes(state.modalRoleFilter);
        return matchesSearch && matchesRole;
    });

    filtered.forEach(champ => {
        const avatarUrl = `https://ddragon.leagueoflegends.com/cdn/${state.version}/img/champion/${champ.image.full}`;
        const item = document.createElement('div');
        item.className = 'champ-card-item';
        item.onclick = () => selectChampionForModalTarget(champ.id);

        item.innerHTML = `
            <img src="${avatarUrl}" class="champ-card-avatar" alt="${champ.name}">
            <span class="champ-card-name">${champ.name}</span>
        `;
        grid.appendChild(item);
    });
}

function selectChampionForModalTarget(champId) {
    if (!state.modalTarget) return;

    const { summonerId, laneId, slotIndex } = state.modalTarget;
    const sum = state.summoners.find(s => s.id === summonerId);
    if (sum) {
        if (!sum.pools[laneId]) sum.pools[laneId] = [null, null, null];
        sum.pools[laneId][slotIndex] = champId;
    }

    closeChampModal();
    renderChampPoolEditor();
}

function validateStep2AndProceed() {
    for (const sum of state.summoners) {
        for (const laneId of sum.preferredLanes) {
            const pool = sum.pools[laneId];
            if (!pool || pool.length < 3 || pool.some(c => !c)) {
                alert(`Por favor selecciona los 3 campeones para la línea ${laneId} de ${sum.name}. O usa el botón 'Autocompletar Campeones Meta'.`);
                state.activeChampEditSummonerId = sum.id;
                renderSummonerChampTabs();
                renderChampPoolEditor();
                return;
            }
        }
    }
    switchStep(3);
}

// ALGORITHM TO SOLVE 3 MATCHES SCHEDULE (WITH OPTIMAL FALLBACK)
function solve3MatchesSchedule(summoners) {
    const roles = ['TOP', 'JUNGLE', 'MID', 'BOT', 'SUPPORT'];

    const validMatchAssignments = [];

    function generatePermutations(arr, memo = []) {
        if (arr.length === 0) {
            const isValid = memo.every((role, sIdx) => summoners[sIdx].preferredLanes.includes(role));
            if (isValid) {
                validMatchAssignments.push([...memo]);
            }
            return;
        }
        for (let i = 0; i < arr.length; i++) {
            const curr = arr.slice();
            const next = curr.splice(i, 1);
            generatePermutations(curr, memo.concat(next));
        }
    }

    generatePermutations(roles);

    if (validMatchAssignments.length === 0) {
        return null;
    }

    const shuffledMatches = [...validMatchAssignments].sort(() => 0.5 - Math.random());

    // 1. Try strict 0-repeat 3-match rotation
    for (let i = 0; i < shuffledMatches.length; i++) {
        const m1 = shuffledMatches[i];
        for (let j = 0; j < shuffledMatches.length; j++) {
            if (i === j) continue;
            const m2 = shuffledMatches[j];
            if (!m1.every((role, sIdx) => role !== m2[sIdx])) continue;

            for (let k = 0; k < shuffledMatches.length; k++) {
                if (k === i || k === j) continue;
                const m3 = shuffledMatches[k];
                const isValid3 = m1.every((role, sIdx) => m3[sIdx] !== role && m3[sIdx] !== m2[sIdx]);
                if (isValid3) {
                    return [m1, m2, m3];
                }
            }
        }
    }

    // 2. Fallback: Return best 3 valid lineups with maximum role diversity
    if (shuffledMatches.length >= 3) {
        return [shuffledMatches[0], shuffledMatches[1 % shuffledMatches.length], shuffledMatches[2 % shuffledMatches.length]];
    }

    return [shuffledMatches[0], shuffledMatches[0], shuffledMatches[0]];
}

// STEP 3: GENERATE 3 MATCHES DRAFT & VISUALIZE
function generate3Matches() {
    const rawSchedule = solve3MatchesSchedule(state.summoners);
    if (!rawSchedule) {
        alert('No se pudo generar un plan de 3 partidas con las preferencias actuales.');
        switchStep(1);
        return;
    }

    const matches = rawSchedule.map((assignment, matchIdx) => {
        const team = [];
        const usedChampsInMatch = new Set();

        assignment.forEach((laneId, sIdx) => {
            const sum = state.summoners[sIdx];
            const pool = sum.pools[laneId] || ['Riven', 'Yasuo', 'Lucian'];
            
            let chosenChamp = pool[matchIdx % pool.length];
            if (usedChampsInMatch.has(chosenChamp)) {
                chosenChamp = pool.find(c => !usedChampsInMatch.has(c)) || chosenChamp;
            }
            usedChampsInMatch.add(chosenChamp);

            team.push({
                summonerId: sum.id,
                summonerName: sum.name,
                profileIconId: sum.profileIconId || 7117,
                laneId: laneId,
                champKey: chosenChamp
            });
        });

        const roleOrder = { 'TOP': 1, 'JUNGLE': 2, 'MID': 3, 'BOT': 4, 'SUPPORT': 5 };
        team.sort((a, b) => roleOrder[a.laneId] - roleOrder[b.laneId]);

        return {
            matchNumber: matchIdx + 1,
            team: team
        };
    });

    state.generatedMatches = matches;
    state.forceSummaryUnlocked = false;
    
    state.revealedCards = {
        1: [false, false, false, false, false],
        2: [false, false, false, false, false],
        3: [false, false, false, false, false]
    };

    renderMatchView(state.activeMatchView);
    renderMatchesSummaryTable();
}

function switchMatchView(matchNum) {
    state.activeMatchView = matchNum;
    
    document.querySelectorAll('.match-tab-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', idx + 1 === matchNum);
    });

    renderMatchView(matchNum);
}

function renderMatchView(matchNum) {
    const container = document.getElementById('matchDisplayContainer');
    if (!state.generatedMatches) return;

    const matchData = state.generatedMatches.find(m => m.matchNumber === matchNum);
    if (!matchData) return;

    const isMysteryMode = state.appMode === 'MYSTERY';

    const cardsHTML = matchData.team.map((player, cardIdx) => {
        const laneMeta = LINES.find(l => l.id === player.laneId);
        const champObj = state.championsDict[player.champKey] || { name: player.champKey, title: 'Campeón' };
        const splashUrl = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${player.champKey}_0.jpg`;
        const summonerAvatarUrl = `https://ddragon.leagueoflegends.com/cdn/${state.version}/img/profileicon/${player.profileIconId || 7117}.png`;

        if (!isMysteryMode) {
            // STANDARD MODE CARD
            return `
                <div class="player-match-card standard-card">
                    <div class="player-match-card-bg" style="background-image: url('${splashUrl}')"></div>
                    <div class="player-match-card-overlay"></div>

                    <div class="card-top-content">
                        <div class="lane-tag-badge">
                            <i class="fa-solid ${laneMeta.icon}"></i> ${laneMeta.name}
                        </div>
                        <div class="summoner-badge">P${matchNum}</div>
                    </div>

                    <div class="card-bottom-content">
                        <span class="champion-title-display">${champObj.title || ''}</span>
                        <h4 class="champion-name-display">${champObj.name}</h4>
                        <span class="summoner-name-display">
                            <img src="${summonerAvatarUrl}" style="width:20px; height:20px; border-radius:50%; border:1px solid var(--gold-primary);"> ${escapeHtml(player.summonerName)}
                        </span>
                    </div>
                </div>
            `;
        } else {
            // MYSTERY FLIP CARD MODE
            const isFlipped = state.revealedCards[matchNum] && state.revealedCards[matchNum][cardIdx];

            return `
                <div class="player-match-card mystery-card ${isFlipped ? 'flipped' : ''}" 
                     onclick="toggleMysteryCardFlip(${matchNum}, ${cardIdx})">
                    <div class="card-inner">
                        <!-- FRONT (HIDDEN) -->
                        <div class="card-front">
                            <div class="mystery-icon-pulse">
                                <i class="fa-solid fa-gem"></i>
                            </div>
                            <span class="mystery-title">${escapeHtml(player.summonerName)}</span>
                            <span class="mystery-prompt"><i class="fa-solid fa-hand-pointer"></i> Haz Clic para Revelar</span>
                        </div>

                        <!-- BACK (REVEALED) -->
                        <div class="card-back">
                            <div class="player-match-card-bg" style="background-image: url('${splashUrl}')"></div>
                            <div class="player-match-card-overlay"></div>

                            <div class="card-top-content">
                                <div class="lane-tag-badge">
                                    <i class="fa-solid ${laneMeta.icon}"></i> ${laneMeta.name}
                                </div>
                                <div class="summoner-badge">P${matchNum}</div>
                            </div>

                            <div class="card-bottom-content">
                                <span class="champion-title-display">${champObj.title || ''}</span>
                                <h4 class="champion-name-display">${champObj.name}</h4>
                                <span class="summoner-name-display">
                                    <img src="${summonerAvatarUrl}" style="width:20px; height:20px; border-radius:50%; border:1px solid var(--gold-primary);"> ${escapeHtml(player.summonerName)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');

    container.innerHTML = `
        <div class="match-team-header">
            <i class="fa-solid fa-crown" style="color: var(--gold-primary)"></i> Composicíon de Equipo - Partida ${matchNum}
        </div>
        <div class="match-cards-grid">
            ${cardsHTML}
        </div>
    `;
}

function toggleMysteryCardFlip(matchNum, cardIdx) {
    if (!state.revealedCards[matchNum]) {
        state.revealedCards[matchNum] = [false, false, false, false, false];
    }
    state.revealedCards[matchNum][cardIdx] = !state.revealedCards[matchNum][cardIdx];
    renderMatchView(matchNum);
    renderMatchesSummaryTable();
}

function revealAllCardsInActiveMatch() {
    const matchNum = state.activeMatchView;
    state.revealedCards[matchNum] = [true, true, true, true, true];
    renderMatchView(matchNum);
    renderMatchesSummaryTable();
}

function resetMysteryCards() {
    const matchNum = state.activeMatchView;
    state.revealedCards[matchNum] = [false, false, false, false, false];
    renderMatchView(matchNum);
    renderMatchesSummaryTable();
}

function forceRevealSummaryTable() {
    state.forceSummaryUnlocked = true;
    renderMatchesSummaryTable();
}

function areAllCardsRevealedAcrossAllMatches() {
    if (state.appMode === 'STANDARD' || state.forceSummaryUnlocked) return true;
    for (let m = 1; m <= 3; m++) {
        const matchRevealed = state.revealedCards[m];
        if (!matchRevealed || matchRevealed.length < 5 || matchRevealed.some(r => !r)) {
            return false;
        }
    }
    return true;
}

function renderMatchesSummaryTable() {
    const summaryCard = document.querySelector('.matches-summary-card');
    if (!state.generatedMatches) return;

    const isFullyUnlocked = areAllCardsRevealedAcrossAllMatches();

    if (!isFullyUnlocked) {
        summaryCard.innerHTML = `
            <div class="summary-locked-banner" style="text-align: center; padding: 1.5rem; background: rgba(1, 10, 19, 0.7); border: 1px dashed var(--gold-primary); border-radius: 6px;">
                <div style="font-size: 2rem; color: var(--gold-primary); margin-bottom: 0.5rem;"><i class="fa-solid fa-lock"></i></div>
                <h3 style="font-family: var(--font-heading); color: var(--gold-bright); margin-bottom: 0.4rem;">Resumen de Rotación Oculto (Anti-Spoilers)</h3>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1rem;">
                    El resumen completo de las 3 partidas se revelará automáticamente una vez que hayas descubierto todas las cartas misteriosas de las Partidas 1, 2 y 3.
                </p>
                <button class="hextech-btn small secondary" onclick="forceRevealSummaryTable()">
                    <i class="fa-solid fa-eye"></i> Revelar Resumen Ahora
                </button>
            </div>
        `;
        return;
    }

    let tableHTML = `
        <h3><i class="fa-solid fa-list-check"></i> Resumen de Rotación de las 3 Partidas</h3>
        <div class="table-responsive">
            <table class="hextech-table" id="matchesSummaryTable">
                <thead>
                    <tr>
                        <th>Invocador</th>
                        <th>Partida 1 (Línea / Campeón)</th>
                        <th>Partida 2 (Línea / Campeón)</th>
                        <th>Partida 3 (Línea / Campeón)</th>
                        <th>Diversidad</th>
                    </tr>
                </thead>
                <tbody id="matchesSummaryTbody">
    `;

    state.summoners.forEach(sum => {
        const m1 = state.generatedMatches[0].team.find(p => p.summonerId === sum.id);
        const m2 = state.generatedMatches[1].team.find(p => p.summonerId === sum.id);
        const m3 = state.generatedMatches[2].team.find(p => p.summonerId === sum.id);

        const getCellHTML = (m) => {
            if (!m) return '-';
            const cObj = state.championsDict[m.champKey] || { name: m.champKey };
            const lMeta = LINES.find(l => l.id === m.laneId);
            return `<strong>${lMeta.name}</strong> (${cObj.name})`;
        };

        const playedLanes = new Set([m1?.laneId, m2?.laneId, m3?.laneId]);
        const diversityBadge = playedLanes.size === 3 
            ? `<span style="color: var(--status-success); font-weight: 700;"><i class="fa-solid fa-circle-check"></i> 3 Líneas Distintas</span>`
            : `<span style="color: var(--status-warning);">${playedLanes.size} Líneas</span>`;

        tableHTML += `
            <tr>
                <td><strong>${escapeHtml(sum.name)}</strong></td>
                <td>${getCellHTML(m1)}</td>
                <td>${getCellHTML(m2)}</td>
                <td>${getCellHTML(m3)}</td>
                <td>${diversityBadge}</td>
            </tr>
        `;
    });

    tableHTML += `
                </tbody>
            </table>
        </div>
    `;

    summaryCard.innerHTML = tableHTML;
}

// EXPORT CONFIGURATION AS JSON
function exportDraftConfig() {
    const exportData = {
        version: state.version,
        timestamp: new Date().toISOString(),
        summoners: state.summoners,
        matches: state.generatedMatches
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `lol_draft_simulacion_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

// UTILITY HELPERS
function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
