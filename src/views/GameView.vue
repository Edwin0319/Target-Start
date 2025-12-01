<template>
    <popUpWindow :caution="getHomeFlag">
        <template v-slot:info>
            <p class="info-text">The game has not been passed yet.</p>
            <p class="info-text">Do you want to return?</p>
        </template>
        <template v-slot:button>
            <button @click="getHomeFlag = false" class="btn mg-r-m">No</button>
            <button @click="switchView(MainView)" class="btn">Yes</button>
        </template>
    </popUpWindow>
    <popUpWindow :caution="gameOverFlag">
        <template v-slot:info>
            <p class="info-text">Game Over! You have lost all your HP.</p>
            <p class="info-text">The game will restart from Level 1.</p>
        </template>
        <template v-slot:button>
            <button @click="handleGameOverOK" class="btn">OK</button>
        </template>
    </popUpWindow>
    <popUpWindow :caution="finishFlag">
        <template v-slot:info>
            <p class="info-text">Congratulations! You have completed the game.</p>
        </template>
        <template v-slot:button>
            <button @click="finish" class="btn">OK</button>
        </template>
    </popUpWindow>

    <div class="game-container">
        <div class="hud">
            <div class="hud-item">Level: {{ currentLevel }}</div>
            <div class="hud-item timer">{{ formattedTime }}</div>
            <div class="hud-item">HP: {{ hitPoints }}</div>
        </div>

        <div class="game-area">
            <canvas ref="gameCanvas" :width="canvasWidth" :height="canvasHeight"></canvas>

            <div v-if="isGameWon" class="overlay">
                <h2>Level Complete!</h2>
                <button class="btn" @click="nextLevel">Next Level</button>
            </div>
            
            <div v-if="isPaused" class="overlay">
                <h2>Paused</h2>
                <button class="btn" @click="togglePause">Resume</button>
            </div>
        </div>

        <div class="controls">
            <button class="btn" @click="getHomeFlag=true">Home</button>
            <button class="btn" @click="togglePause">{{ isPaused ? 'Resume' : 'Pause' }}</button>
        </div>
    </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted, computed } from 'vue'
import MainView from '@/views/MainView.vue'
import popUpWindow from '@/components/popUpWindow.vue'
import { element_volume, horizontal_quantity, vertical_quantity, preloadImages, imageMap } from '@/components/CanvasOperation.js'
// 导入图片资源用于绘制
import playerImgSrc from '@/assets/images/character.svg'

const size = element_volume.value;
const canvasWidth = horizontal_quantity.value * size;
const canvasHeight = vertical_quantity.value * size;
console.log("Canvas Size:", canvasWidth, canvasHeight);
const getHomeFlag = ref(false)


const switchView = inject('switchView')
const globalMaps = inject('globalMaps')
const totalLevels = inject('totalLevels')

// 游戏状态
const currentLevel = ref(1)
const hitPoints = ref(3)
const isPaused = ref(false)
const isGameWon = ref(false)
const gameCanvas = ref(null)
const gameOverFlag = ref(false)
const finishFlag = ref(false)
let platforms = [] // 移动平台列表

// 计时器状态
const startTime = ref(0)
const elapsedTime = ref(0)
const timerInterval = ref(null)

// 玩家物理属性
const playerImg = new Image();
playerImg.src = playerImgSrc;
const player = ref({
    x: 0, y: 0,
    width: size * 0.8, height: size * 0.8, // 略小于格子以方便通过
    vx: 0, vy: 0,
    speed: 0.5, jumpStrength: -12,
    grounded: false,
    img: playerImg
})
// 重力
const gravity = 0.6
// 摩擦力 (0~1)
const friction = 0.2

// 输入状态
const keys = { w: false, a: false, d: false }

// 当前关卡的运行时地图（深拷贝，因为吃星星不能影响编辑器里的原始数据）
let runtimeMap = [] 
let totalStars = 0
let collectedStars = 0
let animationFrameId = null

// --- 计时器逻辑 ---
const formattedTime = computed(() => {
    const totalMs = elapsedTime.value;
    const mm = Math.floor(totalMs / 60000).toString().padStart(2, '0');
    const ss = Math.floor((totalMs % 60000) / 1000).toString().padStart(2, '0');
    const SSS = (totalMs % 1000).toString().padStart(3, '0');
    return `${mm}:${ss}.${SSS}`; // 
})

function startTimer() {
    startTime.value = Date.now() - elapsedTime.value;
    timerInterval.value = setInterval(() => {
        if (!isPaused.value && !isGameWon.value) {
            elapsedTime.value = Date.now() - startTime.value;
        }
    }, 10);
}

function stopTimer() {
    clearInterval(timerInterval.value);
}

