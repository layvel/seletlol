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
    { id: 1, name: 'Invocador 1', lines: ['TOP', 'JUNGLE', 'MID'] },
    { id: 2, name: 'Invocador 2', lines: ['JUNGLE', 'MID', 'BOT'] },
    { id: 3, name: 'Invocador 3', lines: ['MID', 'BOT', 'SUPPORT'] },
    { id: 4, name: 'Invocador 4', lines: ['BOT', 'SUPPORT', 'TOP'] },
    { id: 5, name: 'Invocador 5', lines: ['SUPPORT', 'TOP', 'JUNGLE'] }
];

// Suggested champions by line for quick autofill
const META_SUGGESTIONS = {
    'TOP': ['Darius', 'Garen', 'Aatrox', 'Fiora', 'Jax', 'Renekton', 'Sett', 'Camille'],
    'JUNGLE': ['LeeSin', 'Viego', 'JarvanIV', 'Graves', 'KhaZix', 'Elise', 'XinZhao', 'Warwick'],
    'MID': ['Ahri', 'Yasuo', 'Zed', 'Syndra', 'Lux', 'Yone', 'Vex', 'Katarina'],
    'BOT': ['Jinx', 'Kaisa', 'Ezreal', 'Caitlyn', 'Vayne', 'Jhin', 'Lucian', 'Ashe'],
    'SUPPORT': ['Thresh', 'Lulu', 'Nautilus', 'Leona', 'Blitzcrank', 'Nami', 'Morgana', 'Pyke']
};

// Global App State - Mystery Mode set as MAIN experience by default!
const state = {
    version: '14.1.1',
    championsDict: {},
    championsList: [],
    currentStep: 1,
    activeMatchView: 1,
    activeChampEditSummonerId: 1,
    appMode: 'MYSTERY', // 'MYSTERY' (Main Default) or 'STANDARD'
    
    // Modal state
    modalTarget: null,
    modalRoleFilter: 'ALL',
    modalSearchQuery: '',

    // 5 Summoners Data
    summoners: [
        { id: 1, name: 'Invocador 1', preferredLanes: [], pools: {} },
        { id: 2, name: 'Invocador 2', preferredLanes: [], pools: {} },
        { id: 3, name: 'Invocador 3', preferredLanes: [], pools: {} },
        { id: 4, name: 'Invocador 4', preferredLanes: [], pools: {} },
        { id: 5, name: 'Invocador 5', preferredLanes: [], pools: {} }
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
    renderSummonersGrid();
    validateLineCoverage();
    await loadRiotDataDragon();
}

// QUICK 1-CLICK RANDOM DRAFT
function executeQuickRandomDraft() {
    // 1. Assign 3 balanced random lines per summoner
    presetStandardTeam();

    // 2. Auto fill champions for all lines
    autoFillRandomChampions(false);

    // 3. Switch mode to Mystery Reveal
    state.appMode = 'MYSTERY';
    setAppMode('MYSTERY');

    // 4. Generate 3 matches & proceed straight to Step 3 visualizer!
    switchStep(3);
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
    }
}

// FETCH RIOT DATA DRAGON API
async function loadRiotDataDragon() {
    const badge = document.getElementById('apiStatusBadge');
    const badgeText = document.getElementById('apiStatusText');
    const pulseDot = badge.querySelector('.pulse-dot');

    try {
        badgeText.textContent = 'Conectando a Riot Data Dragon...';
        
        // 1. Fetch versions
        const verResponse = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
        const versions = await verResponse.json();
        state.version = versions[0] || '14.1.1';

        // 2. Fetch champions list in es_ES
        const champResponse = await fetch(`https://ddragon.leagueoflegends.com/cdn/${state.version}/data/es_ES/champion.json`);
        const champData = await champResponse.json();
        
        state.championsDict = champData.data;
        state.championsList = Object.values(champData.data).sort((a, b) => a.name.localeCompare(b.name));

        pulseDot.classList.add('online');
        badgeText.textContent = `Data Dragon v${state.version} (${state.championsList.length} Campeones)`;
        
        // Auto initialize default champion pools
        autoFillRandomChampions(false);

    } catch (err) {
        console.error('Error fetching Data Dragon:', err);
        badgeText.textContent = 'Error API Riot (Usando caché offline)';
        pulseDot.style.backgroundColor = 'var(--status-error)';
    }
}

