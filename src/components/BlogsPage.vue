<template>
  <div class="blogs-page">
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Subpage Header -->
      <div class="subpage-header" style="margin-bottom: 4px;">
        <a href="#/discover" class="back-btn" title="Back to Discover">
          <ArrowLeftIcon :size="18" />
        </a>
        <h3>{{ t('blogs.title') }}</h3>
      </div>

      <!-- Search Box (optional, but nice to have) -->
      <div class="search-input-wrapper" style="margin-bottom: 4px;">
        <SearchIcon :size="16" />
        <input 
          type="text" 
          v-model="searchQuery" 
          :placeholder="t('blogs.searchPlaceholder')" 
        />
      </div>

      <!-- Vertical Blogs Scroll List -->
      <div class="vertical-list-container" style="margin-bottom: 24px;">
        <div 
          v-for="blog in filteredBlogs" 
          :key="blog.id" 
          class="blog-card-large"
          @click="openBlog(blog)"
        >
          <!-- Side Thumbnail Image -->
          <div class="blog-card-large-img">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width: 52px; height: 52px;">
              <rect width="100" height="100" rx="12" fill="rgba(170, 185, 82, 0.08)" />
              <path d="M35 70V30C35 28 37 26 39 26H65M35 34H65M35 48H55M35 62H65" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" fill="none" />
              <circle cx="65" cy="26" r="4" fill="var(--accent-secondary)" />
              <path d="M50 75 L50 65 Q50 55 60 60" stroke="var(--c-light-green-yellow)" stroke-width="3" stroke-linecap="round" fill="none" />
            </svg>
          </div>
          
          <!-- Article Details -->
          <div class="blog-card-large-details">
            <div>
              <span class="blog-card-large-title">{{ blog.title }}</span>
              <span class="blog-card-large-excerpt">{{ blog.excerpt }}</span>
            </div>
            <div class="blog-card-large-footer">
              <span>{{ t('blogs.byAuthor', { author: blog.author }) }}</span>
              <span style="background: rgba(255, 255, 255, 0.04); padding: 2px 6px; border-radius: 4px;">
                {{ blog.readTime }}
              </span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredBlogs.length === 0" class="empty-state glass-card">
          <BookOpenIcon :size="48" class="empty-icon" />
          <h4>{{ t('blogs.noGuidesFound') }}</h4>
          <p>{{ t('blogs.clearSearch') }}</p>
        </div>
      </div>
    </div>

    <!-- ================= DETAIL MODAL ================= -->
    <div v-if="showArticleModal" class="modal-overlay animate-fade-in" @click.self="showArticleModal = false">
      <div class="modal-content glass-panel animate-slide-up" v-if="selectedArticle">
        <div class="modal-header">
          <h2>{{ selectedArticle.title }}</h2>
          <button class="close-btn" @click="showArticleModal = false">
            <XIcon :size="20" />
          </button>
        </div>
        <div class="modal-body modal-article-body" v-html="selectedArticle.content">
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  ArrowLeft as ArrowLeftIcon,
  Search as SearchIcon,
  BookOpen as BookOpenIcon,
  X as XIcon
} from '@lucide/vue';
import { getBlogs } from '../utils/db';
import { useI18n } from '../utils/i18n';

const { t } = useI18n();

const searchQuery = ref('');
const showArticleModal = ref(false);
const selectedArticle = ref(null);
const blogs = ref([]);

async function loadBlogs() {
  const data = await getBlogs();
  blogs.value = data.map(b => ({
    ...b,
    readTime: b.read_time
  }));
}

onMounted(() => {
  loadBlogs();
});

function openBlog(blog) {
  selectedArticle.value = blog;
  showArticleModal.value = true;
}

const filteredBlogs = computed(() => {
  return blogs.value.filter(blog => {
    return blog.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
           blog.excerpt.toLowerCase().includes(searchQuery.value.toLowerCase());
  });
});
</script>

<style scoped>
.blogs-page {
  display: flex;
  flex-direction: column;
}
</style>