// --- 游戏初始化 ---
function initLevel(level) {
    // 0. 停止之前的游戏循环和计时器

    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    platforms = [];
    stopTimer();
    
    // 1. 深拷贝地图数据
    const sourceMap = globalMaps.value[level];
    runtimeMap = JSON.parse(JSON.stringify(sourceMap));
    
    // 2. 扫描地图：找到出生点，统计星星
    totalStars = 0;
    collectedStars = 0;
    let spawnFound = false;

    for(let r=0; r<runtimeMap.length; r++){
        for(let c=0; c<runtimeMap[r].length; c++){
            const id = runtimeMap[r][c];
            if(id === 1) { // Spawn Point
                player.value.x = c * size + 5; // 居中一点
                player.value.y = r * size + 5;
                spawnFound = true;
                runtimeMap[r][c] = 0; // 游戏中不显示出生点图标
            }
            else if (id === 2) { // Star
                totalStars++;
            }
            else if(id === 6){ // Moving Platform
                // 初始化平台数据
                const centerCol = c;
                const leftMostCol = centerCol -1;
                const p = {
                    row: r,
                    centerCol,
                    x: leftMostCol * size,
                    y: r * size,
                    width: size,
                    height: size,
                    vx: player.value.speed * 0.5, // 初始速度
                    xMin: (centerCol - 1) * size,
                    xMax: (centerCol + 1) * size
                };
                platforms.push(p);

                // 清除地图上的平台图标（游戏中不显示）
                if(runtimeMap[r][centerCol - 1] !== undefined) runtimeMap[r][centerCol - 1] = 0;
                if(runtimeMap[r][centerCol] !== undefined) runtimeMap[r][centerCol] = 0;
                if(runtimeMap[r][centerCol + 1] !== undefined) runtimeMap[r][centerCol + 1] = 0;

                c += 1; // 跳过后两个格子
            }
        }
    }

    hitPoints.value = 3;
    player.value.vx = 0;
    player.value.vy = 0;
    isGameWon.value = false;
    isPaused.value = false;
    player.value.groundedOnPlatform = null;

    startTime.value = 0;
    elapsedTime.value = 0;
    startTimer();
    gameLoop();
}

// --- 物理与碰撞逻辑 ---
function updatePhysics() {
    if (isPaused.value || isGameWon.value || gameOverFlag.value || finishFlag.value) return;
    // 1. 水平移动
    if (keys.a) player.value.vx -= player.value.speed;
    if (keys.d) player.value.vx += player.value.speed;

    player.value.vx *= (1-friction); // 摩擦力
    player.value.x += player.value.vx;
    checkCollision('x'); // X轴碰撞检测

    // 2. 垂直移动
    player.value.vy += gravity; // 重力
    player.value.y += player.value.vy;
    player.value.grounded = false;
    checkCollision('y'); // Y轴碰撞检测

    // 3. 跳跃
    if (keys.w && player.value.grounded) {
        player.value.vy = player.value.jumpStrength;
        player.value.grounded = false;
    }
    
    // 4. 边界检查（掉出地图）
    if (player.value.y > canvasHeight + 2 * size) {
        handleDeath();
    }
}

// 更新移动平台及玩家随平台移动逻辑
function updatePlatforms(){
    for(const p of platforms){
        p.x += p.vx;
        // 平台到达边界则反向
        if(p.x < p.xMin){
            p.x = p.xMin;
            p.vx *= -1;
        }
        else if(p.x > p.xMax){
            p.x = p.xMax;
            p.vx *= -1;
        }

        // 检测平台是否撞到了玩家（推人逻辑）
        if(player.value.groundedOnPlatform !== p){
            const playerLeft = player.value.x;
            const playerRight = player.value.x + player.value.width;
            const playerTop = player.value.y;
            const playerBottom = player.value.y + player.value.height;
            
            const platLeft = p.x;
            const platRight = p.x + p.width;
            const platTop = p.y;
            const platBottom = p.y + p.height;

            // AABB 碰撞检测
            if (playerRight > platLeft && playerLeft < platRight && 
                playerBottom > platTop && playerTop < platBottom) {
                    player.value.x += p.vx; // 平台推动玩家
                
            }
        }
    }
    // 检查玩家是否在某个平台上
    if(player.value.grounded && player.value.groundedOnPlatform){
        const plat = player.value.groundedOnPlatform;
        player.value.x += plat.vx; // 玩家随平台移动
    }
}

