import { createApp, ref, computed, onMounted } from 'vue';

export function initReviewsApp() {
    const widget = document.getElementById('reviews-widget');
    if (!widget) return;

    const currentUserId = parseInt(widget.dataset.userId) || null;
    const isAdminUser = widget.dataset.isAdmin === 'true';

    createApp({
        setup() {
            const reviews = ref([]);
            const isLoading = ref(true);
            const notification = ref({ show: false, author: '' });

            const hasReviews = computed(() => reviews.value.length > 0);

            const isAuthor = (authorId) => currentUserId === authorId;

            const confirmDelete = (event) => {
                if (!confirm('Точно удалить этот отзыв?')) {
                    event.preventDefault();
                }
            };

            const loadReviews = async () => {
                try {
                    const res = await fetch('/reviews');
                    if (res.ok) {
                        reviews.value = await res.json();
                    }
                } catch (e) {
                    console.error("Ошибка загрузки", e);
                } finally {
                    isLoading.value = false;
                }
            };

            const showToast = (authorName) => {
                notification.value.author = authorName;
                notification.value.show = true;
                setTimeout(() => { notification.value.show = false; }, 4000);
            };

            const initSSE = () => {
                const eventSource = new EventSource('/reviews/stream');

                eventSource.onmessage = (event) => {
                    const newReview = JSON.parse(event.data);
                    if (!reviews.value.find(r => r.id === newReview.id)) {
                        reviews.value.unshift(newReview);

                        if (newReview.userId !== currentUserId) {
                            const author = newReview.user?.name || newReview.user?.login;
                            showToast(author);
                        }
                    }
                };
            };

            const formatDate = (isoDate) => {
                return new Date(isoDate).toLocaleString('ru-RU', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                });
            };

            onMounted(() => {
                loadReviews();
                initSSE();
            });

            return {
                reviews,
                notification,
                isLoading,
                hasReviews,
                isAdminUser,
                isAuthor,
                confirmDelete,
                formatDate
            };
        }
    }).mount('#reviews-widget');
}