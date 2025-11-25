<template>
    <div class="canvas-wrapper">
        <div class="info-bar">
            <span v-if="isHovering">
                当前坐标: <strong>{{ mousePos.x }}px, {{ mousePos.y }}px</strong>
                | 网格位置: <strong>{{ mousePos.col }}, {{ mousePos.row }}</strong>
            </span>
            <span v-else>
                请移动鼠标到画布上
            </span>
        </div>

        <canvas 
            :id="`map-editor-canvas-${props.level}`" 
            ref="canvasRef"
            @mousemove="onMouseMove"
            @mouseleave="onMouseLeave"
        ></canvas>
    </div>
</template>

<script setup>
    import { ref, inject, onMounted, watch } from 'vue'
    import { drawCanvas, handleMouseMove } from '@/components/CanvasOperation.js'
    const props = defineProps({
        level: {
            type: Number,
            required: true
        }
    })
    const canvasRef = ref(null)
    const isHovering = ref(false)
    const mousePos = ref({ x: 0, y: 0, col: 0, row: 0 })

    function onMouseMove(event){
        isHovering.value = true;
        const pos = handleMouseMove(event, canvasRef);
        mousePos.value = pos;
    }

    function onMouseLeave() {
        isHovering.value = false;
        mousePos.value = { x: 0, y: 0, col: 0, row: 0 };
    }

    onMounted(() => {
        drawCanvas(canvasRef, props.level);
    })

    watch(() => props.level, (newLevel) => {
        drawCanvas(canvasRef, newLevel);
    })
</script>

<style scoped>
    .canvas-wrapper {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }

    .info-bar {
        background-color: #333;
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.8rem;
        min-height: 20px; /* 防止文字跳动 */
    }
    canvas {
        /* border: 1px solid black; */
        background-color: #fff;
        display: block;
    }
</style>