// 简单的 AABB 碰撞检测
function checkCollision(axis) {
    // 记录上一步底部位置（用于判断是否是从上方落到平台）
    const prevBottom = player.value.y - player.value.vy + player.value.height;
    const prevTop = player.value.y - player.value.vy;
    const prevLeft = player.value.x - player.value.vx;
    const prevRight = player.value.x + player.value.width - player.value.vx;

    // 计算玩家占据的网格范围
    const playerLeft = player.value.x;
    const playerRight = player.value.x + player.value.width;
    const playerTop = player.value.y;
    const playerBottom = player.value.y + player.value.height;
    const leftCol = Math.floor(playerLeft / size);
    const rightCol = Math.floor((playerRight - 0.1) / size);
    const topRow = Math.floor(playerTop / size);
    const bottomRow = Math.floor((playerBottom - 0.1) / size);

    // 平台碰撞处理
    for(const p of platforms){
        const platLeft = p.x;
        const platRight = p.x + p.width;
        const platTop = p.y;
        const platBottom = p.y + p.height;

        // Y轴碰撞
        if (axis === 'y') {
            if(player.value.vy > 0 && // 只在下落时检测
                playerRight > platLeft && playerLeft < platRight &&
                playerBottom >= platTop && prevBottom <= platTop) {

                // 碰到平台顶部
                player.value.y = platTop - player.value.height - 0.1;
                player.value.vy = 0;
                player.value.grounded = true;
                player.value.groundedOnPlatform = p; // 记录当前站立的平台
            }
            else if(player.value.vy < 0 &&
                (playerTop <= platBottom && prevTop >= platBottom) &&
                playerRight > platLeft && playerLeft < platRight) {

                // 碰到平台底部
                player.value.y = platBottom + 0.1;
                player.value.vy = 0;
            }
            
        }
        else if(axis === 'x'){
            if(playerRight > platLeft && playerLeft < platRight && 
                playerBottom > platTop && playerTop < platBottom){
                // 碰到平台侧面
                if(player.value.vx > 0) {
                    player.value.x = platLeft - player.value.width - 0.1;
                    player.value.vx = 0;
                }
                else if(player.value.vx < 0) {
                    player.value.x = platRight + 0.1;
                    player.value.vx = 0;

                }
            }
        }
        if(!player.value.grounded && player.value.groundedOnPlatform){
            player.value.groundedOnPlatform = null; // 离开平台     
        }
    }
    // 遍历玩家接触到的所有格子
    for (let r = topRow; r <= bottomRow; r++) {
        for (let c = leftCol; c <= rightCol; c++) {
            // 越界保护
            if (!runtimeMap[r] || runtimeMap[r][c] === undefined) continue;
            
            const tileId = runtimeMap[r][c];

            // --- 实体碰撞 (墙壁) ---
            if (tileId === 3) {
                if (axis === 'x') {
                    // 向右撞
                    if (player.value.vx > 0) {
                        player.value.x = c * size - player.value.width - 0.1;
                        player.value.vx = 0;
                    } 
                    // 向左撞
                    else if (player.value.vx < 0) {
                        player.value.x = (c + 1) * size + 0.1;
                        player.value.vx = 0;
                    }
                }
                else if (axis === 'y') {
                    // 向下撞（落地）
                    if (player.value.vy > 0) {
                        player.value.y = r * size - player.value.height - 0.1;
                        player.value.vy = 0;
                        player.value.grounded = true;
                    }
                    // 向上撞（顶头）
                    else if (player.value.vy < 0) {
                        player.value.y = (r + 1) * size + 0.1;
                        player.value.vy = 0;
                    }
                }
            }


            // --- 斜坡碰撞 (Sloped Block) ---
            else if(tileId === 5){
                const tileLeft = c * size;
                const tileRight = (c + 1) * size;
                const tileTop = r * size;
                const tileBottom = (r + 1) * size;
                
                // 斜坡高度
                let slopeY = tileBottom - (playerRight - tileLeft);
                slopeY = Math.max(slopeY, tileTop);

                if(axis === 'y'){
                    // 从上方落到斜坡
                    if(player.value.vy > 0 && playerBottom >= slopeY && prevBottom <= slopeY){
                        player.value.y = slopeY - player.value.height - 0.1;
                        player.value.vy = 0;
                        player.value.grounded = true;
                    }
                    // 从下方碰到斜坡底部
                    else if(player.value.vy < 0 && 
                        playerTop < tileBottom &&
                        prevTop >= tileBottom){

                        player.value.y = tileBottom + 0.1;
                        player.value.vy = 0;
                    }
                }
                else if(axis === 'x'){
                    // 撞到斜坡右侧
                    if(player.value.vx < 0 && playerLeft <= tileRight && prevLeft >= tileRight){
                        player.value.x = tileRight + 0.1;
                        player.value.vx = 0;
                    }
                    // 上下坡
                    else if(playerRight > tileLeft && playerLeft < tileRight && player.value.grounded){
                        player.value.y = slopeY - player.value.height - 0.1;
                        
                    }
                }
                
                
            }

            // --- 道具交互 ---
            // ID 2: Star
            if (tileId === 2) {
                collectStar(r, c);
            }
            
            // ID 4: Spring (弹簧) - 简化逻辑：碰到就弹高
            if (tileId === 4) {
                 player.value.vy = -20; // 强力弹跳
            }
        }
    }
}

