// Game State
let mode = 'individual'
let players = ['Player 1', 'Player 2', 'Player 3', 'Player 4']
let teamNames = ['Team 1', 'Team 2']
let scores = [0, 0, 0, 0]
let kingdoms = {}
let history = []
let currentOwner = null
let currentGame = null
const games = ['Trix', 'Latosh', 'Dinari', 'Banat', 'Khteyar']
let gameInProgress = false // Track if a game form is active
let currentPlayerIndex = 0 // Track which player's turn it is
let kingdomHistory = [] // Track each kingdom's games separately

// Player icons (emojis)
const playerIcons = ['🎮', '🎯', '🎲', '🎪']

// Achievements tracking
let achievements = {
  kingLover: {}, // Track Khteyar count per player
  toshi: {}, // Track 50-point Trix finishes per player
  kingOfGirls: {}, // Track 4-queen games per player
}

// Game-specific state
let cardCounts = [0, 0, 0, 0] // For Latosh/Dinari
let queensState = {
  0: { taker: null, doubled: false, doubler: null, forcer: null },
  1: { taker: null, doubled: false, doubler: null, forcer: null },
  2: { taker: null, doubled: false, doubler: null, forcer: null },
  3: { taker: null, doubled: false, doubler: null, forcer: null },
}
let khteyarState = { taker: null, doubled: false, doubler: null, forcer: null }
let trixPositions = [null, null, null, null] // positions 0-3 for 1st-4th place
let gameStep = 'select' // 'select', 'double', 'assign'
let currentQueenIndex = null

// Mode Selection
function setMode(m) {
  mode = m
  document
    .getElementById('indBtn')
    .classList.toggle('active', m === 'individual')
  document
    .getElementById('partBtn')
    .classList.toggle('active', m === 'partnership')
  renderSetup()
}

// Render Setup Panel
function renderSetup() {
  const c = document.getElementById('playerInputs')
  if (mode === 'individual') {
    c.innerHTML = `<div class="player-inputs">${players
      .map(
        (p, i) => `
      <div class="player-input">
        <label>Player ${i + 1} ${playerIcons[i]}</label>
        <input type="text" id="player${i}" value="${p}">
      </div>
    `
      )
      .join('')}</div>`
  } else {
    c.innerHTML = `
      <div class="player-inputs">
        <div class="player-input">
          <label>🔵 Team 1 Name</label>
          <input type="text" id="team0" value="${teamNames[0]}">
        </div>
        <div class="player-input">
          <label>🔴 Team 2 Name</label>
          <input type="text" id="team1" value="${teamNames[1]}">
        </div>
      </div>
    `
  }
}

// Start Game
function startGame() {
  if (mode === 'individual') {
    for (let i = 0; i < 4; i++) {
      const inp = document.getElementById(`player${i}`)
      if (inp) players[i] = inp.value.trim() || `Player ${i + 1}`
    }
  } else {
    for (let i = 0; i < 2; i++) {
      const inp = document.getElementById(`team${i}`)
      if (inp) teamNames[i] = inp.value.trim() || `Team ${i + 1}`
    }
  }

  for (let i = 0; i < 4; i++) {
    kingdoms[i] = {
      Trix: false,
      Latosh: false,
      Dinari: false,
      Banat: false,
      Khteyar: false,
    }
  }
  scores = [0, 0, 0, 0]
  history = []
  kingdomHistory = []
  currentPlayerIndex = 0
  currentOwner = 0
  achievements = {
    kingLover: {},
    toshi: {},
    kingOfGirls: {},
  }
  for (let i = 0; i < 4; i++) {
    achievements.kingLover[i] = 0
    achievements.toshi[i] = 0
    achievements.kingOfGirls[i] = 0
  } // Start with first player

  document.getElementById('setupPanel').style.display = 'none'
  document.getElementById('modeSelect').style.display = 'none'
  document.getElementById('gameArea').style.display = 'block'

  renderScoreboard()
  renderGameSelector()
}

// Helper Functions
function getTeamIndex(pi) {
  return pi < 2 ? 0 : 1
}

function getTeamScore(ti) {
  const ps = ti === 0 ? [0, 1] : [2, 3]
  return scores[ps[0]] + scores[ps[1]]
}

function getOwnerLabel(pi) {
  if (mode === 'individual') return players[pi]
  const ti = getTeamIndex(pi)
  const idx = pi === 0 || pi === 2 ? 1 : 2
  return `${teamNames[ti]} - Player ${idx}`
}

function getPlayerLabel(pi) {
  if (mode === 'individual') return players[pi]
  const ti = getTeamIndex(pi)
  const idx = pi === 0 || pi === 2 ? 1 : 2
  return `${teamNames[ti]} - P${idx}`
}

// Render Scoreboard
function renderScoreboard() {
  const g = document.getElementById('scoresGrid')

  if (mode === 'individual') {
    g.innerHTML = players
      .map((p, i) => {
        const s = scores[i]
        const cls = s > 0 ? 'positive' : s < 0 ? 'negative' : ''
        const kd = Object.entries(kingdoms[i])
          .map(
            ([k, v]) =>
              `<div class="kingdom-item ${v ? 'done' : 'pending'}">${k}</div>`
          )
          .join('')
        const achievementBadges = getPlayerAchievements(i)
        return `<div class="score-card">
        <h3>${p}</h3>
        <div class="score ${cls}">${s}</div>
        ${
          achievementBadges
            ? `<div style="margin-top:10px;">${achievementBadges}</div>`
            : ''
        }
        <div class="kingdom-section">
          <div class="kingdom-tracker">${kd}</div>
        </div>
      </div>`
      })
      .join('')
  } else {
    g.innerHTML = [0, 1]
      .map((ti) => {
        const s = getTeamScore(ti)
        const cls = s > 0 ? 'positive' : s < 0 ? 'negative' : ''
        const ps = ti === 0 ? [0, 1] : [2, 3]
        let kingdomHtml = ''
        ps.forEach((pi, idx) => {
          const kd = Object.entries(kingdoms[pi])
            .map(
              ([k, v]) =>
                `<div class="kingdom-item ${v ? 'done' : 'pending'}">${k}</div>`
            )
            .join('')
          kingdomHtml += `<h5>Player ${
            idx + 1
          }</h5><div class="kingdom-tracker">${kd}</div>`
        })
        return `<div class="score-card">
        <h3>${teamNames[ti]}</h3>
        <div class="score ${cls}">${s}</div>
        <div class="kingdom-section">${kingdomHtml}</div>
      </div>`
      })
      .join('')
  }
}

