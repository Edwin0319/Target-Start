// 引入图片资源
import spawnPointImg from '@/assets/images/spawn-point.svg';
import starImg from '@/assets/images/star.svg';
import baseBlockImg from '@/assets/images/base-blocks.svg';
import jumpSpringImg from '@/assets/images/jump-spring.svg';
import slopedBlockImg from '@/assets/images/sloped-blocks.svg';
import movingPlatformImg from '@/assets/images/moving-platform.svg';

// 建立 ID 到图片对象的映射
export const imageMap = {};
const imageSources = {
    1: spawnPointImg,
    2: starImg,
    3: baseBlockImg,
    4: jumpSpringImg,
    5: slopedBlockImg,
    6: movingPlatformImg
};

// 预加载图片函数
function preloadImages() {
    return new Promise((resolve, reject) => {
        let loadedCount = 0;
        const totalImages = Object.keys(imageSources).length;

        for (const [id, src] of Object.entries(imageSources)) {
            const img = new Image();
            img.src = src;
            // 图片加载完成回调
            img.onload = () => {
                loadedCount++;
                if (loadedCount === totalImages) {
                    resolve();
                }
            };
            imageMap[id] = img;
        }
    });

}


// properties
import { ref } from 'vue';
const element_volume = ref(50);
const vertical_quantity = ref(13);
const horizontal_quantity = ref(24);
const canvas_width = horizontal_quantity.value * element_volume.value;
const canvas_height = vertical_quantity.value * element_volume.value;

// canvasRef Canvas 引用
// level 当前关卡
// mapData 地图数据
// preview 预览对象 { col, row, toolId }
function drawCanvas(canvasRef, level, mapData, preview=null){
    if (!canvasRef.value) return;
    const canvas = canvasRef.value;
    const ctx = canvas.getContext('2d');
    if (canvas.width !== canvas_width) canvas.width = canvas_width;
    if (canvas.height !== canvas_height) canvas.height = canvas_height;
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 重新绘制
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // 绘制网格
    drawGrid(ctx, canvas.width, canvas.height);
    // 根据 mapData 绘制元素
    if (mapData && mapData.length > 0) {
        drawMapElements(ctx, mapData);
    }
    // 绘制鼠标预览
    if (preview && preview.col >= 0 && preview.row >= 0) {
        drawPreview(ctx, preview);
    }
    
    console.log(`Canvas redrawn for Level ${level}`);
}

 // 绘制单个预览单元
const drawUnit = (ctx, drawX, drawY, toolId, isValid) => {
    const size = element_volume.value;
    if (imageMap[toolId]) {
        ctx.save();
        ctx.globalAlpha = 0.5; // 半透明
        ctx.drawImage(imageMap[toolId], drawX, drawY, size, size);
        
        // 如果不可放置（被占用或超限），叠加红色
        if (isValid === false) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(drawX, drawY, size, size);
        }
        ctx.restore();
    }
};

// 绘制预览效果
function drawPreview(ctx, preview) {
    const size = element_volume.value;
    const x = preview.col * size;
    const y = preview.row * size;

    if (preview.toolId === 'remove') {
        // 删除工具：红色高亮 
        ctx.save();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, size, size);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(x, y, size, size);
        ctx.restore();
    }
    else{
        if(preview.toolId == 6){
            drawUnit(ctx, x, y, preview.toolId, preview.isValid);
            drawUnit(ctx, x-size, y, preview.toolId, preview.isValid);
            drawUnit(ctx, x+size, y, preview.toolId, preview.isValid);
        }
        else{
            drawUnit(ctx, x, y, preview.toolId, preview.isValid);
        }
    }
}

function drawMapElements(ctx, mapData) {
    const size = element_volume.value;
    
    for (let row = 0; row < mapData.length; row++) {
        for (let col = 0; col < mapData[row].length; col++) {
            const elementId = mapData[row][col];
            
            // 如果 ID 在 imageMap 中存在 (非0)
            if (imageMap[elementId]) {
                if(elementId == 6){
                    drawUnit(ctx, (col-1) * size, row * size, elementId, true);
                    drawUnit(ctx, (col+1) * size, row * size, elementId, true);
                }
                ctx.drawImage(
                    imageMap[elementId], 
                    col * size, 
                    row * size, 
                    size, 
                    size
                );
            }
        }
    }
}

function drawGrid(ctx, width, height) {
    const cellSize = element_volume.value;

    ctx.beginPath();
    ctx.strokeStyle = '#a0a0a0'; // 网格线色
    ctx.lineWidth = 1;

    // 垂直线
    for (let x = 0; x <= width; x += cellSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }

    // 水平线
    for (let y = 0; y <= height; y += cellSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }

    ctx.stroke(); // Apply the lines
}

function handleMouseMove(event, canvasRef) {
    if(!canvasRef.value) return null;
    const canvas = canvasRef.value;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);

    const col = Math.floor(x / element_volume.value);
    const row = Math.floor(y / element_volume.value);
    // 边界检查
    if (col < 0 || col >= horizontal_quantity.value || row < 0 || row >= vertical_quantity.value) {
        return null;
    }
    return {x, y, col, row};
}

 // 边界与占用检查辅助函数
function isOccupied(r, c, mapData) {
    const rows = mapData.length;
    const cols = mapData[0].length;
    if (r < 0 || r >= rows || c < 0 || c >= cols) return true; // 超出边界视为被占用
    if(mapData[r][c-1] && mapData[r][c-1] === 6 || mapData[r][c+1] && mapData[r][c+1] === 6) return true;
    if(mapData[r][c+1] && mapData[r][c+1] === 5 || 
        r+1 < rows && mapData[r+1][c+1] === 5 || 
        r+1 < rows && mapData[r+1][c] && mapData[r+1][c] === 5) return true;
    return mapData[r][c] !== 0;
}

function checkPlacementValidity(row, col, toolId, mapData){
    // toolId 为 null
    if (!toolId) return false;
    if (toolId === 'remove') return true; // 删除工具总是有效
    const rows = mapData.length;
    const cols = mapData[0].length;

    if (toolId === 6) { 
        // 移动平台 (ID 6): 检查 左(col-1), 中(col), 右(col+1)
        if (col - 1 < 0 || col + 1 >= cols) return false;
        
        if (isOccupied(row, col-1, mapData) || isOccupied(row, col, mapData) || isOccupied(row, col+1, mapData)) {
            return false;
        }
    } 
    // 星星数量限制 (ID 2)
    else if (toolId === 2) {
        let starCount = 0;
        for(let r = 0; r < rows; r++) {
            for(let c = 0; c < cols; c++) {
                if (mapData[r][c] === 2) starCount++;
            }
        }
        if (starCount >= 3 || isOccupied(row, col, mapData)) return false;
    }
    else if(toolId === 5){
        if(isOccupied(row, col, mapData)) return false;
        if(mapData[row][col-1] && mapData[row][col-1] === 5 || 
            row-1 >= 0 && mapData[row-1][col-1] === 5 || 
            row-1 >= 0 && mapData[row-1][col] && mapData[row-1][col] === 5 ||
            mapData[row][col-1] && mapData[row][col-1] === 5) return false;

    }
    else {
        // 普通物品
        if (isOccupied(row, col, mapData)) return false;
    }
    return true;
}


export { 
    drawCanvas, 
    handleMouseMove,
    preloadImages, 
    checkPlacementValidity, 
    isOccupied,
    element_volume, 
    vertical_quantity, 
    horizontal_quantity, 
    canvas_width, 
    canvas_height
};