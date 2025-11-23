// Game State
let mode = 'individual'
let players = ['لاعب ١', 'لاعب ٢', 'لاعب ٣', 'لاعب ٤']
let teamNames = ['فريق ١', 'فريق ٢']
let scores = [0, 0, 0, 0]
let kingdoms = {}
let history = []
let currentOwner = null
let currentGame = null
const games = ['تركس', 'لطش', 'ديناري', 'بنات', 'ختيار']
let gameInProgress = false // Track if a game form is active
let currentPlayerIndex = 0 // Track which player's turn it is
let kingdomHistory = [] // Track each kingdom's games separately

// Player icons (emojis)
const playerIcons = ['🎮', '🎯', '🎲', '🎪']
// Player images - update these paths to your actual image files
const playerImages = [
  'assets/p1.png',
  'assets/p2.png',
  'assets/p3.png',
  'assets/p4.png',
]

// Helper function to get player icon HTML
function getPlayerIcon(pi, isSmall = false) {
  const className = isSmall ? 'player-icon-small' : 'player-icon'
  return `<div class="${className}" style="background-image: url('${playerImages[pi]}')"></div>`
}

// Helper function to get inline player icon for text
function getPlayerIconInline(pi) {
  return `<img src="${
    playerImages[pi]
  }" class="player-icon-inline" alt="Player ${pi + 1}">`
}

// Achievements tracking
let achievements = {
  kingLover: {}, // Track Khteyar count per player
  toshi: {}, // Track 50-point Trix finishes per player
  kingOfGirls: {}, // Track 4-queen games per player
}

// Team achievements (partnership mode only)
let teamAchievements = {
  queenCollectors: {}, // Track total queens taken by team across games
  kingHunters: {}, // Track K♥ taken by team
  consistentLosers: {}, // Track 50+100 Trix scores by team
}

