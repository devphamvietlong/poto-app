<template>
  <div class="mobile-container">
    <!-- PWA Only Gate (if pwa mode and not standalone) -->
    <div v-if="isPwaOnlyGateActive" class="pwa-gate-screen animate-fade-in">
      <div class="pwa-gate-content">
        <div class="pwa-gate-logo animate-pulse-glow">
          <img src="/src/assets/logo-cropped.svg" alt="Poto Logo" />
        </div>
        <h1 class="pwa-gate-title">Poto</h1>
        <p class="pwa-gate-subtitle">{{ t('splash.subtitle') }}</p>
        <p class="pwa-gate-desc">
          {{ t('dashboard.pwaGate.desc') }}
        </p>

        <!-- Dynamic Install Button -->
        <button 
          v-if="canInstall" 
          type="button" 
          class="pwa-gate-btn" 
          @click="handleInstallApp"
        >
          <DownloadIcon :size="18" />
          <span>{{ t('dashboard.pwaGate.btn') }}</span>
        </button>

        <!-- Instructions for non-supporting platforms (e.g. iOS Safari) -->
        <div v-else class="pwa-gate-instructions glass-card">
          <p class="instructions-title">{{ t('dashboard.pwaGate.howTo') }}</p>
          <ol class="instructions-list">
            <li v-if="isIOS">
              {{ t('dashboard.pwaGate.safariiOS').split('{icon}')[0] }}
              <ShareIcon :size="14" style="vertical-align: middle; margin: 0 2px;" />
              {{ t('dashboard.pwaGate.safariiOS').split('{icon}')[1] }}
            </li>
            <li v-else>
              {{ t('dashboard.pwaGate.otherBrowser').split('{icon}')[0] }}
              <MoreVerticalIcon :size="14" style="vertical-align: middle; margin: 0 2px;" />
              {{ t('dashboard.pwaGate.otherBrowser').split('{icon}')[1] }}
            </li>
            <li>{{ t('dashboard.pwaGate.addHome') }}</li>
            <li>{{ t('dashboard.pwaGate.launch') }}</li>
          </ol>
        </div>
      </div>
    </div>

    <!-- Splash Screen (if gate is not active) -->
    <transition v-else name="fade">
      <SplashLoading v-if="isLoading" @loaded="isLoading = false" />
    </transition>

    <!-- Main App Content (rendered after splash finishes) -->
    <div v-if="!isPwaOnlyGateActive && !isLoading" class="app-shell">
      <!-- Detail View -->
      <PlantDetail
        v-if="selectedPlantId"
        :plant-id="selectedPlantId"
        :plants="plants"
        :weather-factor="weatherFactor"
        @close="selectedPlantId = null"
        @plant-updated="handleDataUpdate"
      />

      <!-- Main Shell Content with Router & Bottom Nav -->
      <div v-else class="app-shell-content">
        <!-- Render page based on route -->
        <div class="page-content-wrapper">
          <Dashboard
            v-if="currentRoute === '#/home'"
            :plants="plants"
            :stats="stats"
            :weather-factor="weatherFactor"
            :is-dark="isDarkTheme"
            :can-install="canInstall"
            @toggle-theme="toggleTheme"
            @select-plant="handleSelectPlant"
            @plant-watered="handleDataUpdate"
            @install-app="handleInstallApp"
          />

          <PotsPage
            v-else-if="currentRoute === '#/pots'"
            :plants="plants"
            :weather-factor="weatherFactor"
            @select-plant="handleSelectPlant"
            @open-add-modal="showAddModal = true"
            @plant-watered="handleDataUpdate"
          />

          <ShopPage
            v-else-if="currentRoute === '#/shop'"
            :plants="plants"
            :stats="stats"
            @plant-watered="handleDataUpdate"
          />

          <DiscoverPage
            v-else-if="currentRoute === '#/discover'"
            @plant-watered="handleDataUpdate"
          />

          <BlogsPage
            v-else-if="currentRoute === '#/blogs'"
            @plant-watered="handleDataUpdate"
          />

          <EventsPage
            v-else-if="currentRoute === '#/events'"
            @plant-watered="handleDataUpdate"
          />

          <MePage
            v-else-if="currentRoute === '#/me'"
            :plants="plants"
            :stats="stats"
            :is-dark="isDarkTheme"
            :can-install="canInstall"
            @toggle-theme="toggleTheme"
            @plant-watered="handleDataUpdate"
            @install-app="handleInstallApp"
          />
        </div>

        <!-- Sticky Bottom Nav Bar -->
        <nav class="bottom-nav">
          <a href="#/home" class="nav-item" :class="{ active: currentRoute === '#/home' }">
            <HomeIcon :size="20" />
            <span>{{ t('nav.home') }}</span>
          </a>
          <a href="#/pots" class="nav-item" :class="{ active: currentRoute === '#/pots' }">
            <SproutIcon :size="20" />
            <span>{{ t('nav.pots') }}</span>
          </a>
          <a href="#/shop" class="nav-item" :class="{ active: currentRoute === '#/shop' }">
            <ShoppingBagIcon :size="20" />
            <span>{{ t('nav.shop') }}</span>
          </a>
          <a href="#/discover" class="nav-item" :class="{ active: currentRoute === '#/discover' }">
            <CompassIcon :size="20" />
            <span>{{ t('nav.discover') }}</span>
          </a>
          <a href="#/me" class="nav-item" :class="{ active: currentRoute === '#/me' }">
            <UserIcon :size="20" />
            <span>{{ t('nav.me') }}</span>
          </a>
        </nav>
      </div>

      <!-- Add Plant Modal -->
      <AddPlantModal
        v-if="showAddModal"
        @close="showAddModal = false"
        @plant-added="handleDataUpdate"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import SplashLoading from './components/SplashLoading.vue';
