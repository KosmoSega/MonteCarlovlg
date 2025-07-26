// -- Основные переменные и селекторы --
let balance = 1000;
const balanceValue = document.getElementById("balanceValue");
const betInput = document.getElementById("bet");

function currentBet() {
  let bet = parseInt(betInput.value);
  if (isNaN(bet) || bet < 10) bet = 10;
  if (bet > 1000) bet = 1000;
  if (bet > balance) bet = balance;
  return bet;
}

function updateBalance() {
  balanceValue.textContent = balance;
  betInput.value = currentBet();
}

// -- Переключение игр --
const gameButtons = document.querySelectorAll(".game-btn");
const games = document.querySelectorAll(".game");

gameButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    gameButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.game;
    games.forEach(g => g.classList.remove("active"));
    document.getElementById(target).classList.add("active");

    if (target === "blackjack") setupBlackjack();
  });
});

// ========================================
// ============== СЛОТЫ ==================
// ========================================

const slotSymbols = ["🍖", "🍺", "🍷", "🚤", "🌊", "🥃", "🍻", "🍗"];
const reels = document.querySelectorAll('#slotMachine .reel .symbols');

function createReelContent() {
  // Удваиваем набор для бесшовного цикла
  return slotSymbols.concat(slotSymbols).concat(slotSymbols)
    .map(s => `<div>${s}</div>`).join('');
}

reels.forEach(r => r.innerHTML = createReelContent());

function animateReel(reel, stopIndex, delay) {
  // Высота символа = 33.33px
  const symbolHeight = 33.33;
  const totalSymbols = slotSymbols.length * 3;
  const offset = -((slotSymbols.length * 2 + stopIndex) * symbolHeight);

  return new Promise(resolve => {
    reel.style.transition = 'transform 3s cubic-bezier(0.33, 1, 0.68, 1)';
    setTimeout(() => {
      reel.style.transform = `translateY(${offset}px)`;
    }, delay);

    reel.addEventListener('transitionend', function handler() {
      reel.style.transition = 'none';
      reel.style.transform = `translateY(${-((slotSymbols.length + stopIndex) * symbolHeight)}px)`;
      reel.removeEventListener('transitionend', handler);
      resolve();
    });
  });
}

async function playSlots() {
  let bet = currentBet();
  if (balance < bet || bet <= 0) {
    Swal.fire("Ошибка", "Недостаточно рубчиков или неверная ставка!", "error");
    return;
  }

  balance -= bet;
  updateBalance();

  document.getElementById("spinSlotsBtn").disabled = true;

  const stops = [];
  for (let i = 0; i < reels.length; i++) {
    stops.push(Math.floor(Math.random() * slotSymbols.length));
  }

  for (let i = 0; i < reels.length; i++) {
    await animateReel(reels[i], stops[i], i * 700);
  }

  // Проверка выигрыша (все три символа совпадают)
  const resultSymbols = stops.map(i => slotSymbols[i]);
  if (resultSymbols.every(s => s === resultSymbols[0])) {
    let win = bet * 5;
    balance += win;
    updateBalance();
    logHistory("slot", `Выигрыш: +${win} ₽ (${resultSymbols[0]})`);
    Swal.fire("Поздравляем!", `Вы выиграли ${win} ₽!`, "success");
  } else {
    logHistory("slot", `Проигрыш: -${bet} ₽ (${resultSymbols.join(", ")})`);
    Swal.fire("Попробуйте снова!", "Удача будет на вашей стороне!", "info");
  }

  document.getElementById("spinSlotsBtn").disabled = false;
}

document.getElementById("spinSlotsBtn").addEventListener("click", playSlots);

// ========================================
// ============= РУЛЕТКА ==================
// ========================================

const rouletteCanvas = document.getElementById("rouletteCanvas");
const ctx = rouletteCanvas.getContext("2d");
const numbers = [...Array(37).keys()]; // 0-36