// Team achievement flags to show popup only once
let teamAchievementShown = {
  queenCollectors: { 0: false, 1: false },
  kingHunters: { 0: false, 1: false },
  consistentLosers: { 0: false, 1: false },
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
        <label>لاعب ${i + 1} ${getPlayerIconInline(i)}</label>
        <input type="text" id="player${i}" placeholder="${p}" onfocus="this.placeholder=''">
      </div>
    `
      )
      .join('')}</div>`
  } else {
    c.innerHTML = `
      <div class="team-input">
        <h4>🔵 فريق ١</h4>
        <div class="player-inputs">
          <div class="player-input">
            <label>لاعب ١ ${getPlayerIconInline(0)}</label>
            <input type="text" id="player0" placeholder="ادخل اسم اللاعب" onfocus="this.placeholder=''">
          </div>
          <div class="player-input">
            <label>لاعب ٢ ${getPlayerIconInline(2)}</label>
            <input type="text" id="player2" placeholder="ادخل اسم اللاعب" onfocus="this.placeholder=''">
          </div>
        </div>
      </div>
      <div class="team-input">
        <h4>🔴 فريق ٢</h4>
        <div class="player-inputs">
          <div class="player-input">
            <label>لاعب ١ ${getPlayerIconInline(1)}</label>
            <input type="text" id="player1" placeholder="ادخل اسم اللاعب" onfocus="this.placeholder=''">
          </div>
          <div class="player-input">
            <label>لاعب ٢ ${getPlayerIconInline(3)}</label>
            <input type="text" id="player3" placeholder="ادخل اسم اللاعب" onfocus="this.placeholder=''">
          </div>
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
    // Keep default team names
    teamNames = ['Team 1', 'Team 2']
    // Read player names
    for (let i = 0; i < 4; i++) {
      const inp = document.getElementById(`player${i}`)
      if (inp) players[i] = inp.value.trim() || `Player ${i + 1}`
    }
  }

  for (let i = 0; i < 4; i++) {
    kingdoms[i] = {
      تركس: false,
      لطش: false,
      ديناري: false,
      بنات: false,
      ختيار: false,
      confirmed: false,
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
  teamAchievements = {
    queenCollectors: { 0: 0, 1: 0 },
    kingHunters: { 0: 0, 1: 0 },
    consistentLosers: { 0: 0, 1: 0 },
  }
  teamAchievementShown = {
    queenCollectors: { 0: false, 1: false },
    kingHunters: { 0: false, 1: false },
    consistentLosers: { 0: false, 1: false },
  }
  for (let i = 0; i < 4; i++) {
    achievements.kingLover[i] = 0
    achievements.toshi[i] = 0
    achievements.kingOfGirls[i] = 0
  } // Start with first player

  document.getElementById('setupPanel').style.display = 'none'
  document.getElementById('modeSelect').style.display = 'none'
  document.getElementById('gameArea').style.display = 'flex'
  document.body.classList.add('no-scroll')

  renderScoreboard()
  renderGameSelector()
}

// Toggle Scoreboard Popup
function toggleScoreboard() {
  const overlay = document.getElementById('scoreboardOverlay')
  const isVisible = overlay.style.display === 'flex'
  overlay.style.display = isVisible ? 'none' : 'flex'
  if (!isVisible) renderScoreboard()
}

// Toggle History Popup
function toggleHistory() {
  const overlay = document.getElementById('historyOverlay')
  const isVisible = overlay.style.display === 'flex'
  overlay.style.display = isVisible ? 'none' : 'flex'
  if (!isVisible) renderHistory()
}

// Helper Functions
function getTeamIndex(pi) {
  // New mapping: 0,2 = Team 1; 1,3 = Team 2
  return pi % 2 === 0 ? 0 : 1
}

function getTeamScore(ti) {
  // Team 0: players 0,2; Team 1: players 1,3
  const ps = ti === 0 ? [0, 2] : [1, 3]
  return scores[ps[0]] + scores[ps[1]]
}

function getOwnerLabel(pi) {
  if (mode === 'individual') return players[pi]
  const ti = getTeamIndex(pi)
  return `${teamNames[ti]} - ${players[pi]}`
}

function getPlayerLabel(pi) {
  if (mode === 'individual') return players[pi]
  return players[pi]
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
        const ps = ti === 0 ? [0, 2] : [1, 3]
        let kingdomHtml = ''
        ps.forEach((pi, idx) => {
          const kd = Object.entries(kingdoms[pi])
            .map(
              ([k, v]) =>
                `<div class="kingdom-item ${v ? 'done' : 'pending'}">${k}</div>`
            )
            .join('')
          kingdomHtml += `<h5>لاعب ${
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
  const allDone = Object.values(kingdoms).every((k) => games.every((g) => k[g]))
  if (allDone) {
    checkGameEnd()
    return
  }

  // Find next player with incomplete kingdom
  let searchCount = 0
  while (searchCount < 4) {
    const avail = Object.entries(kingdoms[currentPlayerIndex])
      .filter(([k, v]) => !v && games.includes(k))
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
    .filter(([k, v]) => !v && games.includes(k))
    .map(([k]) => k)
  const c = document.getElementById('currentKingdom')
  const gameSelector = document.getElementById('gameSelector')

  // Hide game selector, show current kingdom
  gameSelector.style.display = 'none'
  c.style.display = 'block'
  c.innerHTML = `
    <h3>👑 مملكة ${getOwnerLabel(pi)}</h3>
    <div style="text-align:center;margin-bottom:15px;font-size:clamp(14px,4vw,16px);color:#aaa;">
      اختار وحدة من الـ ${avail.length} لعبات المتبقية:
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:15px">
      ${avail
        .map(
          (g) =>
            `<button class="game-btn" onclick="event.preventDefault(); selectGame('${g}')">${g}</button>`
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

  if (g === 'تركس') {
    renderTrixForm(f)
  } else if (g === 'لطش') {
    renderLatoshForm(f)
  } else if (g === 'ديناري') {
    renderDinariForm(f)
  } else if (g === 'بنات') {
    renderGirlsForm(f)
  } else if (g === 'ختيار') {
    renderKhteyarForm(f)
  }
}

// Trix Form with visual positions
function renderTrixForm(f) {
  f.innerHTML = `
    <div class="game-form">
      <div class="instruction-text">اضغط على اللاعبين لترتيب مراكزهم</div>
      <div class="trix-positions">
        <div class="position-slot ${
          trixPositions[0] !== null ? 'filled' : ''
        }" id="pos0">
          <div class="position-label">🥇 الأول</div>
          <div class="position-points">+٢٠٠ نقطة</div>
          ${
            trixPositions[0] !== null
              ? `<div class="position-player">${getPlayerIconInline(
                  trixPositions[0]
                )} ${getPlayerLabel(trixPositions[0])}</div>`
              : '<div class="position-player">اضغط على لاعب</div>'
          }
        </div>
        <div class="position-slot ${
          trixPositions[1] !== null ? 'filled' : ''
        }" id="pos1">
          <div class="position-label">🥈 التاني</div>
          <div class="position-points">+١٥٠ نقطة</div>
          ${
            trixPositions[1] !== null
              ? `<div class="position-player">${getPlayerIconInline(
                  trixPositions[1]
                )} ${getPlayerLabel(trixPositions[1])}</div>`
              : '<div class="position-player">اضغط على لاعب</div>'
          }
        </div>
        <div class="position-slot ${
          trixPositions[2] !== null ? 'filled' : ''
        }" id="pos2">
          <div class="position-label">🥉 التالت</div>
          <div class="position-points">+١٠٠ نقطة</div>
          ${
            trixPositions[2] !== null
              ? `<div class="position-player">${getPlayerIconInline(
                  trixPositions[2]
                )} ${getPlayerLabel(trixPositions[2])}</div>`
              : '<div class="position-player">اضغط على لاعب</div>'
          }
        </div>
        <div class="position-slot ${
          trixPositions[3] !== null ? 'filled' : ''
        }" id="pos3">
          <div class="position-label">الرابع</div>
          <div class="position-points">+٥٠ نقطة</div>
          ${
            trixPositions[3] !== null
              ? `<div class="position-player">${getPlayerIconInline(
                  trixPositions[3]
                )} ${getPlayerLabel(trixPositions[3])}</div>`
              : '<div class="position-player">اضغط على لاعب</div>'
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
            ${getPlayerIcon(pi)}
            <h3>${getPlayerLabel(pi)}</h3>
          </div>
        `
          )
          .join('')}
      </div>
      <div id="trixError" class="validation-error"></div>
      <div class="action-row">
        <button class="action-btn cancel" onclick="resetCurrentGame()">إلغاء</button>
        <button class="submit-game" onclick="submitTrix()" ${
          trixPositions.includes(null) ? 'disabled' : ''
        } style="margin:0;max-width:none;">تسجيل تركس</button>
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
    renderGameForm('تركس')
  }
}

// Latosh Form with counters
function renderLatoshForm(f) {
  const remaining = 13 - cardCounts.reduce((a, b) => a + b, 0)

  f.innerHTML = `
    <div class="game-form">
      <div class="instruction-text">وزِّع ١٣ ورقة لطش (-١٥ نقطة لكل ورقة)</div>
      <div class="remaining-cards">متبقي: ${remaining} ورقة</div>
      <div class="player-table">
        ${[0, 1, 2, 3]
          .map(
            (pi) => `
          <div class="player-seat">
            ${getPlayerIcon(pi)}
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
            } نقطة</div>
          </div>
        `
          )
          .join('')}
      </div>
      <div id="latoshError" class="validation-error"></div>
      <div class="action-row">
        <button class="action-btn cancel" onclick="resetCurrentGame()">إلغاء</button>
        <button class="submit-game" onclick="submitLatosh()" ${
          remaining !== 0 ? 'disabled' : ''
        } style="margin:0;max-width:none;">تسجيل لطش</button>
      </div>
    </div>
  `
}

// Dinari Form with counters
function renderDinariForm(f) {
  const remaining = 13 - cardCounts.reduce((a, b) => a + b, 0)

  f.innerHTML = `
    <div class="game-form">
      <div class="instruction-text">وزِّع ١٣ ورقة ديناري (-١٠ نقاط لكل ورقة)</div>
      <div class="remaining-cards">متبقي: ${remaining} ♦ ورقة</div>
      <div class="player-table">
        ${[0, 1, 2, 3]
          .map(
            (pi) => `
          <div class="player-seat">
            ${getPlayerIcon(pi)}
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
            } نقطة</div>
          </div>
        `
          )
          .join('')}
      </div>
      <div id="dinariError" class="validation-error"></div>
      <div class="action-row">
        <button class="action-btn cancel" onclick="resetCurrentGame()">إلغاء</button>
        <button class="submit-game" onclick="submitDinari()" ${
          remaining !== 0 ? 'disabled' : ''
        } style="margin:0;max-width:none;">تسجيل ديناري</button>
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
        <div class="instruction-text">اضغط على بنت وبعدين اختار مين أخدا</div>
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
                    <div style="font-size:40px;">${getPlayerIcon(
                      queensState[qi].taker
                    )}</div>
                    <div style="font-weight:600;margin-top:10px;">${getPlayerLabel(
                      queensState[qi].taker
                    )}</div>
                    <div style="color:#e74c3c;font-weight:bold;margin-top:5px;">${
                      queensState[qi].doubled ? '-٥٠' : '-٢٥'
                    } نقطة</div>
                    ${
                      queensState[qi].doubled &&
                      queensState[qi].doubler !== null
                        ? `
                      <div style="font-size:12px;margin-top:5px;color:#666;">دبلها ${getPlayerIconInline(
                        queensState[qi].doubler
                      )} ${getPlayerLabel(queensState[qi].doubler)}</div>
                    `
                        : ''
                    }
                  </div>
                `
                    : '<div class="queen-status">ما انأخدت</div>'
                }
              </div>
            </div>
          `
            )
            .join('')}
        </div>
        <div id="girlsError" class="validation-error"></div>
        <div class="action-row">
          <button class="action-btn cancel" onclick="resetCurrentGame()">إلغاء</button>
          <button class="submit-game" onclick="submitGirls()" ${
            Object.values(queensState).some((q) => q.taker === null)
              ? 'disabled'
              : ''
          } style="margin:0;max-width:none;">تسجيل بنات</button>
        </div>
      </div>
    `
  } else if (gameStep === 'assignTaker') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">مين أخد Q${
          suits[currentQueenIndex]
        }؟ اضغط على لاعب</div>
        <div class="player-table">
          ${[0, 1, 2, 3]
            .map(
              (pi) => `
            <div class="player-seat" onclick="assignQueenTaker(${pi})">
              ${getPlayerIcon(pi)}
              <h3>${getPlayerLabel(pi)}</h3>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="action-row">
          <button class="action-btn cancel" onclick="cancelQueenSelection()">إلغاء</button>
        </div>
      </div>
    `
  } else if (gameStep === 'askDouble') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">هل Q${suits[currentQueenIndex]} مدبلة؟</div>
        <div class="action-row">
          <button class="action-btn double" onclick="setQueenDoubled(true)">أي، مدبلة</button>
          <button class="action-btn cancel" onclick="setQueenDoubled(false)">لأ</button>
        </div>
      </div>
    `
  } else if (gameStep === 'assignDoubler') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">مين ضعّف Q${
          suits[currentQueenIndex]
        }؟ اضغط على لاعب</div>
        <div class="player-table">
          ${[0, 1, 2, 3]
            .map(
              (pi) => `
            <div class="player-seat" onclick="assignQueenDoubler(${pi})">
              ${getPlayerIcon(pi)}
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
        <div class="instruction-text">هل ${getPlayerLabel(
          queensState[currentQueenIndex].taker
        )} انجبر ياخد هالبنت؟</div>
        <div class="action-row">
          <button class="action-btn double" onclick="setQueenForced(true)">أي، مجبور</button>
          <button class="action-btn cancel" onclick="setQueenForced(false)">لأ</button>
        </div>
      </div>
    `
  } else if (gameStep === 'assignForcer') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">مين جبر ${getPlayerLabel(
          queensState[currentQueenIndex].taker
        )} ياخد Q${suits[currentQueenIndex]}؟</div>
        <div class="player-table">
          ${[0, 1, 2, 3]
            .filter((pi) => pi !== queensState[currentQueenIndex].taker)
            .map(
              (pi) => `
            <div class="player-seat" onclick="assignQueenForcer(${pi})">
              ${getPlayerIcon(pi)}
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
        <div class="instruction-text">مين أخد K♥؟ اضغط على لاعب</div>
        <div class="player-table">
          ${[0, 1, 2, 3]
            .map(
              (pi) => `
            <div class="player-seat ${
              khteyarState.taker === pi ? 'selected' : ''
            }" onclick="selectKhteyarTaker(${pi})">
              ${getPlayerIcon(pi)}
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
            <button class="action-btn double" onclick="askKhteyarDouble()">التالي</button>
          </div>
        `
            : ''
        }
      </div>
    `
  } else if (gameStep === 'askDouble') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">الختيار مدبل؟</div>
        <div class="action-row">
          <button class="action-btn double" onclick="setKhteyarDoubled(true)">أي، مدبل</button>
          <button class="action-btn cancel" onclick="setKhteyarDoubled(false)">لأ</button>
        </div>
      </div>
    `
  } else if (gameStep === 'assignDoubler') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">مين دبل الختيار</div>
        <div class="player-table">
          ${[0, 1, 2, 3]
            .map(
              (pi) => `
            <div class="player-seat" onclick="assignKhteyarDoubler(${pi})">
              ${getPlayerIcon(pi)}
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
        <div class="instruction-text">هل ${getPlayerLabel(
          khteyarState.taker
        )} انجبر ياخد الختيار؟</div>
        <div class="action-row">
          <button class="action-btn double" onclick="setKhteyarForced(true)">أي، مجبور</button>
          <button class="action-btn cancel" onclick="setKhteyarForced(false)">لأ</button>
        </div>
      </div>
    `
  } else if (gameStep === 'assignForcer') {
    f.innerHTML = `
      <div class="game-form">
        <div class="instruction-text">مين جبر ${getPlayerLabel(
          khteyarState.taker
        )} ياخد الختيار؟</div>
        <div class="player-table">
          ${[0, 1, 2, 3]
            .filter((pi) => pi !== khteyarState.taker)
            .map(
              (pi) => `
            <div class="player-seat" onclick="assignKhteyarForcer(${pi})">
              ${getPlayerIcon(pi)}
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
    document.getElementById('trixError').textContent = 'لازم تحدد كل المراكز!'
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
  finishGame('تركس', changes.join(', '), scoreChanges)
}

function submitLatosh() {
  const total = cardCounts.reduce((a, b) => a + b, 0)
  if (total !== 13) {
    document.getElementById(
      'latoshError'
    ).textContent = `لازم يكون المجموع ١٣ لطش! هلق عندك: ${total}`
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
  finishGame('لطش', changes.join(', '), scoreChanges)
}

function submitDinari() {
  const total = cardCounts.reduce((a, b) => a + b, 0)
  if (total !== 13) {
    document.getElementById(
      'dinariError'
    ).textContent = `لازم يكون المجموع ١٣ ديناري! هلق عندك: ${total}`
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
  finishGame('ديناري', changes.join(', '), scoreChanges)
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
    ).textContent = `لازم تحدد كل البنات! ناقص: ${unassignedQueens.join(', ')}`
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
              )}: +25 (Q${suits[qi]} ضعّف حالو بس انجبر)`
            )
          } else {
            // Voluntary self-double - no bonus
            changes.push(
              `${getPlayerLabel(queen.taker)}: -50 (ضعّف Q${suits[qi]} حالو)`
            )
          }
        } else {
          // Different players - normal bonus
          scores[queen.doubler] += 25
          scoreChanges.push({ player: queen.doubler, points: 25 })
          changes.push(
            `${getPlayerLabel(queen.taker)}: -50, ${getPlayerLabel(
              queen.doubler
            )}: +25 (Q${suits[qi]} مدبلة)`
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
            // Self-doubled and forced - check if forcer is opponent
            const forcerTeam = getTeamIndex(queen.forcer)
            if (forcerTeam !== takerTeam) {
              // Forced by opponent - opponent gets bonus
              scores[queen.forcer] += 25
              scoreChanges.push({ player: queen.forcer, points: 25 })
              changes.push(
                `${getPlayerLabel(queen.taker)}: -50, ${getPlayerLabel(
                  queen.forcer
                )}: +25 (Q${suits[qi]} ضعّف حالو بس انجبر)`
              )
            } else {
              // Forced by teammate - no bonus
              changes.push(
                `${getPlayerLabel(queen.taker)}: -50 (Q${
                  suits[qi]
                } ضعّف حالو، جبرو شريكو)`
              )
            }
          } else {
            // Partner doubled or voluntary self-double
            changes.push(
              `${getPlayerLabel(queen.taker)}: -50 (شريكو ضعّف Q${suits[qi]})`
            )
          }
        } else {
          // Different teams - opponent doubled
          scores[queen.doubler] += 25
          scoreChanges.push({ player: queen.doubler, points: 25 })
          changes.push(
            `${getPlayerLabel(queen.taker)}: -50, ${getPlayerLabel(
              queen.doubler
            )}: +25 (Q${suits[qi]} ضعّفو الخصم)`
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
    'بنات',
    changes.length ? changes.join(', ') : 'ما في بنات انأخدو',
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
            )}: +75 (دبل الختيار وبلعو)`
          )
          showThunderEffect('self')
        } else {
          // Voluntary self-double - no bonus
          changes.push(`${getPlayerLabel(taker)}: -150 (دبل الختيار وبلعو)`)
          showThunderEffect('self')
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
          )}: +75 (طعما الختيار مدبل)`
        )
        showThunderEffect('opponent')
      }
    } else {
      const takerTeam = getTeamIndex(taker)
      const doublerTeam = getTeamIndex(doubler)
      if (takerTeam === doublerTeam) {
        // Same team (partner doubled or self-doubled)
        scores[taker] += -150
        scoreChanges.push({ player: taker, points: -150 })

        if (doubler === taker && forcer !== null) {
          // Self-doubled and forced - check if forcer is opponent
          const forcerTeam = getTeamIndex(forcer)
          if (forcerTeam !== takerTeam) {
            // Forced by opponent - opponent gets bonus
            scores[forcer] += 75
            scoreChanges.push({ player: forcer, points: 75 })
            changes.push(
              `${getPlayerLabel(taker)}: -150, ${getPlayerLabel(
                forcer
              )}: +75 ( دبل الختيار وبلعو)`
            )
            showThunderEffect('self')
          } else {
            // Forced by teammate - no bonus
            changes.push(
              `${getPlayerLabel(taker)}: -150 (دبل الختيار وبلعو، جبرو شريكو)`
            )
            showThunderEffect('self')
          }
        } else {
          // Partner doubled or voluntary self-double
          changes.push(`${getPlayerLabel(taker)}: -150 (شريكو دبل الختيار)`)
          showThunderEffect('teammate')
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
          )}: +75 (ختيار مدبل)`
        )
        showThunderEffect('opponent')
      }
    }
  } else {
    scores[taker] += -75
    scoreChanges.push({ player: taker, points: -75 })
    changes.push(`${getPlayerLabel(taker)}: -75 (ختيار)`)
  }
  finishGame('ختيار', changes.join(', '), scoreChanges)
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
    scoreChangesIndexed[change.player] += change.points
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
  if (game === 'تركس') {
    record.positions = [...trixPositions]
  } else if (game === 'لطش' || game === 'ديناري') {
    record.cardCounts = [...cardCounts]
  } else if (game === 'بنات') {
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
  } else if (game === 'ختيار') {
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
  const allGamesComplete = games.every((g) => kingdoms[currentOwner][g])

  if (allGamesComplete) {
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

  // Get players with kingdoms in descending order (most recent activity first)
  const playersWithKingdoms = []
  for (let i = 0; i < 4; i++) {
    if (kingdomGroups[i].length > 0) {
      playersWithKingdoms.push(i)
    }
  }
  // Reverse to show most recently active kingdoms first
  playersWithKingdoms.reverse()

  // Render each player's kingdom
  let html = ''
  for (const i of playersWithKingdoms) {
    const games = kingdomGroups[i]

    // Check if this kingdom is complete (all 5 games done)
    const isKingdomComplete =
      games.length === 5 && Object.values(kingdoms[i]).every((v) => v)

    html += `
      <div class="kingdom-history-section">
        <div class="kingdom-history-header">
          ${getPlayerIcon(i, true)}
          <span class="kingdom-owner-name">${getOwnerLabel(i)}'s Kingdom</span>
        </div>
        <div class="kingdom-games-table">
    `

    // Reverse games array to show newest first
    games
      .slice()
      .reverse()
      .forEach((h, idx) => {
        const realIdx = history.indexOf(h)
        html += renderGameTable(h, realIdx, isKingdomComplete)
      })

    html += `
        </div>
      </div>
    `
  }

  c.innerHTML = html
}

// Render individual game table
function renderGameTable(h, realIdx, isKingdomComplete = false) {
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
            ${h.game === 'بنات' ? '<th>Details</th>' : ''}
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
    if (h.game === 'تركس') {
      const position = h.positions?.indexOf(pi)
      if (position === 0) details = '🥇 1st'
      else if (position === 1) details = '🥈 2nd'
      else if (position === 2) details = '🥉 3rd'
      else if (position === 3) details = '4th'
    } else if (h.game === 'لطش' || h.game === 'ديناري') {
      const count = h.cardCounts?.[pi] || 0
      if (count > 0) details = `${count} cards`
    } else if (h.game === 'بنات') {
      details = h.queensDetails?.[pi] || '-'
    } else if (h.game === 'ختيار') {
      if (h.khteyarTaker === pi) {
        details = h.khteyarDoubled ? '👑 (Doubled)' : '👑'
      }
    }

    tableHtml += `
      <tr>
        <td class="player-cell">
          ${getPlayerIcon(pi, true)}
          ${getPlayerLabel(pi)}
        </td>
        <td class="score-cell ${scoreClass}">${scoreDisplay}</td>
        ${h.game === 'بنات' ? `<td class="details-cell">${details}</td>` : ''}
      </tr>
    `
  }

  tableHtml += `
        </tbody>
      </table>
      ${
        !isKingdomComplete
          ? `
      <div class="game-table-actions">
        <button class="delete-game-btn" onclick="deleteGame(${realIdx})">
          🗑️ Delete
        </button>
      </div>
      `
          : ''
      }
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
  if (!confirm('بدّك تعيد اللعبة؟')) return

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

  // Rebuild kingdom history from current history array in case games were deleted
  kingdomHistory = history.filter(
    (record) => record.ownerIndex === currentOwner
  )

  // Calculate kingdom score changes (just from this kingdom)
  let kingdomScoreChanges = [0, 0, 0, 0]
  kingdomHistory.forEach((record) => {
    record.scoreChanges.forEach((points, pi) => {
      kingdomScoreChanges[pi] += points
    })
  })

  // Also keep track of current total scores for display
  let currentTotalScores = [...scores]

  // Create overview display
  let overviewHtml = `
    <div style="background:rgba(76,205,196,0.1);border:2px solid #4ecdc4;border-radius:15px;padding:20px;margin-bottom:20px;">
      <h3 style="text-align:center;color:#4ecdc4;font-size:clamp(20px,5vw,24px);margin-bottom:15px;">✅ المملكة خلصت!</h3>
      <h4 style="text-align:center;color:#ffd700;font-size:clamp(16px,4.5vw,20px);margin-bottom:20px;">ملخص مملكة ${getOwnerLabel(
        currentOwner
      )}</h4>

      <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:15px;margin-bottom:15px;">
        <h5 style="color:#aaa;font-size:clamp(14px,4vw,16px);margin-bottom:10px;text-align:center;">اللعبات اللي خلصت:</h5>
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
              <button onclick="deleteGame(${historyIdx})" style="margin-top:8px;padding:6px 12px;background:#ff6b6b;color:white;border:none;border-radius:6px;cursor:pointer;font-size:clamp(11px,3vw,13px);width:100%;">🗑️ احذف</button>
            </div>
          `
            })
            .join('')}
        </div>
      </div>

      <div style="background:rgba(255,255,255,0.05);border-radius:10px;padding:15px;margin-bottom:20px;">
        <h5 style="color:#aaa;font-size:clamp(14px,4vw,16px);margin-bottom:10px;text-align:center;">تغيرات نقاط المملكة:</h5>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">
          ${
            mode === 'individual'
              ? [0, 1, 2, 3]
                  .map((pi) => {
                    const change = kingdomScoreChanges[pi]
                    const total = currentTotalScores[pi]
                    const changeColor =
                      change > 0 ? '#4ecdc4' : change < 0 ? '#ff6b6b' : '#aaa'
                    const totalColor =
                      total > 0 ? '#4ecdc4' : total < 0 ? '#ff6b6b' : '#ffd700'
                    return `
                  <div style="text-align:center;background:#2d3a4f;padding:12px;border-radius:8px;">
                    <div style="width:clamp(50px,12vw,60px);height:clamp(50px,12vw,60px);background-image:url('${
                      playerImages[pi]
                    }');background-size:cover;background-position:center;border-radius:50%;border:3px solid rgba(255,215,0,0.5);margin:0 auto 8px;"></div>
                    <div style="font-size:clamp(12px,3.5vw,14px);color:#aaa;margin-bottom:5px;">${getPlayerLabel(
                      pi
                    )}</div>
                    <div style="font-size:clamp(16px,4.5vw,20px);font-weight:bold;color:${changeColor};">${
                      change > 0 ? '+' : ''
                    }${change}</div>
                    <div style="font-size:clamp(11px,3vw,13px);color:#666;margin-top:4px;">مجموع: <span style="color:${totalColor};font-weight:bold;">${total}</span></div>
                  </div>
                `
                  })
                  .join('')
              : [0, 1]
                  .map((ti) => {
                    const ps = ti === 0 ? [0, 2] : [1, 3]
                    const change =
                      kingdomScoreChanges[ps[0]] + kingdomScoreChanges[ps[1]]
                    const total =
                      currentTotalScores[ps[0]] + currentTotalScores[ps[1]]
                    const changeColor =
                      change > 0 ? '#4ecdc4' : change < 0 ? '#ff6b6b' : '#aaa'
                    const totalColor =
                      total > 0 ? '#4ecdc4' : total < 0 ? '#ff6b6b' : '#ffd700'
                    return `
                  <div style="text-align:center;background:#2d3a4f;padding:12px;border-radius:8px;">
                    <div style="font-size:clamp(16px,4.5vw,20px);color:#ffd700;margin-bottom:8px;font-weight:bold;">${
                      teamNames[ti]
                    }</div>
                    <div style="font-size:clamp(11px,3vw,13px);color:#aaa;margin-bottom:8px;">${getPlayerLabel(
                      ps[0]
                    )} & ${getPlayerLabel(ps[1])}</div>
                    <div style="font-size:clamp(16px,4.5vw,20px);font-weight:bold;color:${changeColor};">${
                      change > 0 ? '+' : ''
                    }${change}</div>
                    <div style="font-size:clamp(11px,3vw,13px);color:#666;margin-top:4px;">مجموع: <span style="color:${totalColor};font-weight:bold;">${total}</span></div>
                  </div>
                `
                  })
                  .join('')
          }
        </div>
      </div>

      <div class="action-row" style="margin-top:20px;">'


        <button class="action-btn double" onclick="confirmKingdom()" style="background:#4ecdc4;color:#1a1a2e;">✅ أكِّد و كمِّل</button>
      </div>
    </div>
  `

  c.innerHTML = overviewHtml
}

// Confirm Kingdom and move to next player
function confirmKingdom() {
  // Mark this kingdom as confirmed
  kingdoms[currentOwner].confirmed = true

  // Move to next player
  currentPlayerIndex = (currentPlayerIndex + 1) % 4

  // Clear kingdom history
  kingdomHistory = []

  // Show next player's kingdom or end game
  renderGameSelector()
}

// Delete a completed game (reverse scores and mark kingdom incomplete)
function deleteGame(idx) {
  const record = history[idx]
  const ownerIndex = record.ownerIndex

  // Check if kingdom is confirmed
  if (kingdoms[ownerIndex].confirmed) {
    alert('ما فيك تحذف لعبات من مملكة مؤكدة!')
    return
  }

  if (!confirm('بدّك تحذف هاللعبة؟ رح تترجع النقاط وبتقدر تلعبا من جديد.'))
    return
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

  // Recalculate all achievements from scratch based on remaining history
  achievements = {
    kingLover: {},
    toshi: {},
    kingOfGirls: {},
  }
  for (let i = 0; i < 4; i++) {
    achievements.kingLover[i] = 0
    achievements.toshi[i] = 0
    achievements.kingOfGirls[i] = 0
  }

  // Rebuild achievements from remaining history
  history.forEach((h) => {
    // King Lover: Count Khteyar games
    if (h.game === 'ختيار' && h.khteyarTaker !== undefined) {
      achievements.kingLover[h.khteyarTaker]++
    }

    // Toshi: Count 50-point Trix finishes (4th place)
    if (h.game === 'تركس' && h.positions) {
      const fourthPlacePlayer = h.positions[3]
      if (fourthPlacePlayer !== undefined) {
        achievements.toshi[fourthPlacePlayer]++
      }
    }

    // King of the Girls: Count 4-queen games
    if (h.game === 'بنات' && h.queensDetails) {
      const queensPerPlayer = [0, 0, 0, 0]
      // Parse queensDetails to count queens per player
      h.queensDetails.forEach((details, pi) => {
        if (details && details !== '-') {
          // Count queen symbols (♠, ♥, ♦, ♣) in the details string
          const queenCount = (details.match(/[♠♥♦♣]/g) || []).length
          queensPerPlayer[pi] = queenCount
        }
      })
      queensPerPlayer.forEach((count, pi) => {
        if (count === 4) {
          achievements.kingOfGirls[pi]++
        }
      })
    }
  })

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
  if (!confirm('بدّك تعيد ضبط اللعبة كلّا؟')) return

  mode = 'individual'
  players = ['لاعب ١', 'لاعب ٢', 'لاعب ٣', 'لاعب ٤']
  teamNames = ['فريق ١', 'فريق ٢']
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
  document.getElementById('scoreboardOverlay').style.display = 'none'
  document.getElementById('historyOverlay').style.display = 'none'
  document.body.classList.remove('no-scroll')

  renderSetup()
}

// Thunder Effect Animation Functions
function showThunderEffect(scenario) {
  const overlay = document.createElement('div')
  overlay.className = 'thunder-overlay'

  const content = document.createElement('div')
  content.className = 'thunder-content'

  if (scenario === 'opponent') {
    // Epic thunder storm for taking doubled king from opponent
    content.innerHTML = `
      <div class="thunder-icon">⚡👑⚡</div>
      <div class="thunder-title">فنان!</div>
      <div class="thunder-message">بلع ختيار الخصم مدبل!</div>
    `
    overlay.classList.add('thunder-epic')

    // Create multiple lightning bolts
    for (let i = 0; i < 8; i++) {
      const lightning = document.createElement('div')
      lightning.className = 'lightning-bolt'
      lightning.style.left = Math.random() * 100 + '%'
      lightning.style.animationDelay = Math.random() * 2 + 's'
      overlay.appendChild(lightning)
    }
  } else if (scenario === 'teammate') {
    // Friendly fire thunder
    content.innerHTML = `
      <div class="thunder-icon funny-shake">🤦⚡</div>
      <div class="thunder-title funny-bounce" style="color: #ff69b4;">يا عيب!</div>
      <div class="thunder-message">ضرب شريكو! شريكك دبل وبلعك!</div>
    `
    overlay.classList.add('thunder-funny')

    // Lighter lightning bolts
    for (let i = 0; i < 4; i++) {
      const lightning = document.createElement('div')
      lightning.className = 'lightning-bolt pink-lightning'
      lightning.style.left = Math.random() * 100 + '%'
      lightning.style.animationDelay = Math.random() * 1.5 + 's'
      overlay.appendChild(lightning)
    }
  } else if (scenario === 'self') {
    // Self-damage red thunder
    content.innerHTML = `
      <div class="thunder-icon self-shake">🤯⚡</div>
      <div class="thunder-title self-pulse" style="color: #ff4500;">ضرر ذاتي!</div>
      <div class="thunder-message">دبلت واكلتو يا فهيم؟</div>
    `
    overlay.classList.add('thunder-self')

    // Red lightning bolts converging to center
    for (let i = 0; i < 6; i++) {
      const lightning = document.createElement('div')
      lightning.className = 'lightning-bolt red-lightning'
      lightning.style.left = Math.random() * 100 + '%'
      lightning.style.animationDelay = Math.random() * 1 + 's'
      overlay.appendChild(lightning)
    }
  }

  overlay.appendChild(content)
  document.body.appendChild(overlay)

  // Remove after animation
  setTimeout(() => {
    overlay.style.opacity = '0'
    setTimeout(() => overlay.remove(), 500)
  }, 3000)
}

// Achievement Functions
function showTeamAchievementPopup(type, teamIndex) {
  const teamName = teamNames[teamIndex]
  const teamPlayers =
    teamIndex === 0
      ? `${players[0]} & ${players[2]}`
      : `${players[1]} & ${players[3]}`

  const achievements = {
    queenCollectors: {
      icon: '👸👸👸👸',
      title: 'فتحو كازينو!',
      desc: `${teamName} جمعو ٤ بنات !`,
    },
    kingHunters: {
      icon: '👑💔💔💔',
      title: '!عاشقين الختيار!',
      desc: `${teamName} أخدو ٤ ختايرة ! بيعشقو الختايرة! `,
    },
    consistentLosers: {
      icon: '🎯🤦',
      title: 'دايماً... طشي!',
      desc: `${teamName} جابو تالت ورابع بتركس مرتين! علالأقل ثابتين!`,
    },
  }

  const achievement = achievements[type]
  const popup = document.createElement('div')
  popup.className = `achievement-popup team-achievement ${type}`
  popup.innerHTML = `
    <div class="achievement-popup-icon">${achievement.icon}</div>
    <div class="achievement-popup-title">${achievement.title}</div>
    <div class="achievement-popup-desc">${achievement.desc}</div>
    <div class="achievement-popup-player" style="font-size:14px;margin-top:5px;">${teamPlayers}</div>
  `
  document.body.appendChild(popup)

  setTimeout(() => {
    popup.style.animation = 'achievementPop 0.5s ease-out reverse'
    setTimeout(() => popup.remove(), 500)
  }, 4000)
}

function showAchievementPopup(type, playerIndex) {
  const titles = {
    kingLover: '👑💔 King lover!',
    toshi: '🎯 طشي!',
    kingOfGirls: '👸 ملك البنات!',
  }

  const descriptions = {
    kingLover: 'أخد ختيار مرتين أو أكتر! واحد بيحب الختيار! 😂',
    toshi: 'خلّص رابع (٥٠ نقطة) بتركس مرتين أو أكتر!',
    kingOfGirls: 'أخد الـ٤ بنات بلعبة بنات وحدة! 👑',
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
    <div class="achievement-popup-player">${getPlayerIconInline(
      playerIndex
    )} ${getPlayerLabel(playerIndex)}</div>
  `

  document.body.appendChild(popup)

  setTimeout(() => {
    popup.style.animation = 'achievementPop 0.4s ease-out reverse'
    setTimeout(() => popup.remove(), 400)
  }, 3000)
}