// Render Game Selector - Auto-progress through players
function renderGameSelector() {
  const c = document.getElementById('gameSelector')
  document.getElementById('currentKingdom').style.display = 'none'

  // Check if all kingdoms are complete
  const allDone = Object.values(kingdoms).every((k) =>
    Object.values(k).every((v) => v)
  )
  if (allDone) {
    checkGameEnd()
    return
  }

  // Find next player with incomplete kingdom
  let searchCount = 0
  while (searchCount < 4) {
    const avail = Object.entries(kingdoms[currentPlayerIndex])
      .filter(([k, v]) => !v)
      .map(([k]) => k)

    if (avail.length > 0) {
      // This player has games to play
      currentOwner = currentPlayerIndex
      selectOwner(currentPlayerIndex)
      return
    }

    // Move to next player
    currentPlayerIndex = (currentPlayerIndex + 1) % 4
    searchCount++
  }
}

// Select Kingdom Owner
function selectOwner(pi) {
  currentOwner = pi

  // Build kingdom history from all history records for this owner
  kingdomHistory = history.filter((record) => record.ownerIndex === pi)

  const avail = Object.entries(kingdoms[pi])
    .filter(([k, v]) => !v)
    .map(([k]) => k)
  const c = document.getElementById('currentKingdom')
  const gameSelector = document.getElementById('gameSelector')

  // Hide game selector, show current kingdom
  gameSelector.style.display = 'none'
  c.style.display = 'block'
  c.innerHTML = `
    <h3>👑 ${getOwnerLabel(pi)}'s Kingdom</h3>
    <div style="text-align:center;margin-bottom:15px;font-size:clamp(14px,4vw,16px);color:#aaa;">
      Select one of the ${avail.length} remaining games:
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:15px">
      ${avail
        .map(
          (g) =>
            `<button class="game-btn" onclick="selectGame('${g}')">${g}</button>`
        )
        .join('')}
    </div>
    <div id="gameForm"></div>
  `
}

// Select Game
function selectGame(g) {
  currentGame = g
  gameInProgress = true
  document.querySelectorAll('.current-kingdom .game-btn').forEach((b) => {
    b.classList.toggle('active', b.textContent === g)
  })

  // Reset game-specific state
  cardCounts = [0, 0, 0, 0]
  queensState = {
    0: { taker: null, doubled: false, doubler: null, forcer: null },
    1: { taker: null, doubled: false, doubler: null, forcer: null },
    2: { taker: null, doubled: false, doubler: null, forcer: null },
    3: { taker: null, doubled: false, doubler: null, forcer: null },
  }
  khteyarState = { taker: null, doubled: false, doubler: null, forcer: null }
  trixPositions = [null, null, null, null]
  gameStep = 'select'
  currentQueenIndex = null

  renderGameForm(g)
}

// Render Game Form with new visual design
function renderGameForm(g) {
  const f = document.getElementById('gameForm')

  if (g === 'Trix') {
    renderTrixForm(f)
  } else if (g === 'Latosh') {
    renderLatoshForm(f)
  } else if (g === 'Dinari') {
    renderDinariForm(f)
  } else if (g === 'Banat') {
    renderGirlsForm(f)
  } else if (g === 'Khteyar') {
    renderKhteyarForm(f)
  }
}

// Trix Form with visual positions
function renderTrixForm(f) {
  f.innerHTML = `
    <div class="game-form">
      <div class="instruction-text">Click players to assign finishing positions</div>
      <div class="trix-positions">
        <div class="position-slot ${
          trixPositions[0] !== null ? 'filled' : ''
        }" id="pos0">
          <div class="position-label">🥇 1st Place</div>
          <div class="position-points">+200 points</div>
          ${
            trixPositions[0] !== null
              ? `<div class="position-player">${
                  playerIcons[trixPositions[0]]
                } ${getPlayerLabel(trixPositions[0])}</div>`
              : '<div class="position-player">Click a player</div>'
          }
        </div>
        <div class="position-slot ${
          trixPositions[1] !== null ? 'filled' : ''
        }" id="pos1">
          <div class="position-label">🥈 2nd Place</div>
          <div class="position-points">+150 points</div>
          ${
            trixPositions[1] !== null
              ? `<div class="position-player">${
                  playerIcons[trixPositions[1]]
                } ${getPlayerLabel(trixPositions[1])}</div>`
              : '<div class="position-player">Click a player</div>'
          }
        </div>
        <div class="position-slot ${
          trixPositions[2] !== null ? 'filled' : ''
        }" id="pos2">
          <div class="position-label">🥉 3rd Place</div>
          <div class="position-points">+100 points</div>
          ${
            trixPositions[2] !== null
              ? `<div class="position-player">${
                  playerIcons[trixPositions[2]]
                } ${getPlayerLabel(trixPositions[2])}</div>`
              : '<div class="position-player">Click a player</div>'
          }
        </div>
        <div class="position-slot ${
          trixPositions[3] !== null ? 'filled' : ''
        }" id="pos3">
          <div class="position-label">4th Place</div>
          <div class="position-points">+50 points</div>
          ${
            trixPositions[3] !== null
              ? `<div class="position-player">${
                  playerIcons[trixPositions[3]]
                } ${getPlayerLabel(trixPositions[3])}</div>`
              : '<div class="position-player">Click a player</div>'
          }
        </div>
      </div>
      <div class="player-table">
        ${[0, 1, 2, 3]
          .map(
            (pi) => `
          <div class="player-seat ${
            trixPositions.includes(pi) ? 'disabled' : ''
          }" onclick="selectTrixPlayer(${pi})">
            <div class="player-icon">${playerIcons[pi]}</div>
            <h3>${getPlayerLabel(pi)}</h3>
          </div>
        `
          )
          .join('')}
      </div>
      <div id="trixError" class="validation-error"></div>
      <div class="action-row">
        <button class="action-btn cancel" onclick="resetCurrentGame()">Reset</button>
        <button class="submit-game" onclick="submitTrix()" ${
          trixPositions.includes(null) ? 'disabled' : ''
        } style="margin:0;max-width:none;">Submit Trix</button>
      </div>
    </div>
  `
}

function selectTrixPlayer(pi) {
  if (trixPositions.includes(pi)) return // Already selected

  // Find next empty position
  const nextPos = trixPositions.indexOf(null)
  if (nextPos !== -1) {
    trixPositions[nextPos] = pi
    renderGameForm('Trix')
  }
}

