import { createApp, ref, onMounted } from 'vue';

export function initNewsApp() {
    createApp({
        setup() {
            const posts = ref([]);
            const isLoading = ref(true);
            const error = ref(null);

            const loadNews = async () => {
                isLoading.value = true;
                error.value = null;
                const startPos = Math.floor(Math.random() * 90);
                const urlPosts = `https://jsonplaceholder.typicode.com/posts?_start=${startPos}&_limit=2`;

                try {
                    const response = await fetch(urlPosts);
                    if (!response.ok) throw new Error(`Ошибка: ${response.status}`);

                    const postsData = await response.json();

                    const postsWithComments = await Promise.all(postsData.map(async (post) => {
                        let comments = [];
                        try {
                            const commentsUrl = `https://jsonplaceholder.typicode.com/comments?postId=${post.id}&_limit=2`;
                            const commentsResp = await fetch(commentsUrl);
                            if (commentsResp.ok) {
                                comments = await commentsResp.json();
                            }
                        } catch (e) {
                            console.warn(`Не удалось загрузить комментарии для поста ${post.id}`, e);
                        }

                        return { ...post, comments };
                    }));

                    posts.value = postsWithComments;

                } catch (err) {
                    console.error(err);
                    error.value = "Не удалось загрузить новости";
                } finally {
                    isLoading.value = false;
                }
            };

            onMounted(() => {
                loadNews();
            });

            return {
                posts,
                isLoading,
                error
            };
        }
    }).mount('#news-widget-app');
}