function checkAchievements(game, scoreChanges) {
  // Queue for achievements to show with staggered delays
  const achievementQueue = []

  // King Lover: Took K♥ 2+ times
  if (game === 'ختيار') {
    const taker = khteyarState.taker
    achievements.kingLover[taker]++
    if (achievements.kingLover[taker] === 2) {
      achievementQueue.push({ type: 'player', id: 'kingLover', data: taker })
    }

    // Partnership: King Hunters (team took 4 K♥)
    if (mode === 'partnership') {
      const team = getTeamIndex(taker)
      teamAchievements.kingHunters[team]++
      if (
        teamAchievements.kingHunters[team] === 4 &&
        !teamAchievementShown.kingHunters[team]
      ) {
        teamAchievementShown.kingHunters[team] = true
        achievementQueue.push({ type: 'team', id: 'kingHunters', data: team })
      }
    }
  }

  // Toshi: Got 50 points in Trix (4th place) 2+ times
  if (game === 'تركس') {
    scoreChanges.forEach((change) => {
      if (change.points === 50) {
        achievements.toshi[change.player]++
        if (achievements.toshi[change.player] === 2) {
          achievementQueue.push({
            type: 'player',
            id: 'toshi',
            data: change.player,
          })
        }
      }
    })

    // Partnership: Consistent Losers (team got 50+100 points 2 times)
    if (mode === 'partnership') {
      const teamScores = { 0: 0, 1: 0 }
      scoreChanges.forEach((change) => {
        const team = getTeamIndex(change.player)
        teamScores[team] += change.points
      })
      // Check if team got exactly 150 points (50+100 or 100+50)
      Object.keys(teamScores).forEach((team) => {
        if (teamScores[team] === 150) {
          teamAchievements.consistentLosers[team]++
          if (
            teamAchievements.consistentLosers[team] === 2 &&
            !teamAchievementShown.consistentLosers[team]
          ) {
            teamAchievementShown.consistentLosers[team] = true
            achievementQueue.push({
              type: 'team',
              id: 'consistentLosers',
              data: parseInt(team),
            })
          }
        }
      })
    }
  }

  // King of the Girls: Took all 4 queens in one game (individual mode only)
  if (game === 'بنات' && mode === 'individual') {
    const queensPerPlayer = [0, 0, 0, 0]
    for (let qi = 0; qi < 4; qi++) {
      if (queensState[qi].taker !== null) {
        queensPerPlayer[queensState[qi].taker]++
      }
    }
    queensPerPlayer.forEach((count, pi) => {
      if (count === 4) {
        achievements.kingOfGirls[pi]++
        achievementQueue.push({ type: 'player', id: 'kingOfGirls', data: pi })
      }
    })
  }

  // Partnership: Queen Collectors (team took 4 queens across 2 games)
  if (game === 'بنات' && mode === 'partnership') {
    const queensPerPlayer = [0, 0, 0, 0]
    for (let qi = 0; qi < 4; qi++) {
      if (queensState[qi].taker !== null) {
        queensPerPlayer[queensState[qi].taker]++
      }
    }

    const teamQueens = { 0: 0, 1: 0 }
    queensPerPlayer.forEach((count, pi) => {
      const team = getTeamIndex(pi)
      teamQueens[team] += count
    })
    // Add to running total
    Object.keys(teamQueens).forEach((team) => {
      teamAchievements.queenCollectors[team] += teamQueens[team]
      // Check if team has collected 4 queens total (could be across games)
      if (
        teamAchievements.queenCollectors[team] >= 4 &&
        teamAchievements.queenCollectors[team] < 8 &&
        !teamAchievementShown.queenCollectors[team]
      ) {
        // Only show once when hitting 4
        if (teamQueens[team] > 0) {
          // Just completed a game
          const exactlyFour = teamAchievements.queenCollectors[team] === 4
          const wasThree =
            teamAchievements.queenCollectors[team] - teamQueens[team] <= 3
          if (exactlyFour || (wasThree && teamQueens[team] >= 1)) {
            teamAchievementShown.queenCollectors[team] = true
            achievementQueue.push({
              type: 'team',
              id: 'queenCollectors',
              data: parseInt(team),
            })
          }
        }
      }
    })
  }

  // Show all queued achievements with staggered delays
  achievementQueue.forEach((achievement, index) => {
    const delay = 500 + index * 4500 // 4.5s between each (4s display + 0.5s gap)
    setTimeout(() => {
      if (achievement.type === 'player') {
        showAchievementPopup(achievement.id, achievement.data)
      } else {
        showTeamAchievementPopup(achievement.id, achievement.data)
      }
    }, delay)
  })
}

function getPlayerAchievements(pi) {
  const badges = []
  if (achievements.kingLover[pi] >= 2) {
    badges.push(
      `<span class="achievement-badge king-lover" title="King Lover: Took K♥ ${achievements.kingLover[pi]} times">👑💔 King Lover x${achievements.kingLover[pi]}</span>`
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
    winnerLabel = `${getPlayerIconInline(winnerIndex)} ${getPlayerLabel(
      winnerIndex
    )}`
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
      <div class="celebration-title">🎉 الفايز! 🎉</div>
      <div class="celebration-winner">${winnerLabel}</div>
      <div class="celebration-score">${winnerScore} نقطة</div>
      <button class="celebration-btn" onclick="closeCelebration()">كمِّل</button>
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