// Latosh Form with counters
function renderLatoshForm(f) {
  const remaining = 13 - cardCounts.reduce((a, b) => a + b, 0)

  f.innerHTML = `
    <div class="game-form">
      <div class="instruction-text">Distribute 13 Latosh cards (-15 points each)</div>
      <div class="remaining-cards">Remaining: ${remaining} cards</div>
      <div class="player-table">
        ${[0, 1, 2, 3]
          .map(
            (pi) => `
          <div class="player-seat">
            <div class="player-icon">${playerIcons[pi]}</div>
            <h3>${getPlayerLabel(pi)}</h3>
            <div class="counter-controls">
              <button class="counter-btn" onclick="adjustCard(${pi}, -1, 'latosh')" ${
              cardCounts[pi] === 0 ? 'disabled' : ''
            }>−</button>
              <div class="counter-value">${cardCounts[pi]}</div>
              <button class="counter-btn" onclick="adjustCard(${pi}, 1, 'latosh')" ${
              remaining === 0 ? 'disabled' : ''
            }>+</button>
            </div>
            <div style="font-size:14px;color:#ff6b6b;margin-top:10px">${
              cardCounts[pi] * -15
            } pts</div>
          </div>
        `
          )
          .join('')}
      </div>
      <div id="latoshError" class="validation-error"></div>
      <div class="action-row">
        <button class="action-btn cancel" onclick="resetCurrentGame()">Reset</button>
        <button class="submit-game" onclick="submitLatosh()" ${
          remaining !== 0 ? 'disabled' : ''
        } style="margin:0;max-width:none;">Submit Latosh</button>
      </div>
    </div>
  `
}

// Dinari Form with counters
function renderDinariForm(f) {
  const remaining = 13 - cardCounts.reduce((a, b) => a + b, 0)

  f.innerHTML = `
    <div class="game-form">
      <div class="instruction-text">Distribute 13 Diamond cards (-10 points each)</div>
      <div class="remaining-cards">Remaining: ${remaining} ♦ cards</div>
      <div class="player-table">
        ${[0, 1, 2, 3]
          .map(
            (pi) => `
          <div class="player-seat">
            <div class="player-icon">${playerIcons[pi]}</div>
            <h3>${getPlayerLabel(pi)}</h3>
            <div class="counter-controls">
              <button class="counter-btn" onclick="adjustCard(${pi}, -1, 'dinari')" ${
              cardCounts[pi] === 0 ? 'disabled' : ''
            }>−</button>
              <div class="counter-value">${cardCounts[pi]}</div>
              <button class="counter-btn" onclick="adjustCard(${pi}, 1, 'dinari')" ${
              remaining === 0 ? 'disabled' : ''
            }>+</button>
            </div>
            <div style="font-size:14px;color:#ff6b6b;margin-top:10px">${
              cardCounts[pi] * -10
            } pts</div>
          </div>
        `
          )
          .join('')}
      </div>
      <div id="dinariError" class="validation-error"></div>
      <div class="action-row">
        <button class="action-btn cancel" onclick="resetCurrentGame()">Reset</button>
        <button class="submit-game" onclick="submitDinari()" ${
          remaining !== 0 ? 'disabled' : ''
        } style="margin:0;max-width:none;">Submit Dinari</button>
      </div>
    </div>
  `
}

function adjustCard(pi, delta, gameType) {
  const remaining = 13 - cardCounts.reduce((a, b) => a + b, 0)

  if (delta > 0 && remaining > 0) {
    cardCounts[pi]++
  } else if (delta < 0 && cardCounts[pi] > 0) {
    cardCounts[pi]--
  }

  if (gameType === 'latosh') {
    renderLatoshForm(document.getElementById('gameForm'))
  } else if (gameType === 'dinari') {
    renderDinariForm(document.getElementById('gameForm'))
  }
}

