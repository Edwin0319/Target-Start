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
    const currentValid = ref(true)

    function checkPlacementValidity(row, col, toolId){
        if (!toolId) return false;
        if (toolId === 'remove') return true; // 删除工具总是有效
        const rows = props.mapData.length;
        const cols = props.mapData[0].length;

        // 边界与占用检查辅助函数
        const isOccupied = (r, c) => {
            if (r < 0 || r >= rows || c < 0 || c >= cols) return true; // 超出边界视为被占用
            if(props.mapData[r][c-1] === 6 || props.mapData[r][c+1] === 6) return true;
            return props.mapData[r][c] !== 0;
        };

        if (toolId === 6) { 
            // 移动平台 (ID 6): 检查 左(col-1), 中(col), 右(col+1)
            if (col - 1 < 0 || col + 1 >= cols) return false;
            
            if (isOccupied(row, col-1) || isOccupied(row, col) || isOccupied(row, col+1)) {
                return false;
            }
        } 
        // 星星数量限制 (ID 2)
        else if (toolId === 2) {
            let starCount = 0;
            for(let r = 0; r < rows; r++) {
                for(let c = 0; c < cols; c++) {
                    if (props.mapData[r][c] === 2) starCount++;
                }
            }
            if (starCount >= 3 || isOccupied(row, col)) return false;
        }
        else {
            // 普通物品
            if (isOccupied(row, col)) return false;
        }
        return true;
    }

    function onMouseMove(event){
        isHovering.value = true;
        const pos = handleMouseMove(event, canvasRef);
        if (pos) {
            // 计算当前位置是否有效
            const isValid = checkPlacementValidity(pos.row, pos.col, props.activeTool);
            currentValid.value = isValid;

            mousePos.value = pos;
            // 实时重绘：绘制地图 + 预览图
            drawCanvas(canvasRef, props.level, props.mapData, {
                col: pos.col,
                row: pos.row,
                toolId: props.activeTool,
                isValid: isValid
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
            // 红色的则不执行
            if(currentValid.value){
                emit('update-tile', {
                    row: mousePos.value.row,
                    col: mousePos.value.col,
                    toolId: props.activeTool
                });
            }
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
        const isValid = isHovering.value ? checkPlacementValidity(mousePos.value.row, mousePos.value.col, props.activeTool) : true;
        currentValid.value = isValid;

        // 如果鼠标正在悬停，保持预览
        const preview = isHovering.value ? {
            col: mousePos.value.col,
            row: mousePos.value.row,
            toolId: props.activeTool,
            isValid: isValid
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