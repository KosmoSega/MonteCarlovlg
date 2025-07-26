// Основные переменные
let balance = 1000;
const balanceValue = document.getElementById("balanceValue");
const betInput = document.getElementById("bet");
const currentBet = () => Math.min(balance, parseInt(betInput.value) || 0);

// Обновление баланса на странице
function updateBalance() {
  balanceValue.textContent = balance;
}

// Воспроизведение звука
function playSound(id) {
  const a = document.getElementById(id);
  if (a) {
    a.pause();
    a.currentTime = 0;
    a.play();
  }
}

function playClick() {
  playSound("clickSound");
}

// Показ нужной игры
function showGame(id) {
  document.querySelectorAll(".game").forEach(g => g.style.display = "none");
  document.getElementById(id).style.display = "block";
  if(id === "blackjack") setupBlackjack();
}

// История для игр
function logHistory(game, text) {
  const el = document.getElementById(game + 'History');
  const entry = document.createElement('div');
  entry.textContent = new Date().toLocaleTimeString() + ": " + text;
  el.prepend(entry);
}

// ========================
// СЛОТЫ
// ========================
const slotSymbols = ["🍖", "🍺", "🍷", "🚤", "🌊", "🥃", "🍻", "🍗"];
const reels = document.querySelectorAll('#slotMachine .reel .symbols');

function createReelContent() {
  return slotSymbols.concat(slotSymbols).concat(slotSymbols)
    .map(s => `<div>${s}</div>`).join('');
}

reels.forEach(r => r.innerHTML = createReelContent());

function playSlots() {
  if (balance < currentBet() || currentBet() <= 0) {
    Swal.fire("Ошибка", "Недостаточно рубчиков или неверная ставка!", "error");
    return;
  }

  playSound("spinSound");
  balance -= currentBet();
  updateBalance();

  let stops = [];
  reels.forEach((reel, i) => {
    reel.style.transition = 'transform 3s cubic-bezier(0.33, 1, 0.68, 1)';
    let stopIndex = Math.floor(Math.random() * slotSymbols.length);
    stops.push(stopIndex);

    // Высота символа — 33.33px
    let offset = -((slotSymbols.length * 3 + stopIndex) * 33.33);

    // Задержка для каждого барабана
    setTimeout(() => {
      reel.style.transform = `translateY(${offset}px)`;
    }, i * 700);
  });

  setTimeout(() => {
    // Проверяем выигрыш: все три символа равны?
    if (stops.every(v => v === stops[0])) {
      let win = currentBet() * 5;
      balance += win;
      updateBalance();
      logHistory("slot", `Выигрыш: +${win} ₽`);
      playSound("winSound");
      Swal.fire("Поздравляем!", `Вы выиграли ${win} ₽!`, "success");
    } else {
      logHistory("slot", `Проигрыш: -${currentBet()} ₽`);
      playSound("loseSound");
    }
  }, 4000);
}

// ========================
// РУЛЕТКА
// ========================

const canvas = document.getElementById('rouletteCanvas');
const ctx = canvas.getContext('2d');
const sectors = 37;
const colors = [];
for(let i=0; i<sectors; i++){
  if(i === 0) colors.push('#008000'); // зеленый для 0
  else if(i % 2 === 0) colors.push('#ff0000'); // красный для четных
  else colors.push('#000000'); // черный для нечетных
}

const sectorAngle = (2 * Math.PI) / sectors;

function drawWheel(angle) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 140;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  for(let i = 0; i < sectors; i++){
    ctx.beginPath();
    ctx.fillStyle = colors[i];
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, i * sectorAngle, (i+1) * sectorAngle);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Текст номеров
    ctx.save();
    ctx.fillStyle = (i === 0) ? '#fff' : (colors[i] === '#000000' ? '#fff' : '#000');
    ctx.translate(radius * 0.75 * Math.cos(i * sectorAngle + sectorAngle/2), radius * 0.75 * Math.sin(i * sectorAngle + sectorAngle/2));
    ctx.rotate(i * sectorAngle + sectorAngle/2 + Math.PI/2);
    ctx.font = '16px Orbitron';
    ctx.fillText(i.toString(), -ctx.measureText(i.toString()).width/2, 0);
    ctx.restore();
  }

  ctx.restore();
}

let currentAngle = 0;
let spinTime = 0;
let spinTimeTotal = 0;

function easeOut(t) {
  return t*(2-t);
}

function spinRoulette(callback) {
  spinTime = 0;
  spinTimeTotal = 4000 + Math.random()*2000; // 4-6 секунд

  function animate() {
    spinTime += 30;
    if(spinTime >= spinTimeTotal) {
      drawWheel(currentAngle);
      if(callback) callback(getResultFromAngle(currentAngle));
      return;
    }
    const spinAngle = easeOut(spinTime / spinTimeTotal) * (10 * Math.PI);
    currentAngle = spinAngle;
    drawWheel(currentAngle);
    requestAnimationFrame(animate);
  }

  animate();
}

function getResultFromAngle(angle) {
  let normalized = angle % (2*Math.PI);
  if(normalized < 0) normalized += 2*Math.PI;
  let index = Math.floor(sectors - normalized / sectorAngle) % sectors;
  return index;
}

