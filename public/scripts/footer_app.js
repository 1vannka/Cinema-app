import { createApp } from 'vue';

export function initFooterApp() {
    createApp({
        data() {
            return {
                loadTime: null
            };
        },
        mounted() {
            window.addEventListener('load', () => {
                const sec = (performance.now() / 1000).toFixed(3);
                this.loadTime = sec;
            });
        }
    }).mount('#footer_app');
}