function collectStar(r, c) {
    runtimeMap[r][c] = 0; // 从地图移除
    collectedStars++;
    // 检查胜利条件 
    if (collectedStars >= totalStars) {
        handleWin();
    }
}

function handleWin() {
    stopTimer();
    if(animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    if(currentLevel.value < totalLevels) {
        isGameWon.value = true;
    }
    else {
        finishFlag.value = true;
    }
}

function handleDeath() {
    // 扣除生命值
    hitPoints.value--;
    if (hitPoints.value > 0) {
        // 重生逻辑：不仅重置位置，还要保持当前时间
        // 简单处理：重新读取地图找出生点
        const sourceMap = globalMaps.value[currentLevel.value];
        for(let r=0; r<sourceMap.length; r++){
            for(let c=0; c<sourceMap[r].length; c++){
                if(sourceMap[r][c] === 1) {
                    console.log("Spawn Point found at:", r, c);
                    player.value.x = c * size + 5;
                    player.value.y = r * size + 5;
                    player.value.vx = 0; 
                    player.value.vy = 0;
                    return;
                }
            }
        }
    }
    else {
        // 游戏结束，显示游戏结束对话框
        // 停止当前游戏循环
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        stopTimer();
        gameOverFlag.value = true;
        // 不在这里立即重置游戏，等待用户点击确认按钮
    }
}


function draw() {
    const ctx = gameCanvas.value.getContext('2d');
    
    // 清空
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. 绘制地图
    for(let r=0; r<runtimeMap.length; r++){
        for(let c=0; c<runtimeMap[r].length; c++){
            const id = runtimeMap[r][c];
            if (id === 0 || id === 6) continue;

            if (imageMap[id] && imageMap[id].src) {
                ctx.drawImage(imageMap[id], c*size, r*size, size, size);
            }

        }
    }

    for (const p of platforms){
        if(imageMap[6]){
            ctx.drawImage(imageMap[6], p.x, p.y, p.width, p.height);
        }
    }
    
    // 2. 绘制玩家
    ctx.drawImage(player.value.img, player.value.x, player.value.y, player.value.width, player.value.height);
}

function gameLoop() {
    updatePlatforms();   // 先更新平台并把玩家随平台移动（若在平台上）
    updatePhysics();
    draw();
    animationFrameId = requestAnimationFrame(gameLoop);
}

// --- 交互控制 ---
function handleKeydown(e) {
    if(e.key.toLowerCase() === 'w') keys.w = true;
    if(e.key.toLowerCase() === 'a') keys.a = true;
    if(e.key.toLowerCase() === 'd') keys.d = true;
}

function handleKeyup(e) {
    if(e.key.toLowerCase() === 'w') keys.w = false;
    if(e.key.toLowerCase() === 'a') keys.a = false;
    if(e.key.toLowerCase() === 'd') keys.d = false;
}

function togglePause() {
    isPaused.value = !isPaused.value; 
}


function nextLevel() {
    if (currentLevel.value < totalLevels) {
        currentLevel.value++;
        initLevel(currentLevel.value);
    }
}

function finish() {
    finishFlag.value = false;
    // 确保完全停止所有游戏循环
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    stopTimer();

    // 这里应跳转到排行榜，暂时回主页
    switchView(MainView);
}

function handleGameOverOK() {
    gameOverFlag.value = false;
    // 确保完全停止所有游戏循环
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    stopTimer();
    // 重新初始化游戏
    currentLevel.value = 1;
    initLevel(1);
}

onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);
    
    // 预加载图片后开始
    preloadImages().then(() => {
        console.log("Images preloaded in GameView.");
        initLevel(currentLevel.value);
    });
});

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('keyup', handleKeyup);
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    stopTimer();
})
</script>

<style scoped>
.game-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #f0f0f0;
    height: 100vh;
    padding: 20px;
}

.hud {
    display: flex;
    justify-content: space-between;
    width: 1200px;
    font-size: 1.5rem;
    font-weight: bold;
    margin-bottom: 10px;
    background: #333;
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
}

.game-area {
    position: relative;
    border: 2px solid #333;
    background: white;
}

.overlay {
    position: absolute;
    top: 0; left: 0;
    width: 100%; height: 100%;
    background: rgba(0,0,0,0.7);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10;
}

.overlay h2 {
    font-size: 3rem;
    margin-bottom: 20px;
}

.controls {
    margin-top: 20px;
    display: flex;
    gap: 20px;
}
</style>
