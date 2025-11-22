// Game State
let mode = 'individual'
let players = ['Player 1', 'Player 2', 'Player 3', 'Player 4']
let teamNames = ['Team 1', 'Team 2']
let scores = [0, 0, 0, 0]
let kingdoms = {}
let history = []
let currentOwner = null
let currentGame = null
const games = ['Trix', 'Latosh', 'Dinari', 'Girls', 'Khteyar']

// Player icons (emojis)
const playerIcons = ['👤', '👥', '👨', '👩']

// Game-specific state
let cardCounts = [0, 0, 0, 0] // For Latosh/Dinari
let queensState = {
  0: { taker: null, doubled: false, doubler: null },
  1: { taker: null, doubled: false, doubler: null },
  2: { taker: null, doubled: false, doubler: null },
  3: { taker: null, doubled: false, doubler: null }
}
let khteyarState = { taker: null, doubled: false, doubler: null }
let trixPositions = [null, null, null, null] // positions 0-3 for 1st-4th place
let gameStep = 'select' // 'select', 'double', 'assign'

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
        <label>Player ${i + 1}</label>
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
      Girls: false,
      Khteyar: false,
    }
  }
  scores = [0, 0, 0, 0]
  history = []

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
        return `<div class="score-card">
        <h3>${p}</h3>
        <div class="score ${cls}">${s}</div>
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

// Render Game Selector
function renderGameSelector() {
  const c = document.getElementById('gameSelector')
  let html =
    '<div style="width:100%;text-align:center;margin-bottom:10px"><strong>Select Kingdom Owner:</strong></div>'

  if (mode === 'individual') {
    players.forEach((p, i) => {
      const avail = Object.entries(kingdoms[i])
        .filter(([k, v]) => !v)
        .map(([k]) => k)
      if (avail.length > 0) {
        html += `<button class="game-btn" onclick="selectOwner(${i})">${p} (${avail.length} left)</button>`
      }
    })
  } else {
    ;[0, 1].forEach((ti) => {
      const ps = ti === 0 ? [0, 1] : [2, 3]
      ps.forEach((pi, idx) => {
        const avail = Object.entries(kingdoms[pi])
          .filter(([k, v]) => !v)
          .map(([k]) => k)
        if (avail.length > 0) {
          html += `<button class="game-btn" onclick="selectOwner(${pi})">${
            teamNames[ti]
          } - P${idx + 1} (${avail.length} left)</button>`
        }
      })
    })
  }

  c.innerHTML = html
  document.getElementById('currentKingdom').style.display = 'none'
}

// Select Kingdom Owner
function selectOwner(pi) {
  currentOwner = pi
  const avail = Object.entries(kingdoms[pi])
    .filter(([k, v]) => !v)
    .map(([k]) => k)
  const c = document.getElementById('currentKingdom')
  c.style.display = 'block'
  c.innerHTML = `
    <h3>👑 ${getOwnerLabel(pi)}'s Kingdom</h3>
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
  document.querySelectorAll('.current-kingdom .game-btn').forEach((b) => {
    b.classList.toggle('active', b.textContent === g)
  })
  renderGameForm(g)
}

// Toggle Functions
function toggleDoubler(qi) {
  const chk = document.getElementById(`queenDouble${qi}`)
  document.getElementById(`queenDoubler${qi}`).style.display = chk.checked
    ? 'block'
    : 'none'
}

function toggleKhteyarDoubler() {
  const chk = document.getElementById('khteyarDouble')
  document.getElementById('khteyarDoublerGroup').style.display = chk.checked
    ? 'block'
    : 'none'
}

