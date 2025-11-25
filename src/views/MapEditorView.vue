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
                <li>
                    <img src="@/assets/images/spawn-point.svg" alt="Spawn Point" title="Spawn Point"/>
                </li>
                <li>
                    <img src="@/assets/images/star.svg" alt="Star" title="Star"/>
                </li>
                <li>
                    <img src="@/assets/images/base-blocks.svg" alt="Base Blocks" title="Base Blocks"/>
                </li>
                <li>
                    <img src="@/assets/images/jump-spring.svg" alt="Jump Spring" title="Jump Spring"/>
                </li>
                <li>
                    <img src="@/assets/images/sloped-blocks.svg" alt="Sloped Blocks" title="Sloped Blocks"/>
                </li>
                <li>
                    <img src="@/assets/images/moving-platform.svg" alt="Moving Platform" title="Moving Platform"/>
                </li>
                <li>
                    <img src="@/assets/images/remove-tool.svg" alt="Remove Tool" title="Remove Tool"/>
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
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, inject, computed } from 'vue'
import "@/assets/styles/MapEditorView.css"
import MainView from '@/views/MainView.vue'
import MapEditorCanvas from '@/components/MapEditorCanvas.vue'
import { element_volume, vertical_quantity, horizontal_quantity, canvas_width, canvas_height } from '@/components/CanvasOperation.js'

const isMenuOpen = ref(false)
const activeLevel = ref(1) // 默认激活第一关
const switchView = inject('switchView')
const totalLevels = inject('totalLevels')

// level地图数据状态
const maps = ref(Array(totalLevels).fill(null))

// 计算属性：获取当前关卡的地图数据
const currentMapData = computed(() => maps.value[activeLevel.value]);

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