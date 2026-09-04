const canvas = document.querySelector('#game-canvas');
const context = canvas.getContext('2d');
const distanceElement = document.querySelector('#distance');
const starsElement = document.querySelector('#stars');
const statusElement = document.querySelector('#status');
const message = document.querySelector('#message');
const messageDetail = document.querySelector('#message-detail');
const restartButtons = [document.querySelector('#restart-button'), document.querySelector('#message-button')];

const worldWidth = 4800;
const keys = new Set();
const platforms = [
    { x: 0, y: 455, width: 760, height: 85 }, { x: 850, y: 405, width: 250, height: 135 },
    { x: 1190, y: 455, width: 520, height: 85 }, { x: 1780, y: 365, width: 180, height: 175 },
    { x: 2050, y: 430, width: 360, height: 110 }, { x: 2490, y: 380, width: 220, height: 160 },
    { x: 2820, y: 455, width: 580, height: 85 }, { x: 3500, y: 400, width: 300, height: 140 },
    { x: 3910, y: 455, width: 890, height: 85 }
];
const starSpots = [[350, 375], [650, 315], [955, 325], [1300, 375], [1850, 285], [2220, 350], [2600, 300], [3650, 320]];
let player;
let stars;
let cameraX;
let gameState;
let lastTime = 0;

function resetGame() {
    player = { x: 90, y: 350, width: 30, height: 42, velocityX: 0, velocityY: 0, grounded: false };
    stars = starSpots.map(([x, y]) => ({ x, y, collected: false }));
    cameraX = 0;
    gameState = 'running';
    message.hidden = true;
    statusElement.textContent = 'RUNNING';
    statusElement.style.color = '#329087';
}

function update(delta) {
    if (gameState !== 'running') return;
    const speed = 270;
    player.velocityX = (keys.has('ArrowRight') || keys.has('d') ? speed : 0) - (keys.has('ArrowLeft') || keys.has('a') ? speed : 0);
    if ((keys.has(' ') || keys.has('ArrowUp') || keys.has('w')) && player.grounded) { player.velocityY = -570; player.grounded = false; }
    player.velocityY += 1450 * delta;
    player.x = Math.max(0, Math.min(worldWidth - player.width, player.x + player.velocityX * delta));
    const previousBottom = player.y + player.height;
    player.y += player.velocityY * delta;
    player.grounded = false;
    for (const platform of platforms) {
        const overlaps = player.x + player.width > platform.x && player.x < platform.x + platform.width;
        if (overlaps && previousBottom <= platform.y && player.y + player.height >= platform.y && player.velocityY >= 0) {
            player.y = platform.y - player.height; player.velocityY = 0; player.grounded = true;
        }
    }
    for (const star of stars) {
        if (!star.collected && Math.hypot(player.x + player.width / 2 - star.x, player.y + player.height / 2 - star.y) < 32) star.collected = true;
    }
    if (player.y > canvas.height + 100) finish(false);
    if (player.x > worldWidth - 150) finish(true);
    cameraX += (player.x - cameraX - 240) * Math.min(1, delta * 5);
    cameraX = Math.max(0, Math.min(worldWidth - canvas.width, cameraX));
    distanceElement.textContent = String(Math.floor(player.x / 10)).padStart(4, '0');
    starsElement.textContent = `${stars.filter(star => star.collected).length} / ${stars.length}`;
}

function finish(won) {
    gameState = won ? 'won' : 'lost';
    statusElement.textContent = won ? 'CLEAR' : 'TRY AGAIN';
    statusElement.style.color = won ? '#ef6f61' : '#17222d';
    messageDetail.textContent = won ? `${stars.filter(star => star.collected).length}個の星を回収` : '足場から落ちてしまった';
    document.querySelector('.message-kicker').textContent = won ? 'MISSION COMPLETE' : 'SIGNAL LOST';
    document.querySelector('.message h2').innerHTML = won ? '地平線の先へ、<br>到達した。' : 'もう一度、<br>走り出そう。';
    message.hidden = false;
}

function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save(); context.translate(-cameraX, 0);
    context.fillStyle = '#b9dddd'; context.fillRect(cameraX, 0, canvas.width, canvas.height);
    context.fillStyle = '#8bbebc';
    for (let x = Math.floor(cameraX / 420) * 420 - 420; x < cameraX + canvas.width + 420; x += 420) context.fillRect(x, 230, 240, 225);
    context.fillStyle = '#eaf0e9'; context.fillRect(0, 0, worldWidth, 105);
    context.fillStyle = '#d3e2dd'; context.font = '500 11px DM Mono'; context.fillText('KEEP MOVING / KEEP LOOKING UP', cameraX + 28, 145);
    for (const platform of platforms) { context.fillStyle = '#17222d'; context.fillRect(platform.x, platform.y, platform.width, platform.height); context.fillStyle = '#ef6f61'; context.fillRect(platform.x, platform.y, platform.width, 6); }
    for (const star of stars) if (!star.collected) { context.fillStyle = '#f5c85b'; context.beginPath(); context.arc(star.x, star.y, 10, 0, Math.PI * 2); context.fill(); context.fillStyle = '#fff1b8'; context.beginPath(); context.arc(star.x - 3, star.y - 3, 3, 0, Math.PI * 2); context.fill(); }
    context.fillStyle = '#ef6f61'; context.fillRect(worldWidth - 100, 355, 5, 100); context.fillStyle = '#17222d'; context.font = '500 11px DM Mono'; context.fillText('FINISH', worldWidth - 125, 340);
    context.fillStyle = '#f5c85b'; context.fillRect(player.x, player.y, player.width, player.height); context.fillStyle = '#17222d'; context.fillRect(player.x + 7, player.y + 10, 6, 6); context.fillRect(player.x + 20, player.y + 10, 6, 6); context.fillStyle = '#ef6f61'; context.fillRect(player.x + 5, player.y - 7, 20, 8);
    context.restore();
}

function loop(timestamp) { const delta = Math.min((timestamp - lastTime) / 1000 || 0, 0.033); lastTime = timestamp; update(delta); draw(); requestAnimationFrame(loop); }
window.addEventListener('keydown', event => { keys.add(event.key); if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault(); if (event.key.toLowerCase() === 'r') resetGame(); });
window.addEventListener('keyup', event => keys.delete(event.key));
restartButtons.forEach(button => button.addEventListener('click', resetGame));
resetGame(); requestAnimationFrame(loop);