import Dashboard from './components/Dashboard.vue';
import PotsPage from './components/PotsPage.vue';
import ShopPage from './components/ShopPage.vue';
import DiscoverPage from './components/DiscoverPage.vue';
import MePage from './components/MePage.vue';
import BlogsPage from './components/BlogsPage.vue';
import EventsPage from './components/EventsPage.vue';
import PlantDetail from './components/PlantDetail.vue';
import AddPlantModal from './components/AddPlantModal.vue';
import { getPlants, getStats } from './utils/db';
import { useI18n } from './utils/i18n';
import { 
  Home as HomeIcon,
  Sprout as SproutIcon,
  ShoppingBag as ShoppingBagIcon,
  Compass as CompassIcon,
  User as UserIcon,
  Share as ShareIcon,
  MoreVertical as MoreVerticalIcon,
  Download as DownloadIcon
} from '@lucide/vue';

const { t } = useI18n();

const isLoading = ref(true);
const showAddModal = ref(false);
const selectedPlantId = ref(null);
const weatherFactor = ref(1.0); // 1.0 is Normal weather

const plants = ref([]);
const stats = ref({ bambooCoins: 0, streakWeeks: 0 });

const currentRoute = ref('#/home');

// Theme state loaded from localStorage
const isDarkTheme = ref(localStorage.getItem('poto_theme') !== 'light');

// PWA Install state and handlers
const deferredPrompt = ref(null);
const canInstall = ref(false);

// Standalone Mode Detection
const isStandalone = ref(false);

function checkStandalone() {
  isStandalone.value = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
}

const isPwaOnlyGateActive = computed(() => {
  return import.meta.env.MODE === 'pwa' && !isStandalone.value;
});

const isIOS = computed(() => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
});

function handleBeforeInstallPrompt(e) {
  if (import.meta.env.MODE === 'web') return; // Disable in web-only mode
  e.preventDefault();
  deferredPrompt.value = e;
  canInstall.value = true;
  console.log('PWA: beforeinstallprompt event captured');
}

function handleAppInstalled() {
  console.log('PWA: App was installed successfully');
  deferredPrompt.value = null;
  canInstall.value = false;
}

function handleInstallApp() {
  if (!deferredPrompt.value) return;
  deferredPrompt.value.prompt();
  deferredPrompt.value.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('PWA: User accepted the install prompt');
    } else {
      console.log('PWA: User dismissed the install prompt');
    }
    deferredPrompt.value = null;
    canInstall.value = false;
  });
}

function toggleTheme() {
  isDarkTheme.value = !isDarkTheme.value;
  localStorage.setItem('poto_theme', isDarkTheme.value ? 'dark' : 'light');
  updateThemeClass();
}

function updateThemeClass() {
  if (isDarkTheme.value) {
    document.body.classList.remove('light-theme');
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
    document.body.classList.add('light-theme');
  }
}

function handleHashChange() {
  const hash = window.location.hash;
  // Map root/empty path aliases to home
  if (!hash || hash === '#' || hash === '#/') {
    currentRoute.value = '#/home';
  } else {
    currentRoute.value = hash;
  }
}

async function refreshData() {
  plants.value = await getPlants();
  stats.value = await getStats();
}

function handleSelectPlant(id) {
  selectedPlantId.value = id;
}

function handleDataUpdate() {
  refreshData();
}

let mediaQueryList = null;

function handleStandaloneChange(e) {
  isStandalone.value = e.matches;
}

onMounted(async () => {
  await refreshData();
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange(); // Run once initially
  updateThemeClass(); // Set initial theme class on document body
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);

  checkStandalone();
  mediaQueryList = window.matchMedia('(display-mode: standalone)');
  mediaQueryList.addEventListener('change', handleStandaloneChange);
});

onUnmounted(() => {
  window.removeEventListener('hashchange', handleHashChange);
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.removeEventListener('appinstalled', handleAppInstalled);
  if (mediaQueryList) {
    mediaQueryList.removeEventListener('change', handleStandaloneChange);
  }
});
</script>

<style>
/* Global Shell resets for Vue mount point */
#app {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.app-shell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background: var(--bg-mobile);
}

/* Page transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
