<template>
  <div class="events-page">
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Subpage Header -->
      <div class="subpage-header" style="margin-bottom: 4px;">
        <a href="#/discover" class="back-btn" title="Back to Discover">
          <ArrowLeftIcon :size="18" />
        </a>
        <h3>{{ t('events.title') }}</h3>
      </div>

      <!-- Search Box -->
      <div class="search-input-wrapper" style="margin-bottom: 4px;">
        <SearchIcon :size="16" />
        <input 
          type="text" 
          v-model="searchQuery" 
          :placeholder="t('events.searchPlaceholder')" 
        />
      </div>

      <!-- Vertical Events Scroll List -->
      <div class="vertical-list-container" style="margin-bottom: 24px;">
        <div 
          v-for="ev in filteredEvents" 
          :key="ev.id" 
          class="event-card-large"
          @click="openEvent(ev)"
        >
          <!-- Side Thumbnail Image based on event type -->
          <div class="event-card-large-img">
            <svg v-if="ev.id === 'tree-planting'" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width: 52px; height: 52px;">
              <rect width="100" height="100" rx="12" fill="rgba(124, 157, 57, 0.08)" />
              <path d="M50 75V45" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" />
              <path d="M50 45Q35 30 25 35Q35 55 50 45" fill="var(--accent-secondary)" />
              <path d="M50 45Q65 30 75 35Q65 55 50 45" fill="var(--accent)" />
              <circle cx="50" cy="73" r="3" fill="var(--accent)" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style="width: 52px; height: 52px;">
              <rect width="100" height="100" rx="12" fill="rgba(170, 185, 82, 0.08)" />
              <rect x="25" y="32" width="50" height="32" rx="4" stroke="var(--accent)" stroke-width="4" fill="none" />
              <path d="M20 64H80M35 64L42 72H58L65 64" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" fill="none" />
              <circle cx="50" cy="48" r="6" fill="var(--accent-secondary)" />
            </svg>
          </div>
          
          <!-- Event Details -->
          <div class="event-card-large-details">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <span class="event-card-large-title" style="-webkit-line-clamp: 2;">{{ ev.title }}</span>
                <!-- Date Badge -->
                <div class="event-date-badge" style="width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0; margin-left: 10px;">
                  <span class="event-date-day" style="font-size: 11px;">{{ ev.day }}</span>
                  <span class="event-date-mon" style="font-size: 6.5px;">{{ formatMonth(ev) }}</span>
                </div>
              </div>
              <span class="event-card-large-location" style="display: flex; align-items: center; gap: 4px; font-size: 10.5px;">
                <MapPinIcon :size="10" /> {{ ev.location }}
              </span>
            </div>
            
            <div class="event-card-large-footer">
              <span class="event-card-large-host">{{ t('events.byHost', { host: ev.host }) }}</span>
              <button 
                type="button"
                class="event-btn-action"
                :class="{ 'registered': isRegistered(ev.id) }"
                @click.stop="handleEventRegistration(ev.id)"
                style="padding: 5px 10px; font-size: 10.5px;"
              >
                {{ isRegistered(ev.id) ? t('discover.joined') : t('discover.rsvpCoins') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredEvents.length === 0" class="empty-state glass-card">
          <GlobeIcon :size="48" class="empty-icon" />
          <h4>{{ t('events.noEventsFound') }}</h4>
          <p>{{ t('events.clearSearch') }}</p>
        </div>
      </div>
    </div>

    <!-- ================= DETAIL MODAL ================= -->
    <div v-if="showEventModal" class="modal-overlay animate-fade-in" @click.self="showEventModal = false">
      <div class="modal-content glass-panel animate-slide-up" v-if="selectedEvent">
        <div class="modal-header">
          <h2>{{ selectedEvent.title }}</h2>
          <button class="close-btn" @click="showEventModal = false">
            <XIcon :size="20" />
          </button>
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
import { ref, computed, onMounted } from 'vue';
import { 
  ArrowLeft as ArrowLeftIcon,
  Search as SearchIcon,
  Globe as GlobeIcon,
  MapPin as MapPinIcon,
  X as XIcon
} from '@lucide/vue';
import { getEvents, getEventRegistrations, rsvpToEvent } from '../utils/db';
import { useI18n } from '../utils/i18n';
import confetti from 'canvas-confetti';

const emit = defineEmits(['plantWatered']);
const { t, locale } = useI18n();

const searchQuery = ref('');
const showEventModal = ref(false);
const selectedEvent = ref(null);
const registeredEvents = ref([]);
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

async function loadEvents() {
  const events = await getEvents();
  const registrations = await getEventRegistrations();
  
  registeredEvents.value = registrations;
  
  communityEvents.value = events.map(ev => {
    const { day, month } = getDayAndMonth(ev.event_date);
    return {
      ...ev,
      day,
      month
    };
  });
}

onMounted(() => {
  loadEvents();
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

function openEvent(event) {
  selectedEvent.value = event;
  showEventModal.value = true;
}

const filteredEvents = computed(() => {
  return communityEvents.value.filter(ev => {
    return ev.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
           ev.location.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
           ev.host.toLowerCase().includes(searchQuery.value.toLowerCase());
  });
});
</script>

<style scoped>
.events-page {
  display: flex;
  flex-direction: column;
}
</style>
