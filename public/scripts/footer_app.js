import { createApp } from 'vue';

export function initFooterApp() {
    const mountElement = document.getElementById('footer_app');
    const rawServerElapsedMs = mountElement?.dataset?.serverElapsedMs;
    const parsedServerElapsedMs = Number.parseFloat(rawServerElapsedMs ?? '');

    createApp({
        data() {
            return {
                loadTime: null,
                serverLoadTime: Number.isFinite(parsedServerElapsedMs)
                    ? (parsedServerElapsedMs / 1000).toFixed(3)
                    : null,
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