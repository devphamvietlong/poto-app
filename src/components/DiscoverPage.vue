<template>
  <div class="discover-page">
    <!-- Wrap only page content inside animate-fade-in to prevent containing block constraints on overlays -->
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Header -->
      <div class="section-header" style="margin-bottom: 4px;">
        <h3>{{ t('discover.title') }}</h3>
      </div>

      <!-- Blogs/Articles Horizontal Scroll Section -->
      <section class="blogs-section-scroll" style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h4 style="font-size: 14px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px; margin: 0;">
            <BookOpenIcon :size="16" class="text-accent" style="color: var(--accent);" />
            {{ t('discover.guidesHeader') }}
          </h4>
          <a href="#/blogs" style="font-size: 12px; color: var(--accent); font-weight: 500; text-decoration: none; display: flex; align-items: center; gap: 2px;">
            {{ t('discover.seeAll') }} &rarr;
          </a>
        </div>
        <div class="horizontal-scroll-container">
          <div 
            v-for="blog in blogs" 
            :key="blog.id" 
            class="scroll-card glass-card"
            style="padding: 14px; display: flex; flex-direction: column; justify-content: space-between;"
            @click="openBlog(blog)"
          >
            <div class="blog-card-header" style="display: flex; flex-direction: column; align-items: flex-start; gap: 8px;">
              <div class="blog-icon-box" style="margin: 0; background: rgba(213,209,112,0.08);">
                <BookOpenIcon :size="16" />
              </div>
              <span class="blog-title" style="font-size: 12.5px; font-weight: 600; line-height: 1.3; color: var(--text-primary); display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; white-space: normal;">
                {{ blog.title }}
              </span>
            </div>
            <div class="blog-card-footer" style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px; font-size: 10px; color: var(--text-muted);">
              <span>{{ t('blogs.byAuthor', { author: blog.author }) }}</span>
              <span style="background: rgba(255,255,255,0.04); padding: 2px 6px; border-radius: 4px;">{{ blog.readTime }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Community Events Horizontal Scroll Section -->
      <section class="events-section-scroll" style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h4 style="font-size: 14px; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 6px; margin: 0;">
            <GlobeIcon :size="16" class="text-accent" style="color: var(--accent);" />
            {{ t('discover.eventsHeader') }}
          </h4>
          <a href="#/events" style="font-size: 12px; color: var(--accent); font-weight: 500; text-decoration: none; display: flex; align-items: center; gap: 2px;">
            {{ t('discover.seeAll') }} &rarr;
          </a>
        </div>
        <div class="horizontal-scroll-container">
          <div 
            v-for="ev in communityEvents" 
            :key="ev.id" 
            class="scroll-card-event glass-card"
            style="padding: 14px; display: flex; flex-direction: column; justify-content: space-between;"
            @click="openEvent(ev)"
          >
            <div class="event-card-top" style="display: flex; flex-direction: column; gap: 8px; align-items: flex-start; width: 100%;">
              <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <div class="event-date-badge" style="width: 38px; height: 38px; border-radius: 8px;">
                  <span class="event-date-day" style="font-size: 13px;">{{ ev.day }}</span>
                  <span class="event-date-mon" style="font-size: 8px;">{{ formatMonth(ev) }}</span>
                </div>
                <span style="font-size: 9.5px; color: var(--text-muted); max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right;">{{ ev.host.split(' ')[0] }}</span>
              </div>
              <span class="event-title" style="font-size: 12.5px; font-weight: 600; line-height: 1.25; color: var(--text-primary); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; white-space: normal;">
                {{ ev.title }}
              </span>
            </div>
            
            <div class="event-card-bottom" style="display: flex; flex-direction: column; gap: 6px; margin-top: 4px;">
              <span class="event-sub" style="font-size: 9.5px; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ ev.location }}</span>
              <button 
                type="button"
                class="event-btn-action"
                :class="{ 'registered': isRegistered(ev.id) }"
                @click.stop="handleEventRegistration(ev.id)"
                style="padding: 5px 8px; font-size: 10px; width: 100%; text-align: center;"
              >
                {{ isRegistered(ev.id) ? t('discover.joined') : t('discover.rsvpCoins') }}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- ================= MODALS ================= -->
    <!-- 1. Blog Article Modal -->
    <div v-if="showArticleModal" class="modal-overlay animate-fade-in" @click.self="showArticleModal = false">
      <div class="modal-content glass-panel animate-slide-up" v-if="selectedArticle">
        <div class="modal-header">
          <h2>{{ selectedArticle.title }}</h2>
          <button class="close-btn" @click="showArticleModal = false"><XIcon :size="20" /></button>
        </div>
        <div class="modal-body modal-article-body" v-html="selectedArticle.content">
        </div>
      </div>
    </div>

    <!-- 2. Community Event Modal -->
    <div v-if="showEventModal" class="modal-overlay animate-fade-in" @click.self="showEventModal = false">
      <div class="modal-content glass-panel animate-slide-up" v-if="selectedEvent">
        <div class="modal-header">
          <h2>{{ selectedEvent.title }}</h2>
          <button class="close-btn" @click="showEventModal = false"><XIcon :size="20" /></button>
        </div>
        <div class="modal-body modal-article-body">
          <p><strong>{{ t('events.dateLabel') }}</strong> {{ formatFullDate(selectedEvent) }}</p>
          <p><strong>{{ t('events.locationLabel') }}</strong> {{ selectedEvent.location }}</p>
          <p><strong>{{ t('events.hostLabel') }}</strong> {{ selectedEvent.host }}</p>
          <br>
          <p>{{ selectedEvent.description }}</p>
          
          <div style="margin-top: 20px;">
            <button 
              class="btn-purchase" 
              :class="{ 'registered': isRegistered(selectedEvent.id) }"
              @click="handleEventRegistration(selectedEvent.id)"
            >
              {{ isRegistered(selectedEvent.id) ? t('discover.registered') : t('discover.registerBtn') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  BookOpen as BookOpenIcon,
  Globe as GlobeIcon,
  X as XIcon
} from '@lucide/vue';
import { getEvents, getEventRegistrations, getBlogs, rsvpToEvent } from '../utils/db';
import { useI18n } from '../utils/i18n';
import confetti from 'canvas-confetti';

const emit = defineEmits(['plantWatered']);
const { t, locale } = useI18n();

const showArticleModal = ref(false);
const showEventModal = ref(false);
const selectedArticle = ref(null);
const selectedEvent = ref(null);

const registeredEvents = ref([]);
const blogs = ref([]);
const communityEvents = ref([]);

function getDayAndMonth(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return { day: '15', month: 'Jun' };
    }
    const day = date.getDate().toString();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    return { day, month };
  } catch (e) {
    return { day: '15', month: 'Jun' };
  }
}

