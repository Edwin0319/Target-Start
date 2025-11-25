<template>
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
            <button class="btn">Play Demo</button>
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

// level地图数据状态
const maps = ref(Array(totalLevels).fill(null))
// 当前选中的工具ID
const currentToolId = ref(null)

// 计算属性：获取当前关卡的地图数据
const currentMapData = computed(() => maps.value[activeLevel.value]);

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
    switchView(MainView)
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
    maps.value = [...maps.value];
}

// 初始化地图数据的函数
function initializeMapData() {
    const col = horizontal_quantity.value;
    const row = vertical_quantity.value;

    for(let level = 1; level <= totalLevels; level++) {
        const levelMap = [];
        for(let r = 0; r < row; r++){
            const rowData = [];
            for(let c = 0; c < col; c++){
                if(r === row - 1){
                    rowData.push(3); // 最底行放置地面块
                } else {
                    rowData.push(0); // 其他位置为空
                }
            }
            levelMap.push(rowData);
        }
        maps.value[level] = levelMap;
    }
}

onMounted(() => {
    initializeMapData();
})

</script>

<style scoped>
    @import "@/assets/styles/MapEditorView.css";
</style>