<template>
    <div class="instructions-container">
        <h1>How to Play</h1>

        <div class="content-wrapper">
            <div class="instruction-section">
                <h2>Goal</h2>
                <p>Control the character to navigate through the level.</p>
                <div class="image-text-group">
                    <img :src="starImg" alt="Star" class="icon" />
                    <span>Collect all <strong>Stars</strong> to win the level!</span>
                </div>
            </div>

            <div class="instruction-section">
                <h2>Controls</h2>
                <ul class="controls-list">
                    <li><strong>A</strong> : Move Left</li>
                    <li><strong>D</strong> : Move Right</li>
                    <li><strong>W</strong> : Jump</li>
                </ul>
            </div>
        </div>

        <button class="btn" @click="goHome">Home</button>
    </div>
</template>

<script setup>
    import { inject } from 'vue'
    import MainView from '@/views/MainView.vue'
    import starImg from '@/assets/images/star.svg'

    // 注入全局导航方法
    const switchView = inject('switchView')

    function goHome() {
        switchView(MainView)
    }
</script>

<style scoped>
    .instructions-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 2rem;
        background-color: #f5f5f5;
        gap: 2rem;
    }

    h1 {
        font-size: 2.5rem;
        color: #333;
    }

    .content-wrapper {
        display: flex;
        flex-direction: column;
        gap: 2rem;
        background: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        max-width: 600px;
        width: 100%;
    }

    .instruction-section h2 {
        border-bottom: 2px solid #eee;
        padding-bottom: 0.5rem;
        margin-bottom: 1rem;
        color: #555;
    }

    .image-text-group {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-top: 1rem;
        font-size: 1.1rem;
    }

    .icon {
        width: 50px;
        height: 50px;
    }

    .controls-list {
        list-style: none;
        padding: 0;
    }

    .controls-list li {
        margin-bottom: 0.5rem;
        font-size: 1.1rem;
    }

    strong {
        background-color: #eee;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        font-family: monospace;
    }
</style>