import { createApp } from 'vue';

export function initNavApp() {
    createApp({
        data() {
            return {
                links: [
                    { url: '/movies', text: 'Афиша' },
                    { url: '/#movies', text: 'Фильмы' },
                    { url: '/#daymovie', text: 'Фильм дня' },
                    { url: '/#genres', text: 'Жанры' },
                    { url: '/feedback', text: 'Отзывы' },
                    { url: '/about', text: 'О нас' }
                ]
            };
        },
        methods: {
            resolvePath(url) {

                return url;
            },

            isActive(url) {
                if (url.includes('#')) {
                    return false;
                }

                const currentPath = window.location.pathname;

                return currentPath === url;
            }
        }
    }).mount('#nav-app');
}