function playRoulette() {
  const numberInput = document.getElementById("rouletteNumber");
  const number = parseInt(numberInput.value);
  if (isNaN(number) || number < 0 || number > 36) {
    Swal.fire("Ошибка", "Введите число от 0 до 36", "warning");
    return;
  }

  if (balance < currentBet() || currentBet() <= 0) {
    Swal.fire("Ошибка", "Недостаточно рубчиков или неверная ставка!", "error");
    return;
  }

  balance -= currentBet();
  updateBalance();

  playSound("spinSound");

  spinRoulette(result => {
    let message = `Выпало число: ${result}. `;
    if(result === number) {
      let win = currentBet() * 36;
      balance += win;
      updateBalance();
      playSound("winSound");
      logHistory("roulette", `Угадали ${result}, +${win} ₽`);
      Swal.fire("Поздравляем!", message + `Вы выиграли ${win} ₽!`, "success");
    } else {
      playSound("loseSound");
      logHistory("roulette", `Ставка: ${number}, выпало: ${result}, -${currentBet()} ₽`);
      Swal.fire("Увы", message + "Вы проиграли.", "info");
    }
  });
}

// ========================
// БЛЭКДЖЕК
// ========================

const dealerArea = document.getElementById('dealerCards');
const playerArea = document.getElementById('playerCards');
const blackjackResult = document.getElementById('blackjackResult');
const dealBtn = document.getElementById('dealBtn');
const hitBtn = document.getElementById('hitBtn');
const standBtn = document.getElementById('standBtn');

let deck = [];
let dealerCards = [];
let playerCards = [];
let gameOver = true;

function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const newDeck = [];
  for(let suit of suits){
    for(let rank of ranks){
      newDeck.push({rank, suit});
    }
  }
  return shuffle(newDeck);
}

function shuffle(array) {
  for(let i = array.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i+1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function cardToString(card) {
  let redSuits = ['♥','♦'];
  let cls = redSuits.includes(card.suit) ? 'card red' : 'card';
  return `<div class="${cls}">${card.rank}${card.suit}</div>`;
}

function renderCards() {
  dealerArea.innerHTML = dealerCards.map(cardToString).join('');
  playerArea.innerHTML = playerCards.map(cardToString).join('');
}

function getCardValue(card) {
  if (card.rank === 'A') return 11;
  if (['J','Q','K'].includes(card.rank)) return 10;
  return parseInt(card.rank);
}

function getHandValue(cards) {
  let total = 0;
  let aces = 0;
  for(let c of cards){
    total += getCardValue(c);
    if(c.rank === 'A') aces++;
  }
  while(total > 21 && aces > 0){
    total -= 10;
    aces--;
  }
  return total;
}

function setupBlackjack() {
  deck = createDeck();
  dealerCards = [];
  playerCards = [];
  gameOver = false;
  blackjackResult.textContent = "";
  dealBtn.disabled = false;
  hitBtn.disabled = true;
  standBtn.disabled = true;
  renderCards();
}

function dealBlackjack() {
  if (balance < currentBet() || currentBet() <= 0) {
    Swal.fire("Ошибка", "Недостаточно рубчиков или неверная ставка!", "error");
    return;
  }

  balance -= currentBet();
  updateBalance();

  dealerCards = [deck.pop(), deck.pop()];
  playerCards = [deck.pop(), deck.pop()];
  renderCards();

  dealBtn.disabled = true;
  hitBtn.disabled = false;
  standBtn.disabled = false;

  let playerVal = getHandValue(playerCards);
  if(playerVal === 21){
    standBlackjack();
  }
}

function hitBlackjack() {
  playerCards.push(deck.pop());
  renderCards();
  let val = getHandValue(playerCards);
  if(val > 21){
    endGame(false);
  }
}

function standBlackjack() {
  hitBtn.disabled = true;
  standBtn.disabled = true;

  // Ход дилера
  let dealerVal = getHandValue(dealerCards);
  while(dealerVal < 17){
    dealerCards.push(deck.pop());
    dealerVal = getHandValue(dealerCards);
    renderCards();
  }

  let playerVal = getHandValue(playerCards);
  if(dealerVal > 21 || playerVal > dealerVal){
    endGame(true);
  } else if(playerVal === dealerVal){
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

  if(playerWon === true){
    let win = currentBet() * 2;
    balance += win;
    updateBalance();
    blackjackResult.textContent = `Вы выиграли! +${win} ₽`;
    logHistory("blackjack", `Выигрыш +${win} ₽`);
    playSound("winSound");
    Swal.fire("Поздравляем!", "Вы выиграли в блэкджек!", "success");
  } else if(playerWon === false){
    blackjackResult.textContent = "Вы проиграли!";
    logHistory("blackjack", `Проигрыш -${currentBet()} ₽`);
    playSound("loseSound");
    Swal.fire("Увы", "Вы проиграли в блэкджек.", "error");
  } else {
    balance += currentBet();
    updateBalance();
    blackjackResult.textContent = "Ничья!";
    logHistory("blackjack", `Ничья, ставка возвращена`);
    Swal.fire("Ничья", "Ставка возвращена", "info");
  }
  renderCards();
}

// Инициализация
updateBalance();
showGame('slots');
drawWheel(0);
