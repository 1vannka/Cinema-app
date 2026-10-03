import { createApp } from 'vue';

export function initHeaderApp() {
    createApp({
        data() {
            return {
                currentPath: window.location.pathname.split('/').pop() || 'index.hbs'
            };
        },
        computed: {
            isMainPageActive() {
                return this.currentPath === 'index.hbs';
            }
        }
    }).mount('#main-header');
}