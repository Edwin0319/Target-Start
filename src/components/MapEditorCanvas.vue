<template>
    <div class="canvas-wrapper">
        <div class="info-bar">
            <span v-if="isHovering">
                当前坐标: <strong>{{ mousePos.col }}, {{ mousePos.row }}</strong>
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
            @click="onCanvasClick"
            @contextmenu.prevent="onRightClick"
        ></canvas>
    </div>
</template>

<script setup>
    import { ref, inject, onMounted, watch } from 'vue'
    import { drawCanvas, handleMouseMove, preloadImages } from '@/components/CanvasOperation.js'
    const props = defineProps({
        level: {
            type: Number,
            required: true
        },
        mapData: {
            type: Array,
            default: () => []
        },
        // 接收当前选中的工具ID
        activeTool: { 
            type: [Number, String], default: null 
        }
    })
    const emit = defineEmits(['update-tile', 'cancel-tool'])
    const canvasRef = ref(null)
    const isHovering = ref(false)
    const mousePos = ref({ x: -1, y: -1, col: -1, row: -1 })

    function onMouseMove(event){
        isHovering.value = true;
        const pos = handleMouseMove(event, canvasRef);
        if (pos) {
            mousePos.value = pos;
            // 实时重绘：绘制地图 + 预览图
            drawCanvas(canvasRef, props.level, props.mapData, {
                col: pos.col,
                row: pos.row,
                toolId: props.activeTool
            });
        }
    }

    // 鼠标离开：重绘（无预览）
    function onMouseLeave() {
        isHovering.value = false;
        mousePos.value = { x: -1, y: -1, col: -1, row: -1 };
        drawCanvas(canvasRef, props.level, props.mapData, null);
    }

    // 鼠标左键点击：放置元素
    function onCanvasClick() {
        if (props.activeTool) {
            emit('update-tile', {
                row: mousePos.value.row,
                col: mousePos.value.col,
                toolId: props.activeTool
            });
        }
    }

    // 鼠标右键点击：退出放置状态
    function onRightClick() {
        emit('cancel-tool');
        // 立即重绘去除预览
        drawCanvas(canvasRef, props.level, props.mapData, null);
    }


    onMounted(() => {
        // 先加载图片，加载完后再绘制
        preloadImages(() => {
            drawCanvas(canvasRef, props.level, props.mapData);
        });
    })

    // 监听 mapData 变化，重新绘制
    watch(() => props.mapData, (newData) => {
        // 如果鼠标正在悬停，保持预览
        const preview = isHovering.value ? {
            col: mousePos.value.col,
            row: mousePos.value.row,
            toolId: props.activeTool
        } : null;
        
        drawCanvas(canvasRef, props.level, newData, preview);
    }, { deep: true })
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
        cursor: crosshair;
    }
</style>