const colors = numbers.map(n => {
  if (n === 0) return '#009640'; // зелёный
  // Чёрно-красное чередование согласно европейской рулетке
  const redNumbers = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
  return redNumbers.includes(n) ? '#cc0000' : '#000000';
});

const wheelRadius = 140;
const centerX = rouletteCanvas.width / 2;
const centerY = rouletteCanvas.height / 2;
const segmentAngle = (2 * Math.PI) / numbers.length;

let currentAngle = 0;
let spinning = false;

function drawWheel(angle) {
  ctx.clearRect(0, 0, rouletteCanvas.width, rouletteCanvas.height);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  for (let i = 0; i < numbers.length; i++) {
    const startAngle = i * segmentAngle;
    const endAngle = startAngle + segmentAngle;

    // Сегмент
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, wheelRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Текст номера
    ctx.save();
    ctx.fillStyle = '#fff';
    ctx.translate(
      Math.cos(startAngle + segmentAngle / 2) * (wheelRadius - 30),
      Math.sin(startAngle + segmentAngle / 2) * (wheelRadius - 30)
    );
    ctx.rotate(startAngle + segmentAngle / 2 + Math.PI / 2);
    ctx.font = 'bold 16px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(numbers[i], 0, 0);
    ctx.restore();
  }

  ctx.restore();
}

function spinRoulette() {
  if (spinning) return;

  let bet = currentBet();
  if (balance < bet || bet <= 0) {
    Swal.fire("Ошибка", "Недостаточно рубчиков или неверная ставка!", "error");
    return;
  }

  const guess = parseInt(document.getElementById("rouletteNumber").value);
  if (isNaN(guess) || guess < 0 || guess > 36) {
    Swal.fire("Ошибка", "Введите число от 0 до 36", "warning");
    return;
  }

  balance -= bet;
  updateBalance();

  spinning = true;
  let spins = 60 + Math.floor(Math.random() * 30);
  let current = 0;
  let easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function animate() {
    current++;
    const progress = current / spins;
    currentAngle += easeOut(progress) * 0.5;
    drawWheel(currentAngle);

    if (current < spins) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      const normalizedAngle = currentAngle % (2 * Math.PI);
      const index = numbers.length - 1 - Math.floor(normalizedAngle / segmentAngle);
      const resultNumber = numbers[(index + numbers.length) % numbers.length];

      let message;
      if (resultNumber === guess) {
        let win = bet * 36;
        balance += win;
        updateBalance();
        logHistory("roulette", `Угадали число ${resultNumber}, выигрыш +${win} ₽`);
        Swal.fire("Поздравляем!", `Выпало ${resultNumber}. Вы выиграли ${win} ₽!`, "success");
      } else {
        logHistory("roulette", `Ставка ${guess}, выпало ${resultNumber}, проигрыш -${bet} ₽`);
        Swal.fire("Увы", `Выпало ${resultNumber}. Вы проиграли.`, "info");
      }
      document.getElementById("rouletteNumber").value = '';
    }
  }

  animate();
}

document.getElementById("spinRouletteBtn").addEventListener("click", spinRoulette);

drawWheel(0);

// ========================================
// ============= БЛЭКДЖЕК =================
// ========================================

let deck = [];
let dealerCards = [];
let playerCards = [];
let gameOver = false;

const dealerArea = document.getElementById("dealerCards");
const playerArea = document.getElementById("playerCards");
const blackjackResult = document.getElementById("blackjackResult");

const dealBtn = document.getElementById("dealBtn");
const hitBtn = document.getElementById("hitBtn");
const standBtn = document.getElementById("standBtn");

function createDeck() {
  const suits = ['♠', '♣', '♥', '♦'];
  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const array = [];
  for (let s of suits) {
    for (let r of ranks) {
      array.push({rank: r, suit: s});
    }
  }
  return array;
}

