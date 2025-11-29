<template>
    <div class="game-container">
        <div class="hud">
            <div class="hud-item">Level: {{ currentLevel }}</div>
            <div class="hud-item timer">{{ formattedTime }}</div>
            <div class="hud-item">HP: {{ hitPoints }}</div>
        </div>

        <div class="game-area">
            <canvas ref="gameCanvas" width="1200" height="650"></canvas>
            
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
            <button class="btn" @click="confirmHome">Home</button>
            <button class="btn" @click="togglePause">{{ isPaused ? 'Resume' : 'Pause' }}</button>
        </div>
    </div>
</template>

<script setup>
import { ref, inject, onMounted, onUnmounted, computed } from 'vue'
import MainView from '@/views/MainView.vue'
import { element_volume, preloadImages } from '@/components/CanvasOperation.js'
// 导入图片资源用于绘制
import starImg from '@/assets/images/star.svg'
import baseImg from '@/assets/images/base-blocks.svg'
import playerImg from '@/assets/images/spawn-point.svg' // 暂时用出生点图代替玩家，建议换成专用角色图

const switchView = inject('switchView')
const globalMaps = inject('globalMaps')
const totalLevels = inject('totalLevels')

// 游戏状态
const currentLevel = ref(1)
const hitPoints = ref(3)
const isPaused = ref(false)
const isGameWon = ref(false)
const gameCanvas = ref(null)

// 计时器状态
const startTime = ref(0)
const elapsedTime = ref(0)
const timerInterval = ref(null)

// 玩家物理属性
const player = ref({
    x: 0, y: 0,
    width: 40, height: 40, // 略小于格子(50px)以方便通过
    vx: 0, vy: 0,
    speed: 5, jumpStrength: -12,
    grounded: false
})
const gravity = 0.6
const friction = 0.8

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
            if(id === 1) { // Spawn Point [cite: 92]
                player.value.x = c * 50 + 5; // 居中一点
                player.value.y = r * 50 + 5;
                spawnFound = true;
                runtimeMap[r][c] = 0; // 游戏中不显示出生点图标
            } else if (id === 2) { // Star
                totalStars++;
            }
        }
    }

    if(!spawnFound) {
        // 默认位置
        player.value.x = 50; player.value.y = 50; 
    }
    
    player.value.vx = 0;
    player.value.vy = 0;
    isGameWon.value = false;
    isPaused.value = false;
    elapsedTime.value = 0;
    startTimer();
    gameLoop();
}

// --- 物理与碰撞逻辑 [cite: 101] ---
function updatePhysics() {
    if (isPaused.value || isGameWon.value) return;

    // 1. 水平移动
    if (keys.a) player.value.vx -= 1;
    if (keys.d) player.value.vx += 1;
    
    player.value.vx *= friction; // 摩擦力
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
    if (player.value.y > 700) {
        handleDeath();
    }
}

// 简单的 AABB 碰撞检测
function checkCollision(axis) {
    const size = 50; // 格子大小
    // 计算玩家占据的网格范围
    const leftCol = Math.floor(player.value.x / size);
    const rightCol = Math.floor((player.value.x + player.value.width) / size);
    const topRow = Math.floor(player.value.y / size);
    const bottomRow = Math.floor((player.value.y + player.value.height) / size);

    // 遍历玩家接触到的所有格子
    for (let r = topRow; r <= bottomRow; r++) {
        for (let c = leftCol; c <= rightCol; c++) {
            // 越界保护
            if (!runtimeMap[r] || runtimeMap[r][c] === undefined) continue;
            
            const tileId = runtimeMap[r][c];

            // --- 实体碰撞 (墙壁) ---
            // ID 3: Base, ID 6: Platform (简化为方块), ID 5: Slope (这里简化为方块)
            if (tileId === 3 || tileId === 6 || tileId === 5) {
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
                } else {
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

            // --- 道具交互 ---
            // ID 2: Star [cite: 23, 24]
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
    isGameWon.value = true;
    stopTimer();
    // 胜利提示逻辑已通过 template 的 v-if="isGameWon" 实现
}

function handleDeath() {
    // 扣除生命值 [cite: 95]
    hitPoints.value--;
    if (hitPoints.value > 0) {
        // 重生逻辑：不仅重置位置，还要保持当前时间
        // 简单处理：重新读取地图找出生点
        const sourceMap = globalMaps.value[currentLevel.value];
        for(let r=0; r<sourceMap.length; r++){
            for(let c=0; c<sourceMap[r].length; c++){
                if(sourceMap[r][c] === 1) {
                    player.value.x = c * 50 + 5;
                    player.value.y = r * 50 + 5;
                    player.value.vx = 0; 
                    player.value.vy = 0;
                    return;
                }
            }
        }
        // 如果没找到出生点（被删了），回原点
        player.value.x = 50; player.value.y = 50; player.value.vy=0;
    } else {
        alert("Game Over! Retrying Level 1...");
        currentLevel.value = 1;
        hitPoints.value = 3;
        initLevel(1);
    }
}

// --- 渲染循环 ---
const imgs = {
    2: new Image(), // Star
    3: new Image(), // Base
    4: new Image(), // Spring
    5: new Image(), // Slope
    6: new Image()  // Platform
};
// 简单的图片加载映射（实际项目中应复用 CanvasOperation 的资源）
imgs[2].src = starImg;
imgs[3].src = baseImg;

function draw() {
    const ctx = gameCanvas.value.getContext('2d');
    const size = 50;
    
    // 清空
    ctx.clearRect(0, 0, 1200, 650);
    
    // 1. 绘制地图
    for(let r=0; r<runtimeMap.length; r++){
        for(let c=0; c<runtimeMap[r].length; c++){
            const id = runtimeMap[r][c];
            if (id === 0) continue;
            
            if (imgs[id] && imgs[id].src) {
                ctx.drawImage(imgs[id], c*size, r*size, size, size);
            } else {
                // 没图的时候用色块代替，保证可玩性
                ctx.fillStyle = id === 3 ? '#666' : 'orange';
                ctx.fillRect(c*size, r*size, size, size);
            }
        }
    }
    
    // 2. 绘制玩家 [cite: 19]
    ctx.fillStyle = '#3498db'; // 玩家颜色
    ctx.fillRect(player.value.x, player.value.y, player.value.width, player.value.height);
}

function gameLoop() {
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

function confirmHome() {
    if(confirm("Do you want to return?")) { 
        switchView(MainView);
    }
}

function nextLevel() {
    if (currentLevel.value < totalLevels) {
        currentLevel.value++;
        initLevel(currentLevel.value);
    } else {
        alert("You finished all levels!"); 
        // 这里应跳转到排行榜，暂时回主页
        switchView(MainView);
    }
}

onMounted(() => {
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('keyup', handleKeyup);
    
    // 预加载图片后开始
    preloadImages(() => {
        initLevel(currentLevel.value);
    });
})

onUnmounted(() => {
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('keyup', handleKeyup);
    cancelAnimationFrame(animationFrameId);
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