<template>
<div v-if="props.caution" class="caution">
    <div class="caution-info">
        <slot name="info" class="caution-info-text"></slot>
        <!-- <p>Map changes are not saved.</p> -->
        <!-- <p class="mg-b-m">Do you want to return?</p> -->
        <slot name="button"></slot>
        <!-- <button @click="props.caution = false" class="btn mg-r-m">No</button>
        <button @click="switchView(MainView)" class="btn">Yes</button> -->
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
    text-align: center;
    font-weight: bold;
    font-size: 1.6rem;
}
</style>