<template>
    <!-- <router-view></router-view> -->
    <component :is="currentView"></component>



</template>

<script setup>
    import {ref, reactive, shallowRef, provide, onMounted } from 'vue'
    import MainView from '@/views/MainView.vue'
    import { vertical_quantity, horizontal_quantity } from '@/components/CanvasOperation.js'

    let currentView = shallowRef(null)
    currentView.value = MainView
    function switchView(viewName){
        currentView.value = viewName
        console.log("change view to ", viewName)

    }
    // 定义全局地图数据
    const totalLevels = 3;
    const maps = ref(Array(totalLevels + 1).fill(null));

    // 初始化地图数据的函数
    function initializeMapData() {
        const col = horizontal_quantity.value;
        const row = vertical_quantity.value;
        for(let level = 1; level <= totalLevels; level++) {
            const levelMap = [];
            for(let r = 0; r < row; r++){
                const rowData = [];
                for(let c = 0; c < col; c++){
                    // 默认只有最底层是地板(ID: 3)
                    rowData.push(r === row - 1 ? 3 : 0); 
                }
                levelMap.push(rowData);
            }
            maps.value[level] = levelMap;
        }
    }
    onMounted(() => {
        initializeMapData();
    })
    provide('switchView', switchView)
    provide('totalLevels', 3)
    provide('globalMaps', maps)

</script>