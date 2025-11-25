<template>
    <!-- <router-view></router-view> -->
    <component :is="currentView"></component>



</template>

<script setup>
    import {ref, reactive, shallowRef, provide} from 'vue'
    import MainView from '@/views/MainView.vue'

    let currentView = shallowRef(null)
    currentView.value = MainView
    function switchView(viewName){
        currentView.value = viewName
        console.log("change view to ", viewName)

    }
    provide('switchView', switchView)
    provide('totalLevels', 3)

</script>