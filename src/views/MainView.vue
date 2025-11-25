<template>
    <div class="main">
        <h1>Target Start</h1>
        <button class="btn" @click="switchView(MapEditorView)">Map Editor</button>
        <button class="btn" @click="switchView(InstructionsView)">Instructions</button>
        <button class="btn" @click="switchView(LoadMapFileView)">Load Map File</button>
    </div>
</template>

<script setup>
    import {ref, reactive, inject, onMounted} from 'vue'
    import MapEditorView from '@/views/MapEditorView.vue'
    import InstructionsView from '@/views/InstructionsView.vue'
    import LoadMapFileView from '@/views/LoadMapFileView.vue'
    let switchView = inject('switchView')


</script>

<style scoped>
    @import "@/assets/styles/MainView.css";
</style>