// Girls (Queens) Form with visual cards
function renderGirlsForm(f) {
  const suits = ['♠', '♥', '♦', '♣']
  const suitNames = ['spades', 'hearts', 'diamonds', 'clubs']

  if (gameStep === 'select') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">Click a queen card, then select who took it</div>
        <div class="queen-cards">
          ${suits
            .map(
              (suit, qi) => `
            <div class="queen-card ${suitNames[qi]} ${
                queensState[qi].taker !== null ? 'filled' : ''
              }" onclick="selectQueen(${qi})">
              <div class="queen-card-header">
                <div class="queen-card-title">Q${suit}</div>
                <div class="double-indicator ${
                  queensState[qi].doubled ? 'active' : ''
                }">2X</div>
              </div>
              <div class="queen-card-body">
                ${
                  queensState[qi].taker !== null
                    ? `
                  <div style="text-align:center;">
                    <div style="font-size:40px;">${
                      playerIcons[queensState[qi].taker]
                    }</div>
                    <div style="font-weight:600;margin-top:10px;">${getPlayerLabel(
                      queensState[qi].taker
                    )}</div>
                    <div style="color:#e74c3c;font-weight:bold;margin-top:5px;">${
                      queensState[qi].doubled ? '-50' : '-25'
                    } pts</div>
                    ${
                      queensState[qi].doubled &&
                      queensState[qi].doubler !== null
                        ? `
                      <div style="font-size:12px;margin-top:5px;color:#666;">Doubled by ${
                        playerIcons[queensState[qi].doubler]
                      } ${getPlayerLabel(queensState[qi].doubler)}</div>
                    `
                        : ''
                    }
                  </div>
                `
                    : '<div class="queen-status">Not taken</div>'
                }
              </div>
            </div>
          `
            )
            .join('')}
        </div>
        <div id="girlsError" class="validation-error"></div>
        <div class="action-row">
          <button class="action-btn cancel" onclick="resetCurrentGame()">Reset</button>
          <button class="submit-game" onclick="submitGirls()" ${
            Object.values(queensState).some((q) => q.taker === null)
              ? 'disabled'
              : ''
          } style="margin:0;max-width:none;">Submit Banat</button>
        </div>
      </div>
    `
  } else if (gameStep === 'assignTaker') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">Who took the Q${
          suits[currentQueenIndex]
        }? Click a player</div>
        <div class="player-table">
          ${[0, 1, 2, 3]
            .map(
              (pi) => `
            <div class="player-seat" onclick="assignQueenTaker(${pi})">
              <div class="player-icon">${playerIcons[pi]}</div>
              <h3>${getPlayerLabel(pi)}</h3>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="action-row">
          <button class="action-btn cancel" onclick="cancelQueenSelection()">Cancel</button>
        </div>
      </div>
    `
  } else if (gameStep === 'askDouble') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">Was Q${suits[currentQueenIndex]} doubled?</div>
        <div class="action-row">
          <button class="action-btn double" onclick="setQueenDoubled(true)">Yes, Doubled</button>
          <button class="action-btn cancel" onclick="setQueenDoubled(false)">No</button>
        </div>
      </div>
    `
  } else if (gameStep === 'assignDoubler') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">Who doubled the Q${
          suits[currentQueenIndex]
        }? Click a player</div>
        <div class="player-table">
          ${[0, 1, 2, 3]
            .map(
              (pi) => `
            <div class="player-seat" onclick="assignQueenDoubler(${pi})">
              <div class="player-icon">${playerIcons[pi]}</div>
              <h3>${getPlayerLabel(pi)}</h3>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
  } else if (gameStep === 'askForced') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">Was ${getPlayerLabel(
          queensState[currentQueenIndex].taker
        )} forced to take this queen?</div>
        <div class="action-row">
          <button class="action-btn double" onclick="setQueenForced(true)">Yes, Forced</button>
          <button class="action-btn cancel" onclick="setQueenForced(false)">No</button>
        </div>
      </div>
    `
  } else if (gameStep === 'assignForcer') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">Who forced ${getPlayerLabel(
          queensState[currentQueenIndex].taker
        )} to take the Q${suits[currentQueenIndex]}?</div>
        <div class="player-table">
          ${[0, 1, 2, 3]
            .filter((pi) => pi !== queensState[currentQueenIndex].taker)
            .map(
              (pi) => `
            <div class="player-seat" onclick="assignQueenForcer(${pi})">
              <div class="player-icon">${playerIcons[pi]}</div>
              <h3>${getPlayerLabel(pi)}</h3>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
  }
}

function selectQueen(qi) {
  if (gameStep !== 'select') return
  currentQueenIndex = qi
  gameStep = 'assignTaker'
  renderGirlsForm(document.getElementById('gameForm'))
}

function assignQueenTaker(pi) {
  queensState[currentQueenIndex].taker = pi
  gameStep = 'askDouble'
  renderGirlsForm(document.getElementById('gameForm'))
}

function setQueenDoubled(doubled) {
  queensState[currentQueenIndex].doubled = doubled
  if (doubled) {
    gameStep = 'assignDoubler'
    renderGirlsForm(document.getElementById('gameForm'))
  } else {
    currentQueenIndex = null
    gameStep = 'select'
    renderGirlsForm(document.getElementById('gameForm'))
  }
}

function assignQueenDoubler(pi) {
  queensState[currentQueenIndex].doubler = pi

  // Check if taker and doubler are the same person (self-double)
  if (queensState[currentQueenIndex].taker === pi) {
    // Ask if they were forced
    gameStep = 'askForced'
    renderGirlsForm(document.getElementById('gameForm'))
  } else {
    // Different players, proceed normally
    currentQueenIndex = null
    gameStep = 'select'
    renderGirlsForm(document.getElementById('gameForm'))
  }
}

function setQueenForced(forced) {
  if (forced) {
    gameStep = 'assignForcer'
    renderGirlsForm(document.getElementById('gameForm'))
  } else {
    queensState[currentQueenIndex].forcer = null
    currentQueenIndex = null
    gameStep = 'select'
    renderGirlsForm(document.getElementById('gameForm'))
  }
}

function assignQueenForcer(pi) {
  queensState[currentQueenIndex].forcer = pi
  currentQueenIndex = null
  gameStep = 'select'
  renderGirlsForm(document.getElementById('gameForm'))
}

function cancelQueenSelection() {
  queensState[currentQueenIndex] = {
    taker: null,
    doubled: false,
    doubler: null,
    forcer: null,
  }
  currentQueenIndex = null
  gameStep = 'select'
  renderGirlsForm(document.getElementById('gameForm'))
}

// Khteyar Form
function renderKhteyarForm(f) {
  if (gameStep === 'select') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">Who took the K♠? Click a player</div>
        <div class="player-table">
          ${[0, 1, 2, 3]
            .map(
              (pi) => `
            <div class="player-seat ${
              khteyarState.taker === pi ? 'selected' : ''
            }" onclick="selectKhteyarTaker(${pi})">
              <div class="player-icon">${playerIcons[pi]}</div>
              <h3>${getPlayerLabel(pi)}</h3>
            </div>
          `
            )
            .join('')}
        </div>
        ${
          khteyarState.taker !== null
            ? `
          <div class="action-row">
            <button class="action-btn double" onclick="askKhteyarDouble()">Next</button>
          </div>
        `
            : ''
        }
      </div>
    `
  } else if (gameStep === 'askDouble') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">Was K♠ doubled?</div>
        <div class="action-row">
          <button class="action-btn double" onclick="setKhteyarDoubled(true)">Yes, Doubled</button>
          <button class="action-btn cancel" onclick="setKhteyarDoubled(false)">No</button>
        </div>
      </div>
    `
  } else if (gameStep === 'assignDoubler') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">Who doubled the K♠? Click a player</div>
        <div class="player-table">
          ${[0, 1, 2, 3]
            .map(
              (pi) => `
            <div class="player-seat" onclick="assignKhteyarDoubler(${pi})">
              <div class="player-icon">${playerIcons[pi]}</div>
              <h3>${getPlayerLabel(pi)}</h3>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
  } else if (gameStep === 'askForced') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">Was ${getPlayerLabel(
          khteyarState.taker
        )} forced to take the K♠?</div>
        <div class="action-row">
          <button class="action-btn double" onclick="setKhteyarForced(true)">Yes, Forced</button>
          <button class="action-btn cancel" onclick="setKhteyarForced(false)">No</button>
        </div>
      </div>
    `
  } else if (gameStep === 'assignForcer') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">Who forced ${getPlayerLabel(
          khteyarState.taker
        )} to take the K♠?</div>
        <div class="player-table">
          ${[0, 1, 2, 3]
            .filter((pi) => pi !== khteyarState.taker)
            .map(
              (pi) => `
            <div class="player-seat" onclick="assignKhteyarForcer(${pi})">
              <div class="player-icon">${playerIcons[pi]}</div>
              <h3>${getPlayerLabel(pi)}</h3>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `
  }
}

function selectKhteyarTaker(pi) {
  khteyarState.taker = pi
  renderKhteyarForm(document.getElementById('gameForm'))
}

function askKhteyarDouble() {
  gameStep = 'askDouble'
  renderKhteyarForm(document.getElementById('gameForm'))
}

function setKhteyarDoubled(doubled) {
  khteyarState.doubled = doubled
  if (doubled) {
    gameStep = 'assignDoubler'
    renderKhteyarForm(document.getElementById('gameForm'))
  } else {
    submitKhteyar()
  }
}

function assignKhteyarDoubler(pi) {
  khteyarState.doubler = pi

  // Check if taker and doubler are the same person (self-double)
  if (khteyarState.taker === pi) {
    // Ask if they were forced
    gameStep = 'askForced'
    renderKhteyarForm(document.getElementById('gameForm'))
  } else {
    // Different players, proceed to submit
    submitKhteyar()
  }
}

function setKhteyarForced(forced) {
  if (forced) {
    gameStep = 'assignForcer'
    renderKhteyarForm(document.getElementById('gameForm'))
  } else {
    khteyarState.forcer = null
    submitKhteyar()
  }
}

function assignKhteyarForcer(pi) {
  khteyarState.forcer = pi
  submitKhteyar()
}

// Submit Functions
function submitTrix() {
  if (trixPositions.includes(null)) {
    document.getElementById('trixError').textContent =
      'Please assign all positions!'
    return
  }

  const pts = [200, 150, 100, 50]
  const changes = []
  const scoreChanges = []
  trixPositions.forEach((pi, pos) => {
    scores[pi] += pts[pos]
    changes.push(`${getPlayerLabel(pi)}: +${pts[pos]}`)
    scoreChanges.push({ player: pi, points: pts[pos] })
  })
  finishGame('Trix', changes.join(', '), scoreChanges)
}

function submitLatosh() {
  const total = cardCounts.reduce((a, b) => a + b, 0)
  if (total !== 13) {
    document.getElementById(
      'latoshError'
    ).textContent = `Total Latosh must be 13! Current: ${total}`
    return
  }
  const changes = []
  const scoreChanges = []
  cardCounts.forEach((c, i) => {
    const pts = c * -15
    scores[i] += pts
    if (pts !== 0) {
      changes.push(`${getPlayerLabel(i)}: ${pts}`)
      scoreChanges.push({ player: i, points: pts })
    }
  })
  finishGame('Latosh', changes.join(', '), scoreChanges)
}

function submitDinari() {
  const total = cardCounts.reduce((a, b) => a + b, 0)
  if (total !== 13) {
    document.getElementById(
      'dinariError'
    ).textContent = `Total diamonds must be 13! Current: ${total}`
    return
  }
  const changes = []
  const scoreChanges = []
  cardCounts.forEach((c, i) => {
    const pts = c * -10
    scores[i] += pts
    if (pts !== 0) {
      changes.push(`${getPlayerLabel(i)}: ${pts}`)
      scoreChanges.push({ player: i, points: pts })
    }
  })
  finishGame('Dinari', changes.join(', '), scoreChanges)
}

function submitGirls() {
  // Validate that all 4 queens are assigned
  const unassignedQueens = []
  const suits = ['♠', '♥', '♦', '♣']

  for (let qi = 0; qi < 4; qi++) {
    if (queensState[qi].taker === null) {
      unassignedQueens.push(`Q${suits[qi]}`)
    }
  }

  if (unassignedQueens.length > 0) {
    document.getElementById(
      'girlsError'
    ).textContent = `Please assign all queens! Missing: ${unassignedQueens.join(
      ', '
    )}`
    return
  }

  const changes = []
  const scoreChanges = []

  for (let qi = 0; qi < 4; qi++) {
    const queen = queensState[qi]

    if (queen.doubled) {
      if (mode === 'individual') {
        scores[queen.taker] += -50
        scoreChanges.push({ player: queen.taker, points: -50 })

        if (queen.doubler === queen.taker) {
          // Self-doubled: check if forced
          if (queen.forcer !== null) {
            // Forced to take own doubled queen - forcer gets bonus
            scores[queen.forcer] += 25
            scoreChanges.push({ player: queen.forcer, points: 25 })
            changes.push(
              `${getPlayerLabel(queen.taker)}: -50, ${getPlayerLabel(
                queen.forcer
              )}: +25 (Q${suits[qi]} self-doubled but forced)`
            )
          } else {
            // Voluntary self-double - no bonus
            changes.push(
              `${getPlayerLabel(queen.taker)}: -50 (self-doubled Q${suits[qi]})`
            )
          }
        } else {
          // Different players - normal bonus
          scores[queen.doubler] += 25
          scoreChanges.push({ player: queen.doubler, points: 25 })
          changes.push(
            `${getPlayerLabel(queen.taker)}: -50, ${getPlayerLabel(
              queen.doubler
            )}: +25 (Q${suits[qi]} doubled)`
          )
        }
      } else {
        const takerTeam = getTeamIndex(queen.taker)
        const doublerTeam = getTeamIndex(queen.doubler)

        scores[queen.taker] += -50
        scoreChanges.push({ player: queen.taker, points: -50 })

        if (takerTeam === doublerTeam) {
          // Same team (partner doubled or self-doubled)
          if (queen.doubler === queen.taker && queen.forcer !== null) {
            // Self-doubled but forced by opponent - opponent gets bonus
            scores[queen.forcer] += 25
            scoreChanges.push({ player: queen.forcer, points: 25 })
            changes.push(
              `${getPlayerLabel(queen.taker)}: -50, ${getPlayerLabel(
                queen.forcer
              )}: +25 (Q${suits[qi]} self-doubled but forced)`
            )
          } else {
            // Partner doubled or voluntary self-double
            changes.push(
              `${getPlayerLabel(queen.taker)}: -50 (partner doubled Q${
                suits[qi]
              })`
            )
          }
        } else {
          // Different teams - opponent doubled
          scores[queen.doubler] += 25
          scoreChanges.push({ player: queen.doubler, points: 25 })
          changes.push(
            `${getPlayerLabel(queen.taker)}: -50, ${getPlayerLabel(
              queen.doubler
            )}: +25 (Q${suits[qi]} doubled by opponent)`
          )
        }
      }
    } else {
      scores[queen.taker] += -25
      scoreChanges.push({ player: queen.taker, points: -25 })
      changes.push(`${getPlayerLabel(queen.taker)}: -25 (Q${suits[qi]})`)
    }
  }
  finishGame(
    'Banat',
    changes.length ? changes.join(', ') : 'No queens taken',
    scoreChanges
  )
}

function submitKhteyar() {
  const taker = khteyarState.taker
  const doubled = khteyarState.doubled
  const doubler = khteyarState.doubler
  const forcer = khteyarState.forcer
  const changes = []
  const scoreChanges = []

  if (doubled) {
    if (mode === 'individual') {
      if (doubler === taker) {
        // Self-doubled: check if forced
        scores[taker] += -150
        scoreChanges.push({ player: taker, points: -150 })

        if (forcer !== null) {
          // Forced to take own doubled king - forcer gets bonus
          scores[forcer] += 75
          scoreChanges.push({ player: forcer, points: 75 })
          changes.push(
            `${getPlayerLabel(taker)}: -150, ${getPlayerLabel(
              forcer
            )}: +75 (K♠ self-doubled but forced)`
          )
        } else {
          // Voluntary self-double - no bonus
          changes.push(`${getPlayerLabel(taker)}: -150 (self-doubled K♠)`)
        }
      } else {
        // Different players - normal bonus
        scores[taker] += -150
        scores[doubler] += 75
        scoreChanges.push({ player: taker, points: -150 })
        scoreChanges.push({ player: doubler, points: 75 })
        changes.push(
          `${getPlayerLabel(taker)}: -150, ${getPlayerLabel(
            doubler
          )}: +75 (K♠ doubled)`
        )
      }
    } else {
      const takerTeam = getTeamIndex(taker)
      const doublerTeam = getTeamIndex(doubler)
      if (takerTeam === doublerTeam) {
        // Same team (partner doubled or self-doubled)
        scores[taker] += -150
        scoreChanges.push({ player: taker, points: -150 })

        if (doubler === taker && forcer !== null) {
          // Self-doubled but forced by opponent - opponent gets bonus
          scores[forcer] += 75
          scoreChanges.push({ player: forcer, points: 75 })
          changes.push(
            `${getPlayerLabel(taker)}: -150, ${getPlayerLabel(
              forcer
            )}: +75 (K♠ self-doubled but forced)`
          )
        } else {
          // Partner doubled or voluntary self-double
          changes.push(`${getPlayerLabel(taker)}: -150 (partner doubled K♠)`)
        }
      } else {
        // Different teams - opponent doubled
        scores[taker] += -150
        scores[doubler] += 75
        scoreChanges.push({ player: taker, points: -150 })
        scoreChanges.push({ player: doubler, points: 75 })
        changes.push(
          `${getPlayerLabel(taker)}: -150, ${getPlayerLabel(
            doubler
          )}: +75 (K♠ doubled)`
        )
      }
    }
  } else {
    scores[taker] += -75
    scoreChanges.push({ player: taker, points: -75 })
    changes.push(`${getPlayerLabel(taker)}: -75 (K♠)`)
  }
  finishGame('Khteyar', changes.join(', '), scoreChanges)
}

// Finish Game
function finishGame(game, details, scoreChanges) {
  kingdoms[currentOwner][game] = true
  const timestamp = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Convert scoreChanges array to indexed format for easier rendering
  const scoreChangesIndexed = [0, 0, 0, 0]
  scoreChanges.forEach((change) => {
    scoreChangesIndexed[change.player] = change.points
  })

  const record = {
    owner: getOwnerLabel(currentOwner),
    ownerIndex: currentOwner,
    game,
    details,
    timestamp,
    scoreChanges: scoreChangesIndexed, // Use indexed format
    scoreChangesOriginal: scoreChanges, // Keep original for deleteGame
  }

  // Add game-specific data for table rendering
  if (game === 'Trix') {
    record.positions = [...trixPositions]
  } else if (game === 'Latosh' || game === 'Dinari') {
    record.cardCounts = [...cardCounts]
  } else if (game === 'Banat') {
    // Store queen details for each player
    record.queensDetails = []
    for (let pi = 0; pi < 4; pi++) {
      const queens = []
      for (let qi = 0; qi < 4; qi++) {
        if (queensState[qi].taker === pi) {
          const suits = ['♠', '♥', '♦', '♣']
          queens.push(queensState[qi].doubled ? `${suits[qi]}×2` : suits[qi])
        }
      }
      record.queensDetails[pi] = queens.length > 0 ? queens.join(' ') : '-'
    }
  } else if (game === 'Khteyar') {
    record.khteyarTaker = khteyarState.taker
    record.khteyarDoubled = khteyarState.doubled
  }

  history.push(record)
  kingdomHistory.push(record) // Track for this kingdom

  // Check for achievements
  checkAchievements(game, scoreChanges)

  renderHistory()
  renderScoreboard()

  currentGame = null
  gameInProgress = false

  // Check if this player's kingdom is complete
  const kingdomComplete = Object.values(kingdoms[currentOwner]).every((v) => v)

  if (kingdomComplete) {
    showKingdomOverview()
  } else {
    // More games to play, refresh the game selector
    selectOwner(currentOwner)
  }
}

// Render History - Show kingdoms individually with tables
function renderHistory() {
  const c = document.getElementById('historyList')
  if (history.length === 0) {
    c.innerHTML =
      '<div style="text-align:center;color:#aaa;padding:20px">No games played yet</div>'
    return
  }

  // Group history by kingdom owner
  const kingdomGroups = {}
  for (let i = 0; i < 4; i++) {
    kingdomGroups[i] = history.filter((h) => h.ownerIndex === i)
  }

  // Render each player's kingdom
  let html = ''
  for (let i = 0; i < 4; i++) {
    const games = kingdomGroups[i]
    if (games.length === 0) continue

    html += `
      <div class="kingdom-history-section">
        <div class="kingdom-history-header">
          <span class="kingdom-owner-icon">${playerIcons[i]}</span>
          <span class="kingdom-owner-name">${getOwnerLabel(i)}'s Kingdom</span>
        </div>
        <div class="kingdom-games-table">
    `

    games.forEach((h, idx) => {
      const realIdx = history.indexOf(h)
      html += renderGameTable(h, realIdx)
    })

    html += `
        </div>
      </div>
    `
  }

  c.innerHTML = html
}

// Render individual game table
function renderGameTable(h, realIdx) {
  let tableHtml = `
    <div class="game-table-container">
      <div class="game-table-header">
        <span class="game-name">${h.game}</span>
        <span class="game-time">${h.timestamp}</span>
      </div>
      <table class="game-results-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Score</th>
            ${h.game === 'Banat' ? '<th>Details</th>' : ''}
          </tr>
        </thead>
        <tbody>
  `

  // Generate table rows based on game type
  for (let pi = 0; pi < 4; pi++) {
    const score = h.scoreChanges[pi]
    const scoreClass =
      score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
    const scoreDisplay = score > 0 ? `+${score}` : score

    let details = ''
    if (h.game === 'Trix') {
      const position = h.positions?.indexOf(pi)
      if (position === 0) details = '🥇 1st'
      else if (position === 1) details = '🥈 2nd'
      else if (position === 2) details = '🥉 3rd'
      else if (position === 3) details = '4th'
    } else if (h.game === 'Latosh' || h.game === 'Dinari') {
      const count = h.cardCounts?.[pi] || 0
      if (count > 0) details = `${count} cards`
    } else if (h.game === 'Banat') {
      details = h.queensDetails?.[pi] || '-'
    } else if (h.game === 'Khteyar') {
      if (h.khteyarTaker === pi) {
        details = h.khteyarDoubled ? '👑 (Doubled)' : '👑'
      }
    }

    tableHtml += `
      <tr>
        <td class="player-cell">
          <span class="player-icon-small">${playerIcons[pi]}</span>
          ${getPlayerLabel(pi)}
        </td>
        <td class="score-cell ${scoreClass}">${scoreDisplay}</td>
        ${h.game === 'Banat' ? `<td class="details-cell">${details}</td>` : ''}
      </tr>
    `
  }

  // Add details row for non-Banat games
  if (h.game !== 'Banat') {
    tableHtml += `
      <tr class="details-row">
        <td colspan="2" class="game-details">
    `

    for (let pi = 0; pi < 4; pi++) {
      let details = ''
      if (h.game === 'Trix') {
        const position = h.positions?.indexOf(pi)
        if (position === 0) details = `${playerIcons[pi]} 🥇 1st`
        else if (position === 1) details = `${playerIcons[pi]} 🥈 2nd`
        else if (position === 2) details = `${playerIcons[pi]} 🥉 3rd`
        else if (position === 3) details = `${playerIcons[pi]} 4th`
      } else if (h.game === 'Latosh' || h.game === 'Dinari') {
        const count = h.cardCounts?.[pi] || 0
        if (count > 0) details = `${playerIcons[pi]} ${count} cards`
      } else if (h.game === 'Khteyar') {
        if (h.khteyarTaker === pi) {
          details = h.khteyarDoubled
            ? `${playerIcons[pi]} 👑 (Doubled)`
            : `${playerIcons[pi]} 👑`
        }
      }
      if (details) {
        tableHtml += `<span class="detail-item">${details}</span>`
      }
    }

    tableHtml += `
        </td>
      </tr>
    `
  }

  tableHtml += `
        </tbody>
      </table>
      <div class="game-table-actions">
        <button class="delete-game-btn" onclick="deleteGame(${realIdx})">
          🗑️ Delete
        </button>
      </div>
    </div>
  `

  return tableHtml
}

// Check Game End
function checkGameEnd() {
  const allDone = Object.values(kingdoms).every((k) =>
    Object.values(k).every((v) => v)
  )
  if (allDone) {
    setTimeout(() => {
      showWinnerCelebration()
    }, 500)
  }
}

// Reset Current Game Form
function resetCurrentGame() {
  if (!confirm('Reset the current game form?')) return

  // Reset all game-specific state
  cardCounts = [0, 0, 0, 0]
  queensState = {
    0: { taker: null, doubled: false, doubler: null, forcer: null },
    1: { taker: null, doubled: false, doubler: null, forcer: null },
    2: { taker: null, doubled: false, doubler: null, forcer: null },
    3: { taker: null, doubled: false, doubler: null, forcer: null },
  }
  khteyarState = { taker: null, doubled: false, doubler: null, forcer: null }
  trixPositions = [null, null, null, null]
  gameStep = 'select'
  currentQueenIndex = null

  // Re-render the current game form
  if (currentGame) {
    renderGameForm(currentGame)
  }
}

// Show Kingdom Overview after completion
function showKingdomOverview() {
  const c = document.getElementById('currentKingdom')
  const gameSelector = document.getElementById('gameSelector')

  gameSelector.style.display = 'none'
  c.style.display = 'block'

  // Calculate kingdom score changes
  let kingdomScoreChanges = [0, 0, 0, 0]
  kingdomHistory.forEach((record) => {
    record.scoreChanges.forEach((change) => {
      kingdomScoreChanges[change.player] += change.points
    })
  })

  // Create overview display
  let overviewHtml = `
    <div style="background:rgba(76,205,196,0.1);border:2px solid #4ecdc4;border-radius:15px;padding:20px;margin-bottom:20px;">
      <h3 style="text-align:center;color:#4ecdc4;font-size:clamp(20px,5vw,24px);margin-bottom:15px;">✅ Kingdom Complete!</h3>
      <h4 style="text-align:center;color:#ffd700;font-size:clamp(16px,4.5vw,20px);margin-bottom:20px;">${getOwnerLabel(
        currentOwner
      )}'s Kingdom Summary</h4>

      <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:15px;margin-bottom:15px;">
        <h5 style="color:#aaa;font-size:clamp(14px,4vw,16px);margin-bottom:10px;text-align:center;">Games Completed:</h5>
        <div style="display:grid;gap:8px;">
          ${kingdomHistory
            .map((record, idx) => {
              // Find actual index in history array
              const historyIdx = history.findIndex((h) => h === record)
              return `
            <div style="background:#2d3a4f;padding:10px;border-radius:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <strong style="color:#ffd700;font-size:clamp(13px,3.8vw,15px);">${record.game}</strong>
                <span style="color:#aaa;font-size:clamp(11px,3vw,13px);">${record.timestamp}</span>
              </div>
              <div style="color:#ddd;font-size:clamp(12px,3.5vw,14px);margin-top:5px;">${record.details}</div>
              <button onclick="deleteGame(${historyIdx})" style="margin-top:8px;padding:6px 12px;background:#ff6b6b;color:white;border:none;border-radius:6px;cursor:pointer;font-size:clamp(11px,3vw,13px);width:100%;">🗑️ Delete</button>
            </div>
          `
            })
            .join('')}
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:15px;margin-bottom:20px;">
        <h5 style="color:#aaa;font-size:clamp(14px,4vw,16px);margin-bottom:10px;text-align:center;">Score Changes:</h5>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">
          ${[0, 1, 2, 3]
            .map((pi) => {
              const change = kingdomScoreChanges[pi]
              const color =
                change > 0 ? '#4ecdc4' : change < 0 ? '#ff6b6b' : '#aaa'
              return `
              <div style="text-align:center;background:#2d3a4f;padding:12px;border-radius:8px;">
                <div style="font-size:clamp(30px,8vw,40px);margin-bottom:5px;">${
                  playerIcons[pi]
                }</div>
                <div style="font-size:clamp(12px,3.5vw,14px);color:#aaa;margin-bottom:5px;">${getPlayerLabel(
                  pi
                )}</div>
                <div style="font-size:clamp(20px,6vw,28px);font-weight:bold;color:${color};">${
                change > 0 ? '+' : ''
              }${change}</div>
              </div>
            `
            })
            .join('')}
        </div>
      </div>

      <div class="action-row" style="margin-top:20px;">
        <button class="action-btn cancel" onclick="editKingdom()" style="background:#ff9800;">📝 Edit Kingdom</button>
        <button class="action-btn double" onclick="confirmKingdom()" style="background:#4ecdc4;color:#1a1a2e;flex:2;">✅ Confirm & Continue</button>
      </div>
    </div>
  `

  c.innerHTML = overviewHtml
}

// Edit Kingdom - return to game selection
function editKingdom() {
  selectOwner(currentOwner)
}

// Confirm Kingdom and move to next player
function confirmKingdom() {
  // Move to next player
  currentPlayerIndex = (currentPlayerIndex + 1) % 4

  // Clear kingdom history
  kingdomHistory = []

  // Show next player's kingdom or end game
  renderGameSelector()
}

// Delete a completed game (reverse scores and mark kingdom incomplete)
function deleteGame(idx) {
  if (
    !confirm(
      'Delete this game? This will reverse the scores and allow you to play it again.'
    )
  )
    return

  const record = history[idx]
  const ownerIdx = record.ownerIndex

  // Mark kingdom as incomplete so it can be played again
  kingdoms[ownerIdx][record.game] = false

  // Reverse the score changes using original format or indexed format
  if (record.scoreChangesOriginal) {
    record.scoreChangesOriginal.forEach((change) => {
      scores[change.player] -= change.points
    })
  } else {
    // Fallback for old format
    record.scoreChanges.forEach((points, player) => {
      scores[player] -= points
    })
  }

  // Remove this record from history
  history.splice(idx, 1)

  // Remove from kingdom history if it's in current kingdom
  const kingdomIdx = kingdomHistory.findIndex((r) => r === record)
  if (kingdomIdx !== -1) {
    kingdomHistory.splice(kingdomIdx, 1)
  }

  renderHistory()
  renderScoreboard()

  // Check if we're in overview mode and kingdom is no longer complete
  const kingdomComplete = Object.values(kingdoms[ownerIdx]).every((v) => v)
  if (!kingdomComplete && currentOwner !== null) {
    // Return to game selection for this kingdom
    selectOwner(ownerIdx)
  } else if (kingdomComplete && currentOwner !== null) {
    // Refresh the overview
    showKingdomOverview()
  } else {
    renderGameSelector()
  }
}

// Reset Game
function resetGame() {
  if (!confirm('Reset the entire game?')) return

  mode = 'individual'
  players = ['Player 1', 'Player 2', 'Player 3', 'Player 4']
  teamNames = ['Team 1', 'Team 2']
  scores = [0, 0, 0, 0]
  kingdoms = {}
  history = []
  kingdomHistory = []
  currentOwner = null
  currentGame = null
  currentPlayerIndex = 0
  achievements = {
    kingLover: {},
    toshi: {},
    kingOfGirls: {},
  }

  document.getElementById('setupPanel').style.display = 'block'
  document.getElementById('modeSelect').style.display = 'flex'
  document.getElementById('gameArea').style.display = 'none'
  document.getElementById('indBtn').classList.add('active')
  document.getElementById('partBtn').classList.remove('active')
  document.getElementById('historyList').innerHTML = ''

  renderSetup()
}

// Achievement Functions
function showAchievementPopup(type, playerIndex) {
  const titles = {
    kingLover: '👑💔 King Lover!',
    toshi: '🎯 Toshi Master!',
    kingOfGirls: '👸 King of the Girls!',
  }

  const descriptions = {
    kingLover: 'Took the K♠ 2+ times! Someone loves the king! 😂',
    toshi: 'Finished 4th place (50 pts) in Trix 2+ times!',
    kingOfGirls: 'Took all 4 Queens in a single Banat game! 👑',
  }

  const icons = {
    kingLover: '👑💔',
    toshi: '🎯💀',
    kingOfGirls: '👸💕',
  }

  const popup = document.createElement('div')
  popup.className = `achievement-popup ${type}`
  popup.innerHTML = `
    <div class="achievement-popup-icon">${icons[type]}</div>
    <div class="achievement-popup-title">${titles[type]}</div>
    <div class="achievement-popup-desc">${descriptions[type]}</div>
    <div class="achievement-popup-player">${
      playerIcons[playerIndex]
    } ${getPlayerLabel(playerIndex)}</div>
  `

  document.body.appendChild(popup)

  setTimeout(() => {
    popup.style.animation = 'achievementPop 0.4s ease-out reverse'
    setTimeout(() => popup.remove(), 400)
  }, 3000)
}

function checkAchievements(game, scoreChanges) {
  // King Lover: Took K♠ 2+ times
  if (game === 'Khteyar') {
    const taker = khteyarState.taker
    achievements.kingLover[taker]++
    if (achievements.kingLover[taker] === 2) {
      setTimeout(() => showAchievementPopup('kingLover', taker), 500)
    }
  }

  // Toshi: Got 50 points in Trix (4th place) 2+ times
  if (game === 'Trix') {
    scoreChanges.forEach((change) => {
      if (change.points === 50) {
        achievements.toshi[change.player]++
        if (achievements.toshi[change.player] === 2) {
          setTimeout(() => showAchievementPopup('toshi', change.player), 500)
        }
      }
    })
  }

  // King of the Girls: Took all 4 queens in one game
  if (game === 'Banat') {
    const queensPerPlayer = [0, 0, 0, 0]
    for (let qi = 0; qi < 4; qi++) {
      if (queensState[qi].taker !== null) {
        queensPerPlayer[queensState[qi].taker]++
      }
    }
    queensPerPlayer.forEach((count, pi) => {
      if (count === 4) {
        achievements.kingOfGirls[pi]++
        setTimeout(() => showAchievementPopup('kingOfGirls', pi), 500)
      }
    })
  }
}

function getPlayerAchievements(pi) {
  const badges = []
  if (achievements.kingLover[pi] >= 2) {
    badges.push(
      `<span class="achievement-badge king-lover" title="King Lover: Took K♠ ${achievements.kingLover[pi]} times">👑💔 King Lover x${achievements.kingLover[pi]}</span>`
    )
  }
  if (achievements.toshi[pi] >= 2) {
    badges.push(
      `<span class="achievement-badge toshi" title="Toshi: 4th place ${achievements.toshi[pi]} times">🎯 Toshi x${achievements.toshi[pi]}</span>`
    )
  }
  if (achievements.kingOfGirls[pi] >= 1) {
    badges.push(
      `<span class="achievement-badge king-of-girls" title="King of the Girls: All 4 queens ${achievements.kingOfGirls[pi]} time(s)">👸 King of Girls x${achievements.kingOfGirls[pi]}</span>`
    )
  }
  return badges.join('')
}

// Winner Celebration
function showWinnerCelebration() {
  let winnerLabel, winnerScore

  if (mode === 'individual') {
    const maxScore = Math.max(...scores)
    const winnerIndex = scores.indexOf(maxScore)
    winnerLabel = `${playerIcons[winnerIndex]} ${getPlayerLabel(winnerIndex)}`
    winnerScore = maxScore
  } else {
    const team1Score = getTeamScore(0)
    const team2Score = getTeamScore(1)
    if (team1Score > team2Score) {
      winnerLabel = teamNames[0]
      winnerScore = team1Score
    } else {
      winnerLabel = teamNames[1]
      winnerScore = team2Score
    }
  }

  const overlay = document.createElement('div')
  overlay.className = 'celebration-overlay'

  // Create confetti
  let confettiHTML = ''
  for (let i = 0; i < 50; i++) {
    const left = Math.random() * 100
    const delay = Math.random() * 3
    const duration = 2 + Math.random() * 2
    confettiHTML += `<div class="confetti" style="left: ${left}%; animation-delay: ${delay}s; animation-duration: ${duration}s;"></div>`
  }

  overlay.innerHTML = `
    ${confettiHTML}
    <div class="celebration-content">
      <div class="celebration-trophy">🏆</div>
      <div class="celebration-title">🎉 WINNER! 🎉</div>
      <div class="celebration-winner">${winnerLabel}</div>
      <div class="celebration-score">${winnerScore} Points</div>
      <button class="celebration-btn" onclick="closeCelebration()">Continue</button>
    </div>
  `

  document.body.appendChild(overlay)
}

function closeCelebration() {
  const overlay = document.querySelector('.celebration-overlay')
  if (overlay) {
    overlay.style.animation = 'fadeIn 0.3s ease-out reverse'
    setTimeout(() => overlay.remove(), 300)
  }
}

// Initialize
renderSetup()
