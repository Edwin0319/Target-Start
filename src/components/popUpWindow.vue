<template>
<div v-if="props.caution" class="caution">
    <div class="caution-info">
        <div class="caution-info-text mg-b-m">
        <slot name="info"></slot>
        </div>
        <div class="caution-btns">
            <slot name="button"></slot>
        </div>
    </div>
</div>

</template>

<script setup>
import { ref, inject } from 'vue'
const props = defineProps({
    caution: {
        type: Boolean,
        required: true
    }
})
</script>

<style scoped>

.caution {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1001;
}

.caution-info {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #ccc;
    padding: 2.2rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    z-index: 1002;
}

.caution-info-text{
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
}

.caution-btns{
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.1rem;
}
</style>