const formatMonth = (ev) => {
  try {
    const date = new Date(ev.event_date);
    if (isNaN(date.getTime())) return 'Jun';
    if (locale.value === 'vi') {
      return `T${date.getMonth() + 1}`;
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[date.getMonth()];
    }
  } catch (e) {
    return 'Jun';
  }
};

const formatFullDate = (ev) => {
  if (!ev) return '';
  try {
    const date = new Date(ev.event_date);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString(locale.value === 'vi' ? 'vi-VN' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return '';
  }
};

async function loadData() {
  const [eventsData, regsData, blogsData] = await Promise.all([
    getEvents(),
    getEventRegistrations(),
    getBlogs()
  ]);

  registeredEvents.value = regsData;
  blogs.value = blogsData.map(b => ({
    ...b,
    readTime: b.read_time
  }));
  communityEvents.value = eventsData.map(ev => {
    const { day, month } = getDayAndMonth(ev.event_date);
    return {
      ...ev,
      day,
      month
    };
  });
}

onMounted(() => {
  loadData();
});

function isRegistered(eventId) {
  return registeredEvents.value.includes(eventId);
}

async function handleEventRegistration(eventId) {
  if (isRegistered(eventId)) return;
  
  const result = await rsvpToEvent(eventId);
  if (result && result.success) {
    registeredEvents.value.push(eventId);
    emit('plantWatered'); // Triggers state refresh in parent App.vue
    
    confetti({
      particleCount: 100,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#D5D170', '#AAB952', '#7C9D39', '#528124']
    });

    alert(t('discover.registeredSuccess', { reward: result.event.coins_reward || 20 }));
  } else {
    alert(locale.value === 'vi' ? '❌ Đăng ký thất bại. Vui lòng thử lại sau.' : '❌ Registration failed. Please try again later.');
  }
}

function openBlog(blog) {
  selectedArticle.value = blog;
  showArticleModal.value = true;
}

// Open Community Event Modal
function openEvent(event) {
  selectedEvent.value = event;
  showEventModal.value = true;
}
</script>

<style scoped>
.discover-page {
  display: flex;
  flex-direction: column;
}
</style>
