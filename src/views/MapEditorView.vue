<template>
    <div v-if="caution" class="caution">
        <div class="caution-info">
            <p>Map changes are not saved.</p>
            <p class="mg-b-m">Do you want to return?</p>
            <button @click="caution = false" class="btn mg-r-m">No</button>
            <button @click="switchView(MainView)" class="btn">Yes</button>
        </div>
    </div>
    <div class="menu-container">
        <img src="@/assets/images/menu.png" class="menu" :class="{ 'menu-open': isMenuOpen }" @click="toggleMenu"/>
        <div class="menu-options" :class="{ 'menu-options-active': isMenuOpen }">
            <ul>
                <li v-for="level in totalLevels" :key="level">
                    <button 
                        class="btn level-choice" 
                        :class="{ 'btn-active': activeLevel === level }"
                        @click="switchLevel(level)"
                    >
                        Level {{ level }}
                    </button>
                </li>
                <li><button class="btn mg-t-m" @click="goHome">Home</button></li>
                <li><button class="btn">Load</button></li>
                <li><button class="btn">Export</button></li>
            </ul>
        </div>
    </div>

    <div class="main mg-b-m">
        <div class="sidebar">
            <button class="btn" @click="playDemo">Play Demo</button>
            <ul class="tool-list">
                <li
                    v-for="tool in tools"
                    :key="tool.id"
                    :class="{ 'tool-active': currentToolId === tool.id }"
                    @click="selectTool(tool.id)"
                >
                    <img :src="tool.icon" :alt="tool.name" :title="tool.name"/>
                </li>
            </ul>
        </div>
        <div class="map-editor-area">
            <h2>Map Editor - Level {{ activeLevel }}</h2>
            <div class="map-editor-canvas">
                <MapEditorCanvas 
                :level="activeLevel"
                :key="activeLevel"
                :mapData="currentMapData"
                :activeTool="currentToolId"
                @update-tile="handleUpdateTile"
                @cancel-tool="currentToolId = null"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, inject, computed, onMounted } from 'vue'
import "@/assets/styles/MapEditorView.css"
import MainView from '@/views/MainView.vue'
import MapEditorCanvas from '@/components/MapEditorCanvas.vue'
import GameView from '@/views/GameView.vue'
import { element_volume, vertical_quantity, horizontal_quantity, canvas_width, canvas_height } from '@/components/CanvasOperation.js'

import spawnImg from '@/assets/images/spawn-point.svg'
import starImg from '@/assets/images/star.svg'
import baseImg from '@/assets/images/base-blocks.svg'
import springImg from '@/assets/images/jump-spring.svg'
import slopeImg from '@/assets/images/sloped-blocks.svg'
import platformImg from '@/assets/images/moving-platform.svg'
import removeImg from '@/assets/images/remove-tool.svg'

const isMenuOpen = ref(false)
const activeLevel = ref(1) // 默认激活第一关
const switchView = inject('switchView')
const totalLevels = inject('totalLevels')
const caution = ref(false)
const globalMaps = inject('globalMaps')
// 当前选中的工具ID
const currentToolId = ref(null)

// 计算属性：获取当前关卡的地图数据
const currentMapData = computed(() => globalMaps.value[activeLevel.value]);

// 工具列表配置
const tools = [
    { id: 1, name: 'Spawn Point', icon: spawnImg },
    { id: 2, name: 'Star', icon: starImg },
    { id: 3, name: 'Base Blocks', icon: baseImg },
    { id: 4, name: 'Jump Spring', icon: springImg },
    { id: 5, name: 'Sloped Blocks', icon: slopeImg },
    { id: 6, name: 'Moving Platform', icon: platformImg },
    { id: 'remove', name: 'Remove Tool', icon: removeImg }
]

function selectTool(id) {
    currentToolId.value = id;
}

function toggleMenu() {
    isMenuOpen.value = !isMenuOpen.value
}

function switchLevel(level) {
    activeLevel.value = level
    console.log("switching to level ", level)
}

function goHome() {
    caution.value = true
    isMenuOpen.value = false
}

// 更新地图数据
function handleUpdateTile({ row, col, toolId }) {
    if (!currentMapData.value) return;

    // 如果放置的是 Spawn Point (ID 1)，先移除已存在的
    if (toolId === 1) {
        for(let r = 0; r < currentMapData.value.length; r++){
            for(let c = 0; c < currentMapData.value[r].length; c++){
                if(currentMapData.value[r][c] === 1) {
                    currentMapData.value[r][c] = 0;
                }
            }
        }
    }
    
    // 设置新值
    if (toolId === 'remove') {
        currentMapData.value[row][col] = 0;
    } 
    else {
        currentMapData.value[row][col] = toolId;
    }
    
    // 触发更新
    globalMaps.value = [...globalMaps.value];
}

function playDemo() {
    // 1. 简单的合法性检查 (可选)：必须有出生点 (ID: 1) 才能开始
    // 文档要求：至少一个 Start (Spawn Point) 和一个 Star 
    // 这里为了方便调试，只检查是否有 Spawn Point，或者直接跳转
    const hasSpawn = currentMapData.value.some(row => row.includes(1));
    if (!hasSpawn) {
        alert("Please place a Spawn Point (Character) first!");
        return;
    }
    

    // 2. 跳转到游戏页面
    // 注意：目前的 GameView 默认从第1关开始。
    // 如果想要直接测试当前编辑的关卡，可能需要修改 GameView 来接收参数，
    // 或者利用全局状态。但在当前简单的架构下，直接跳转即可。
    switchView(GameView);
}


</script>

<style scoped>
    @import "@/assets/styles/MapEditorView.css";
</style>