// Render Game Form
function renderGameForm(g) {
  const f = document.getElementById('gameForm')
  const pOpts = [0, 1, 2, 3]
    .map((i) => `<option value="${i}">${getPlayerLabel(i)}</option>`)
    .join('')

  if (g === 'Trix') {
    f.innerHTML = `
      <div class="game-form">
        <p style="color:#aaa;font-size:13px">Assign finishing positions (1st: +200, 2nd: +150, 3rd: +100, 4th: +50)</p>
        <div class="form-row">
          ${['1st (+200)', '2nd (+150)', '3rd (+100)', '4th (+50)']
            .map(
              (pos, i) => `
            <div class="form-group">
              <label>${pos}</label>
              <select id="trix${i + 1}">${pOpts}</select>
            </div>
          `
            )
            .join('')}
        </div>
        <div id="trixError" class="validation-error"></div>
        <button class="submit-game" onclick="submitTrix()">Submit Trix</button>
      </div>
    `
    ;[0, 1, 2, 3].forEach(
      (i) => (document.getElementById(`trix${i + 1}`).value = i)
    )
  } else if (g === 'Latosh') {
    f.innerHTML = `
      <div class="game-form">
        <p style="color:#aaa;font-size:13px">Each Latosh = -15 points. Total must equal 13 Latosh (total -195).</p>
        <div class="form-row">
          ${[0, 1, 2, 3]
            .map(
              (i) => `
            <div class="form-group">
              <label>${getPlayerLabel(i)} - Latosh</label>
              <input type="number" id="latosh${i}" min="0" max="13" value="0">
            </div>
          `
            )
            .join('')}
        </div>
        <div id="latoshError" class="validation-error"></div>
        <button class="submit-game" onclick="submitLatosh()">Submit Latosh</button>
      </div>
    `
  } else if (g === 'Dinari') {
    f.innerHTML = `
      <div class="game-form">
        <p style="color:#aaa;font-size:13px">Each ♦ card = -10 points. Total must equal 13 diamonds.</p>
        <div class="form-row">
          ${[0, 1, 2, 3]
            .map(
              (i) => `
            <div class="form-group">
              <label>${getPlayerLabel(i)} - ♦ Cards</label>
              <input type="number" id="dinari${i}" min="0" max="13" value="0">
            </div>
          `
            )
            .join('')}
        </div>
        <div id="dinariError" class="validation-error"></div>
        <button class="submit-game" onclick="submitDinari()">Submit Dinari</button>
      </div>
    `
  } else if (g === 'Girls') {
    f.innerHTML = `
      <div class="game-form">
        <p style="color:#aaa;font-size:13px">Normal Queen = -25, Doubled = -50. Doubler gets +25 (individual) or trap rules apply.</p>
        ${['♠', '♥', '♦', '♣']
          .map(
            (suit, qi) => `
          <div class="queen-row">
            <h4>Queen ${suit}</h4>
            <div class="queen-controls">
              <select id="queenTaker${qi}"><option value="-1">Not Taken</option>${pOpts}</select>
              <label><input type="checkbox" id="queenDouble${qi}" onchange="toggleDoubler(${qi})"> Doubled</label>
              <select id="queenDoubler${qi}" class="doubler-select" style="display:none">${pOpts}</select>
            </div>
          </div>
        `
          )
          .join('')}
        <div id="girlsError" class="validation-error"></div>
        <button class="submit-game" onclick="submitGirls()">Submit Girls</button>
      </div>
    `
  } else if (g === 'Khteyar') {
    f.innerHTML = `
      <div class="game-form">
        <p style="color:#aaa;font-size:13px">K♠ = -75 points. Doubled = -150. Doubler gets +75 (individual) or trap rules.</p>
        <div class="form-row">
          <div class="form-group">
            <label>Who took K♠?</label>
            <select id="khteyarTaker">${pOpts}</select>
          </div>
          <div class="form-group">
            <label>&nbsp;</label>
            <div class="checkbox-group">
              <input type="checkbox" id="khteyarDouble" onchange="toggleKhteyarDoubler()"> Doubled
            </div>
          </div>
          <div class="form-group" id="khteyarDoublerGroup" style="display:none">
            <label>Who doubled?</label>
            <select id="khteyarDoubler">${pOpts}</select>
          </div>
        </div>
        <div id="khteyarError" class="validation-error"></div>
        <button class="submit-game" onclick="submitKhteyar()">Submit Khteyar</button>
      </div>
    `
  }
}

// Submit Functions
function submitTrix() {
  const ps = [0, 1, 2, 3].map((i) =>
    parseInt(document.getElementById(`trix${i + 1}`).value)
  )
  const unique = new Set(ps)
  if (unique.size !== 4) {
    document.getElementById('trixError').textContent =
      'Each position must have a different player!'
    return
  }
  const pts = [200, 150, 100, 50]
  const changes = []
  ps.forEach((pi, pos) => {
    scores[pi] += pts[pos]
    changes.push(`${getPlayerLabel(pi)}: +${pts[pos]}`)
  })
  finishGame('Trix', changes.join(', '))
}

function submitLatosh() {
  const cards = [0, 1, 2, 3].map(
    (i) => parseInt(document.getElementById(`latosh${i}`).value) || 0
  )
  const total = cards.reduce((a, b) => a + b, 0)
  if (total !== 13) {
    document.getElementById(
      'latoshError'
    ).textContent = `Total Latosh must be 13! Current: ${total}`
    return
  }
  const changes = []
  cards.forEach((c, i) => {
    const pts = c * -15
    scores[i] += pts
    if (pts !== 0) changes.push(`${getPlayerLabel(i)}: ${pts}`)
  })
  finishGame('Latosh', changes.join(', '))
}

function submitDinari() {
  const cards = [0, 1, 2, 3].map(
    (i) => parseInt(document.getElementById(`dinari${i}`).value) || 0
  )
  const total = cards.reduce((a, b) => a + b, 0)
  if (total !== 13) {
    document.getElementById(
      'dinariError'
    ).textContent = `Total diamonds must be 13! Current: ${total}`
    return
  }
  const changes = []
  cards.forEach((c, i) => {
    const pts = c * -10
    scores[i] += pts
    if (pts !== 0) changes.push(`${getPlayerLabel(i)}: ${pts}`)
  })
  finishGame('Dinari', changes.join(', '))
}