function cardToHtml(card) {
  const redSuits = ['♥','♦'];
  const cls = redSuits.includes(card.suit) ? "card red" : "card";
  return `<div class="${cls}">${card.rank}${card.suit}</div>`;
}

function renderCards() {
  dealerArea.innerHTML = dealerCards.map(cardToHtml).join('');
  playerArea.innerHTML = playerCards.map(cardToHtml).join('');
}

function getCardValue(card) {
  if (card.rank === 'A') return 11;
  if (['J','Q','K'].includes(card.rank)) return 10;
  return parseInt(card.rank);
}

function getHandValue(cards) {
  let total = 0;
  let aces = 0;
  for (let card of cards) {
    total += getCardValue(card);
    if (card.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function setupBlackjack() {
  deck = createDeck();
  shuffle(deck);
  dealerCards = [];
  playerCards = [];
  gameOver = false;
  blackjackResult.textContent = "";
  dealBtn.disabled = false;
  hitBtn.disabled = true;
  standBtn.disabled = true;
  renderCards();
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function dealBlackjack() {
  const bet = currentBet();
  if (balance < bet || bet <= 0) {
    Swal.fire("Ошибка", "Недостаточно рубчиков или неверная ставка!", "error");
    return;
  }

  balance -= bet;
  updateBalance();

  dealerCards = [deck.pop(), deck.pop()];
  playerCards = [deck.pop(), deck.pop()];
  renderCards();

  dealBtn.disabled = true;
  hitBtn.disabled = false;
  standBtn.disabled = false;
  blackjackResult.textContent = "";

  if (getHandValue(playerCards) === 21) {
    standBlackjack();
  }
}

function hitBlackjack() {
  playerCards.push(deck.pop());
  renderCards();
  const val = getHandValue(playerCards);
  if (val > 21) {
    endGame(false);
  }
}

function standBlackjack() {
  hitBtn.disabled = true;
  standBtn.disabled = true;

  let dealerVal = getHandValue(dealerCards);
  while (dealerVal < 17) {
    dealerCards.push(deck.pop());
    dealerVal = getHandValue(dealerCards);
    renderCards();
  }

  const playerVal = getHandValue(playerCards);

  if (dealerVal > 21 || playerVal > dealerVal) {
    endGame(true);
  } else if (playerVal === dealerVal) {
    endGame(null);
  } else {
    endGame(false);
  }
}

function endGame(playerWon) {
  gameOver = true;
  dealBtn.disabled = false;
  hitBtn.disabled = true;
  standBtn.disabled = true;

  const bet = currentBet();

  if (playerWon === true) {
    const win = bet * 2;
    balance += win;
    updateBalance();
    blackjackResult.textContent = `Вы выиграли! +${win} ₽`;
    logHistory("blackjack", `Выигрыш +${win} ₽`);
    Swal.fire("Поздравляем!", "Вы выиграли в блэкджек!", "success");
  } else if (playerWon === false) {
    blackjackResult.textContent = "Вы проиграли!";
    logHistory("blackjack", `Проигрыш -${bet} ₽`);
    Swal.fire("Увы", "Вы проиграли в блэкджек.", "error");
  } else {
    balance += bet;
    updateBalance();
    blackjackResult.textContent = "Ничья!";
    logHistory("blackjack", `Ничья, ставка возвращена`);
    Swal.fire("Ничья", "Ставка возвращена", "info");
  }
  renderCards();
}

// Обработчики кнопок блэкджека
dealBtn.addEventListener("click", dealBlackjack);
hitBtn.addEventListener("click", hitBlackjack);
standBtn.addEventListener("click", standBlackjack);

// ========================================
// =============== ОБЩЕЕ ==================
// ========================================

function logHistory(game, text) {
  const el = document.getElementById(game + "History");
  if (!el) return;
  const entry = document.createElement("div");
  const time = new Date().toLocaleTimeString();
  entry.textContent = `${time}: ${text}`;
  el.prepend(entry);
}

// Инициализация
updateBalance();
setupBlackjack();