// STEP 1: RENDER SUMMONERS & MANUAL LINES SELECTION
function renderSummonersGrid() {
    const grid = document.getElementById('summonersGrid');
    grid.innerHTML = '';

    state.summoners.forEach(sum => {
        const card = document.createElement('div');
        card.className = 'summoner-card';

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

        card.innerHTML = `
            <div class="summoner-card-header">
                <input type="text" class="summoner-name-input" value="${escapeHtml(sum.name)}" 
                       onchange="updateSummonerName(${sum.id}, this.value)">
            </div>
            <div class="lanes-selector-title">Preferencias (${sum.preferredLanes.length}/3 Líneas)</div>
            <div class="lanes-options-group">
                ${linesHTML}
            </div>
        `;
        grid.appendChild(card);
    });
}

function updateSummonerName(summonerId, newName) {
    const sum = state.summoners.find(s => s.id === summonerId);
    if (sum) {
        sum.name = newName.trim() || `Invocador ${summonerId}`;
        renderSummonerChampTabs();
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
}

function resetAllLanes() {
    state.summoners.forEach(s => { s.preferredLanes = []; });
    renderSummonersGrid();
    validateLineCoverage();
}

function presetStandardTeam() {
    state.summoners.forEach((sum, idx) => {
        sum.preferredLanes = [...DEFAULT_SUMMONER_PRESETS[idx].lines];
    });
    renderSummonersGrid();
    validateLineCoverage();
}

// SMART VALIDATION & SUGGESTION ENGINE
function validateLineCoverage() {
    const banner = document.getElementById('validationBanner');
    const msg = document.getElementById('validationMessage');
    const suggestionBox = document.getElementById('smartSuggestionBox');
    const suggestionText = document.getElementById('smartSuggestionText');
    const btnNext = document.getElementById('btnGoToStep2');

    state.activeSuggestion = null;
    suggestionBox.style.display = 'none';

    // 1. Check total selected lines per summoner
    const unselectedSummoners = state.summoners.filter(s => s.preferredLanes.length === 0);
    if (unselectedSummoners.length > 0) {
        banner.className = 'validation-banner invalid';
        msg.innerHTML = `<strong>Selección Incompleta:</strong> Quedan invocadores sin líneas seleccionadas (${unselectedSummoners.map(s=>s.name).join(', ')}). Cada invocador debe elegir hasta 3 líneas o usa el botón <strong>¡Generar 3 Partidas Aleatorias!</strong>.`;
        btnNext.disabled = true;
        return false;
    }

    // 2. Count coverage for each of the 5 roles
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

    // 3. Test if 3-Match rotation schedule is solvable
    const schedule = solve3MatchesSchedule(state.summoners);
    if (!schedule) {
        banner.className = 'validation-banner invalid';
        msg.innerHTML = `<strong>Conflicto de Rotación:</strong> Las elecciones actuales no permiten armar 3 partidas con 3 líneas distintas por jugador. Revisa la distribución.`;
        btnNext.disabled = true;

        const presetFix = {
            description: `Aplica la distribución estándar equilibrada automáticamente para resolver el conflicto.`,
            action: () => presetStandardTeam()
        };
        state.activeSuggestion = presetFix;
        suggestionText.innerHTML = presetFix.description;
        suggestionBox.style.display = 'flex';

        return false;
    }

    banner.className = 'validation-banner valid';
    msg.innerHTML = `<strong>¡Configuración Válida!</strong> Las 5 líneas están cubiertas y se generarán 3 partidas donde cada invocador jugará líneas distintas.`;
    btnNext.disabled = false;
    return true;
}

function generateSmartLineFix(missingLineIds) {
    const needySummoners = state.summoners.filter(s => s.preferredLanes.length < 3);

    if (needySummoners.length >= missingLineIds.length) {
        const assignments = [];
        missingLineIds.forEach((missingLane, idx) => {
            const sum = needySummoners[idx];
            const laneMeta = LINES.find(l => l.id === missingLane);
            assignments.push({ summonerId: sum.id, summonerName: sum.name, laneId: missingLane, laneName: laneMeta.name });
        });

        const desc = assignments.map(a => `Añadir <strong>${a.laneName}</strong> a ${a.summonerName}`).join(' y ');

        return {
            description: desc,
            action: () => {
                assignments.forEach(a => {
                    const sum = state.summoners.find(s => s.id === a.summonerId);
                    if (sum && !sum.preferredLanes.includes(a.laneId)) {
                        sum.preferredLanes.push(a.laneId);
                    }
                });
                renderSummonersGrid();
                validateLineCoverage();
            }
        };
    }

    return {
        description: `Autocompletar con la plantilla estándar equilibrada de 3 líneas por jugador.`,
        action: () => presetStandardTeam()
    };
}

function applySmartSuggestion() {
    if (state.activeSuggestion && state.activeSuggestion.action) {
        state.activeSuggestion.action();
    }
}

function validateStep1AndProceed() {
    if (validateLineCoverage()) {
        switchStep(2);
    }
}

// STEP NAVIGATION SWITCHER
function switchStep(stepNum) {
    state.currentStep = stepNum;
    
    document.querySelectorAll('.step-btn').forEach((btn, idx) => {
        btn.classList.toggle('active', idx + 1 === stepNum);
    });

    document.querySelectorAll('.step-content').forEach((sec, idx) => {
        sec.classList.toggle('active', idx + 1 === stepNum);
    });

    if (stepNum === 2) {
        renderSummonerChampTabs();
        renderChampPoolEditor();
    } else if (stepNum === 3) {
        generate3Matches();
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

// ALGORITHM TO SOLVE 3 MATCHES SCHEDULE
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

    if (validMatchAssignments.length < 3) {
        return null;
    }

    for (let i = 0; i < validMatchAssignments.length; i++) {
        const m1 = validMatchAssignments[i];
        for (let j = 0; j < validMatchAssignments.length; j++) {
            if (i === j) continue;
            const m2 = validMatchAssignments[j];
            if (!m1.every((role, sIdx) => role !== m2[sIdx])) continue;

            for (let k = 0; k < validMatchAssignments.length; k++) {
                if (k === i || k === j) continue;
                const m3 = validMatchAssignments[k];
                const isValid3 = m1.every((role, sIdx) => m3[sIdx] !== role && m3[sIdx] !== m2[sIdx]);
                if (isValid3) {
                    return [m1, m2, m3];
                }
            }
        }
    }

    return null;
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
            const pool = sum.pools[laneId] || ['Garen', 'Darius', 'Aatrox'];
            
            let chosenChamp = pool[matchIdx % pool.length];
            if (usedChampsInMatch.has(chosenChamp)) {
                chosenChamp = pool.find(c => !usedChampsInMatch.has(c)) || chosenChamp;
            }
            usedChampsInMatch.add(chosenChamp);

            team.push({
                summonerId: sum.id,
                summonerName: sum.name,
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
    
    // Reset revealed state for Mystery Mode
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
                            <i class="fa-solid fa-user-astronaut"></i> ${escapeHtml(player.summonerName)}
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
                                    <i class="fa-solid fa-user-astronaut"></i> ${escapeHtml(player.summonerName)}
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
}

function revealAllCardsInActiveMatch() {
    const matchNum = state.activeMatchView;
    state.revealedCards[matchNum] = [true, true, true, true, true];
    renderMatchView(matchNum);
}

function resetMysteryCards() {
    const matchNum = state.activeMatchView;
    state.revealedCards[matchNum] = [false, false, false, false, false];
    renderMatchView(matchNum);
}

function renderMatchesSummaryTable() {
    const tbody = document.getElementById('matchesSummaryTbody');
    if (!state.generatedMatches) return;

    tbody.innerHTML = '';

    state.summoners.forEach(sum => {
        const tr = document.createElement('tr');

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

        tr.innerHTML = `
            <td><strong>${escapeHtml(sum.name)}</strong></td>
            <td>${getCellHTML(m1)}</td>
            <td>${getCellHTML(m2)}</td>
            <td>${getCellHTML(m3)}</td>
            <td>${diversityBadge}</td>
        `;
        tbody.appendChild(tr);
    });
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
