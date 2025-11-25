import {createRouter, createWebHashHistory} from 'vue-router';

const routes = [
    {
        path: '/',
        alias: '/home',
        component: () => import('@/views/MainView.vue')
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

export default router;