function submitGirls() {
  const changes = []
  const suits = ['♠', '♥', '♦', '♣']

  for (let qi = 0; qi < 4; qi++) {
    const taker = parseInt(document.getElementById(`queenTaker${qi}`).value)
    if (taker === -1) continue

    const doubled = document.getElementById(`queenDouble${qi}`).checked
    const doubler = doubled
      ? parseInt(document.getElementById(`queenDoubler${qi}`).value)
      : null

    if (doubled) {
      if (mode === 'individual') {
        // Taker always gets -50
        scores[taker] += -50

        if (doubler === taker) {
          // Self-doubled: only -50, no bonus
          changes.push(
            `${getPlayerLabel(taker)}: -50 (self-doubled Q${suits[qi]})`
          )
        } else {
          // Doubler gets +25
          scores[doubler] += 25
          changes.push(
            `${getPlayerLabel(taker)}: -50, ${getPlayerLabel(doubler)}: +25 (Q${
              suits[qi]
            } doubled)`
          )
        }
      } else {
        // Partnership mode
        const takerTeam = getTeamIndex(taker)
        const doublerTeam = getTeamIndex(doubler)

        // Taker always gets -50
        scores[taker] += -50

        if (takerTeam === doublerTeam) {
          // Same team: only -50 to taker, no bonus
          changes.push(
            `${getPlayerLabel(taker)}: -50 (partner doubled Q${suits[qi]})`
          )
        } else {
          // Different teams: taker gets -50, no bonus to doubler
          changes.push(
            `${getPlayerLabel(taker)}: -50 (Q${suits[qi]} doubled by opponent)`
          )
        }
      }
    } else {
      // Normal queen: -25
      scores[taker] += -25
      changes.push(`${getPlayerLabel(taker)}: -25 (Q${suits[qi]})`)
    }
  }
  finishGame('Girls', changes.length ? changes.join(', ') : 'No queens taken')
}

function submitKhteyar() {
  const taker = parseInt(document.getElementById('khteyarTaker').value)
  const doubled = document.getElementById('khteyarDouble').checked
  const doubler = doubled
    ? parseInt(document.getElementById('khteyarDoubler').value)
    : null
  const changes = []

  if (doubled) {
    if (mode === 'individual') {
      if (doubler === taker) {
        scores[taker] += -150
        changes.push(`${getPlayerLabel(taker)}: -150 (doubled K♠ self)`)
      } else {
        scores[taker] += -150
        scores[doubler] += 75
        changes.push(
          `${getPlayerLabel(taker)}: -150, ${getPlayerLabel(
            doubler
          )}: +75 (K♠ trap)`
        )
      }
    } else {
      const takerTeam = getTeamIndex(taker)
      const doublerTeam = getTeamIndex(doubler)
      if (takerTeam === doublerTeam) {
        scores[taker] += -150
        changes.push(`${getPlayerLabel(taker)}: -150 (partner doubled K♠)`)
      } else {
        scores[taker] += -150
        scores[doubler] += 75
        changes.push(
          `${getPlayerLabel(taker)}: -150, ${getPlayerLabel(
            doubler
          )}: +75 (K♠ trap)`
        )
      }
    }
  } else {
    scores[taker] += -75
    changes.push(`${getPlayerLabel(taker)}: -75 (K♠)`)
  }
  finishGame('Khteyar', changes.join(', '))
}

// Finish Game
function finishGame(game, details) {
  kingdoms[currentOwner][game] = true
  history.push({ owner: getOwnerLabel(currentOwner), game, details })
  renderHistory()
  renderScoreboard()
  renderGameSelector()
  currentOwner = null
  currentGame = null
  checkGameEnd()
}

// Render History
function renderHistory() {
  const c = document.getElementById('historyList')
  c.innerHTML = history
    .slice()
    .reverse()
    .map(
      (h) =>
        `<div class="history-item"><strong>${h.owner}'s ${h.game}:</strong> ${h.details}</div>`
    )
    .join('')
}

// Check Game End
function checkGameEnd() {
  const allDone = Object.values(kingdoms).every((k) =>
    Object.values(k).every((v) => v)
  )
  if (allDone) {
    setTimeout(() => {
      let msg = '🎉 Game Over!\n\n'
      if (mode === 'individual') {
        const sorted = players
          .map((p, i) => ({ p, s: scores[i] }))
          .sort((a, b) => b.s - a.s)
        msg += sorted.map((x, i) => `${i + 1}. ${x.p}: ${x.s}`).join('\n')
      } else {
        const t1 = getTeamScore(0),
          t2 = getTeamScore(1)
        msg += `${teamNames[0]}: ${t1}\n${teamNames[1]}: ${t2}\n\nWinner: ${
          t1 > t2 ? teamNames[0] : t2 > t1 ? teamNames[1] : 'Tie!'
        }`
      }
      alert(msg)
    }, 500)
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
  currentOwner = null
  currentGame = null

  document.getElementById('setupPanel').style.display = 'block'
  document.getElementById('modeSelect').style.display = 'flex'
  document.getElementById('gameArea').style.display = 'none'
  document.getElementById('indBtn').classList.add('active')
  document.getElementById('partBtn').classList.remove('active')
  document.getElementById('historyList').innerHTML = ''

  renderSetup()
}

// Initialize
renderSetup()
