<template>
  <div class="dashboard" @scroll="handleScroll">
    <!-- Wrap main dashboard content in animate-fade-in to prevent containing block constraint on modal overlays -->
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 16px; width: 100%;">
      <!-- Header with Stats -->
      <header class="dashboard-header glass-panel">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
          <div class="user-profile">
            <div class="avatar">
              <SproutIcon :size="24" class="avatar-icon" />
            </div>
            <div>
              <span class="user-greeting">{{ t('dashboard.welcome') }}</span>
              <h2 class="user-name">{{ userName }}</h2>
            </div>
          </div>
          <!-- Language & Theme Switchers -->
          <div style="display: flex; gap: 8px; align-items: center;">
            <button 
              type="button" 
              style="padding: 0 10px; height: 36px; border-radius: 18px; display: flex; align-items: center; justify-content: center; gap: 6px; background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); color: var(--text-primary); font-size: 11px; font-weight: 700; cursor: pointer;"
              @click="toggleLanguage"
              title="Switch Language"
            >
              <LanguagesIcon :size="15" />
              <span>{{ locale.toUpperCase() }}</span>
            </button>
            <button 
              type="button" 
              style="width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border: 1px solid var(--border-glass); color: var(--text-primary);"
              @click="$emit('toggleTheme')"
              title="Toggle Light/Dark Theme"
            >
              <SunIcon v-if="isDark" :size="16" />
              <MoonIcon v-else :size="16" />
            </button>
          </div>
        </div>
        
        <div class="stats-row">
          <!-- Streak Badge -->
          <div class="stat-badge streak-badge" :class="{ 'streak-active': stats.streakWeeks > 0 }">
            <FlameIcon :size="18" class="stat-icon flame" />
            <div class="stat-info">
              <span class="stat-val">{{ stats.streakWeeks }} {{ t('general.weeks') }}</span>
              <span class="stat-lbl">{{ t('general.streak') }}</span>
            </div>
          </div>
          
          <!-- Coins Badge -->
          <div class="stat-badge coin-badge">
            <CoinsIcon :size="18" class="stat-icon gold" />
            <div class="stat-info">
              <span class="stat-val">{{ stats.bambooCoins }}</span>
              <span class="stat-lbl">{{ t('general.coins') }}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Mascot Section -->
      <section class="mascot-section">
        <button type="button" class="mascot-container-wrapper" @click="requestShakePermission(); handleMascotClick()">
          <div id="mascot-container">
            <!-- Mascot SVG will be injected here dynamically -->
          </div>
          <div id="particles-container"></div>
        </button>
        <div 
          v-if="!isBubbleDismissed"
          class="mascot-bubble"
          @click="dismissBubble"
          style="cursor: pointer;"
          title="Click to dismiss"
        >
          <span class="mascot-tip">{{ t('mascot.label') }}:</span> {{ mascotSpeechBubble }}
        </div>
      </section>

      <!-- PWA Install Banner -->
      <section v-if="canInstall && !isInstallBannerDismissed" class="pwa-install-banner glass-card animate-fade-in">
        <div class="pwa-banner-content">
          <div class="pwa-icon-box">
            <DownloadIcon :size="20" class="pwa-icon" />
          </div>
          <div class="pwa-text">
            <h4>{{ t('dashboard.installTitle') }}</h4>
            <p>{{ t('dashboard.installDesc') }}</p>
          </div>
        </div>
        <div class="pwa-actions">
          <button type="button" class="pwa-btn install" @click="$emit('installApp')">{{ t('dashboard.installBtn') }}</button>
          <button type="button" class="pwa-btn dismiss" @click="dismissInstallBanner">{{ t('dashboard.maybeLater') }}</button>
        </div>
      </section>

      <!-- Navigation Grid Section -->
      <section class="navigation-grid-section glass-card" style="padding: 16px;">
        <h3>{{ t('dashboard.directory') }}</h3>
        <div class="navigation-grid" style="margin-top: 10px;">
          <a href="#/pots" class="nav-grid-item">
            <div class="icon-holder">
              <SproutIcon :size="22" />
            </div>
            <span class="nav-grid-label">{{ t('nav.pots') }}</span>
          </a>
          <a href="#/shop" class="nav-grid-item">
            <div class="icon-holder">
              <ShoppingBagIcon :size="22" />
            </div>
            <span class="nav-grid-label">{{ t('nav.shop') }}</span>
          </a>
          <a href="#/blogs" class="nav-grid-item">
            <div class="icon-holder">
              <BookOpenIcon :size="22" />
            </div>
            <span class="nav-grid-label">{{ t('general.blog') }}</span>
          </a>
          <a href="#/events" class="nav-grid-item">
            <div class="icon-holder">
              <CalendarIcon :size="22" />
            </div>
            <span class="nav-grid-label">{{ t('general.events') }}</span>
          </a>
          <div class="nav-grid-item placeholder" @click="handlePlaceholderClick('aiCare')">
            <div class="icon-holder" style="position: relative;">
              <SparklesIcon :size="22" />
              <span class="badge-tag" style="background: var(--c-light-green-yellow); color: #012D04; position: absolute; top: -4px; right: -4px; font-size: 7.5px; font-weight: 700; border-radius: 4px; padding: 2px 4px; line-height: 1;">AI</span>
            </div>
            <span class="nav-grid-label">{{ t('placeholders.aiCare.title') }}</span>
          </div>
          <div class="nav-grid-item placeholder" @click="handlePlaceholderClick('smartSoil')">
            <div class="icon-holder" style="position: relative;">
              <CpuIcon :size="22" />
              <span class="badge-tag" style="background: var(--c-lighter-olive); color: #012D04; position: absolute; top: -4px; right: -4px; font-size: 7.5px; font-weight: 700; border-radius: 4px; padding: 2px 4px; line-height: 1;">IoT</span>
            </div>
            <span class="nav-grid-label">{{ t('placeholders.smartSoil.title') }}</span>
          </div>
          <div class="nav-grid-item placeholder" @click="handlePlaceholderClick('alerts')">
            <div class="icon-holder" style="position: relative;">
              <BellIcon :size="22" />
              <span class="badge-tag" style="background: var(--c-olive-green); color: white; position: absolute; top: -4px; right: -4px; font-size: 7.5px; font-weight: 700; border-radius: 4px; padding: 2px 4px; line-height: 1;">Alert</span>
            </div>
            <span class="nav-grid-label">{{ t('placeholders.alerts.title') }}</span>
          </div>
          <div class="nav-grid-item placeholder" @click="handlePlaceholderClick('badges')">
            <div class="icon-holder" style="position: relative;">
              <AwardIcon :size="22" />
              <span class="badge-tag" style="background: var(--c-medium-forest); color: white; position: absolute; top: -4px; right: -4px; font-size: 7.5px; font-weight: 700; border-radius: 4px; padding: 2px 4px; line-height: 1;">Pro</span>
            </div>
            <span class="nav-grid-label">{{ t('placeholders.badges.title') }}</span>
          </div>
        </div>
      </section>

      <!-- Environmental Impact Section -->
      <section class="impact-panel glass-card" @click="showImpactModal = true" style="margin-bottom: 12px;">
        <div class="impact-header">
          <div class="impact-title-container">
            <GlobeIcon :size="18" class="impact-icon" />
            <h3>{{ t('dashboard.impactTitle') }}</h3>
          </div>
          <ChevronRightIcon :size="16" class="text-muted" />
        </div>
        <div class="impact-grid">
          <div class="impact-card">
            <span class="impact-num">{{ calculatedCO2 }} kg</span>
            <span class="impact-lbl">{{ t('dashboard.co2Saved') }}</span>
          </div>
          <div class="impact-card">
            <span class="impact-num">{{ calculatedBamboos }}</span>
            <span class="impact-lbl">{{ t('dashboard.treesPlanted') }}</span>
          </div>
        </div>
        <div class="impact-learn-more">
          <span>{{ t('dashboard.helpPrompt') }}</span>
          <SparklesIcon :size="12" />
        </div>
      </section>
    </div>

    <!-- ================= MODALS ================= -->

    <!-- Sustainability Impact Modal -->
    <div v-if="showImpactModal" class="modal-overlay animate-fade-in" @click.self="showImpactModal = false">
      <div class="modal-content glass-panel animate-slide-up">
        <div class="modal-header">
          <h2>{{ t('sustainability.title') }}</h2>
          <button class="close-btn" @click="showImpactModal = false"><XIcon :size="20" /></button>
        </div>
        <div class="modal-body modal-article-body">
          <p>{{ t('sustainability.desc') }}</p>
          <h3>{{ t('sustainability.derivedTitle') }}</h3>
          <p v-html="t('sustainability.derivedDesc')"></p>
          <h3>{{ t('sustainability.partnershipTitle') }}</h3>
          <p>{{ t('sustainability.partnershipDesc') }}</p>
          <h3>{{ t('sustainability.balanceTitle') }}</h3>
          <ul>
            <li><strong>{{ t('sustainability.trackedPlants') }}</strong> {{ plants.length }}</li>
            <li><strong>{{ t('sustainability.co2Offset') }}</strong> {{ calculatedCO2 }} kg</li>
            <li><strong>{{ t('sustainability.sponsoredSaplings') }}</strong> {{ calculatedBamboos }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Coming Soon Feature Details Modal -->
    <div v-if="showPlaceholderModal" class="modal-overlay animate-fade-in" @click.self="showPlaceholderModal = false">
      <div class="modal-content glass-panel animate-slide-up">
        <div class="modal-header">
          <h2>{{ activePlaceholder.title }}</h2>
          <button class="close-btn" @click="showPlaceholderModal = false"><XIcon :size="20" /></button>
        </div>
        <div class="modal-body modal-article-body">
          <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 16px;">
            <div class="blog-icon-box" style="width: 48px; height: 48px; border-radius: 12px; margin: 0; background: rgba(82, 129, 36, 0.1); display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <component :is="activePlaceholder.icon" :size="24" style="color: var(--accent);" />
            </div>
            <div>
              <span style="font-size: 10px; text-transform: uppercase; color: var(--accent); font-weight: 700; letter-spacing: 0.05em;">{{ t('placeholders.upcoming') }}</span>
              <h3 style="margin: 0; font-size: 16px; color: var(--text-primary);">{{ activePlaceholder.name }}</h3>
            </div>
          </div>
          <p v-html="activePlaceholder.description" style="font-size: 13.5px; line-height: 1.5; color: var(--text-secondary);"></p>
          <br>
          <button class="btn-purchase" @click="showPlaceholderModal = false">{{ t('placeholders.releaseBtn') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { 
  Sprout as SproutIcon, 
  Flame as FlameIcon, 
  Coins as CoinsIcon, 
  Globe as GlobeIcon,
  ChevronRight as ChevronRightIcon,
  Sparkles as SparklesIcon,
  X as XIcon,
  ShoppingBag as ShoppingBagIcon,
  BookOpen as BookOpenIcon,
  Calendar as CalendarIcon,
  Cpu as CpuIcon,
  Bell as BellIcon,
  Award as AwardIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Download as DownloadIcon,
  Languages as LanguagesIcon
} from '@lucide/vue';
import { SPECIES_CATALOG, calculateWatering } from '../utils/db';
import { MascotEngine } from '../utils/MascotEngine.js';
import { useI18n } from '../utils/i18n';
import confetti from 'canvas-confetti';

// Import mascot meta config and animations directly (zero runtime network fetches!)
import metaRes from '../core/meta.json';
import greetingRes from '../core/animations/greeting.json';
import jumpRes from '../core/animations/jump.json';
import flyRes from '../core/animations/flying_hero.json';
import cryRes from '../core/animations/sad_crying.json';
import sleepRes from '../core/animations/sleeping.json';
import sitRes from '../core/animations/sitting.json';
import pointRes from '../core/animations/pointing.json';
import hitRes from '../core/animations/get_hit.json';

// Import raw SVGs for the mascot parts
import export2TorsoSvg from '../core/parts/export_2_torso.svg?raw';
import export2TorsoDetailSvg from '../core/parts/export_2_torso_detail.svg?raw';
import export2RightLegSvg from '../core/parts/export_2_right_leg.svg?raw';
import export2LeftLegSvg from '../core/parts/export_2_left_leg.svg?raw';
import export2LeftArmSvg from '../core/parts/export_2_left_arm.svg?raw';
import export2RightArmSvg from '../core/parts/export_2_right_arm.svg?raw';
import export2BambooSvg from '../core/parts/export_2_bamboo.svg?raw';
import export2HeadSvg from '../core/parts/export_2_head.svg?raw';
import export2FaceSvg from '../core/parts/export_2_face.svg?raw';
import export2HatSvg from '../core/parts/export_2_hat.svg?raw';
import export2EmoteSvg from '../core/parts/export_2_emote.svg?raw';

const props = defineProps({
  plants: {
    type: Array,
    required: true
  },
  stats: {
    type: Object,
    required: true
  },
  weatherFactor: {
    type: Number,
    required: true
  },
  isDark: {
    type: Boolean,
    default: true
  },
  canInstall: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['selectPlant', 'plantWatered', 'toggleTheme', 'installApp']);



onMounted(() => {
  initMascot();

  if (typeof DeviceMotionEvent !== 'undefined') {
    if (typeof DeviceMotionEvent.requestPermission !== 'function') {
      window.addEventListener('devicemotion', handleDeviceMotion);
      isDeviceMotionRegistered.value = true;
    } else {
      const previouslyGranted = localStorage.getItem('poto_shake_permission_granted') === 'true';
      if (previouslyGranted) {
        window.addEventListener('devicemotion', handleDeviceMotion);
        isDeviceMotionRegistered.value = true;
      }
    }
  }
});

onUnmounted(() => {
  if (mascotEngine.value) {
    mascotEngine.value.stopAnimation();
    mascotEngine.value = null;
  }
  if (tapTimer) clearTimeout(tapTimer);
  window.removeEventListener('devicemotion', handleDeviceMotion);
  
  window.removeEventListener("mousemove", handleGlobalMouseMove);
  document.removeEventListener("mouseleave", handleGlobalMouseLeave);
  window.removeEventListener("touchmove", handleGlobalTouchMove);
  window.removeEventListener("touchend", handleGlobalTouchEnd);
});

function dismissBubble() {
  isBubbleDismissed.value = true;
}

let isPointerActive = false;

function handleScroll(e) {
  if (!mascotEngine.value || isPointerActive) return;
  const scrollTop = e.target.scrollTop;
  
  if (scrollTop > 10) {
    const maxScroll = 160;
    const ratio = Math.min(1.0, (scrollTop - 10) / maxScroll);
    mascotEngine.value.mouseTarget.y = ratio;
    mascotEngine.value.mouseTarget.x = 0;
    mascotEngine.value.isMouseActive = true;
  } else {
    mascotEngine.value.clearMousePosition();
  }
}

function restoreDefaultLookAt() {
  if (!mascotEngine.value) return;
  const dashboard = document.querySelector(".dashboard");
  const scrollTop = dashboard ? dashboard.scrollTop : 0;
  
  if (scrollTop > 10) {
    const maxScroll = 160;
    const ratio = Math.min(1.0, (scrollTop - 10) / maxScroll);
    mascotEngine.value.mouseTarget.y = ratio;
    mascotEngine.value.mouseTarget.x = 0;
    mascotEngine.value.isMouseActive = true;
  } else {
    mascotEngine.value.clearMousePosition();
  }
}

function handleGlobalMouseMove(e) {
  isPointerActive = true;
  mascotEngine.value?.setMousePosition(e.clientX, e.clientY);
}

function handleGlobalMouseLeave() {
  isPointerActive = false;
  restoreDefaultLookAt();
}

function handleGlobalTouchMove(e) {
  isPointerActive = true;
  if (e.touches.length > 0) {
    const touch = e.touches[0];
    mascotEngine.value?.setMousePosition(touch.clientX, touch.clientY);
  }
}

function handleGlobalTouchEnd() {
  isPointerActive = false;
  restoreDefaultLookAt();
}

async function initMascot() {
  try {
    animations.greeting = greetingRes;
    animations.jump = jumpRes;
    animations.fly = flyRes;
    animations.cry = cryRes;
    animations.sleep = sleepRes;
    animations.sit = sitRes;
    animations.point = pointRes;
    animations.hit = hitRes;

    const container = document.getElementById("mascot-container");
    if (!container) return;

    mascotEngine.value = new MascotEngine(container, metaRes, {
      lookAtDamping: 0.08,
      enableIdle: true,
      enableLookAt: true,
      lookAtScale: 1.8,
      preloadedSVGs: {
        "parts/export_2_torso.svg": export2TorsoSvg,
        "parts/export_2_torso_detail.svg": export2TorsoDetailSvg,
        "parts/export_2_right_leg.svg": export2RightLegSvg,
        "parts/export_2_left_leg.svg": export2LeftLegSvg,
        "parts/export_2_left_arm.svg": export2LeftArmSvg,
        "parts/export_2_right_arm.svg": export2RightArmSvg,
        "parts/export_2_bamboo.svg": export2BambooSvg,
        "parts/export_2_head.svg": export2HeadSvg,
        "parts/export_2_face.svg": export2FaceSvg,
        "parts/export_2_hat.svg": export2HatSvg,
        "parts/export_2_emote.svg": export2EmoteSvg
      }
    });

    await mascotEngine.value.ready;

    window.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("mouseleave", handleGlobalMouseLeave);
    window.addEventListener("touchmove", handleGlobalTouchMove, { passive: true });
    window.addEventListener("touchend", handleGlobalTouchEnd);

    runMascotStartupScript();

  } catch (error) {
    console.error("Failed to initialize MascotEngine:", error);
  }
}

function runMascotStartupScript() {
  if (!mascotEngine.value) return;

  if (isThirsty.value) {
    const emotes = ["angry", "scared", "crying"];
    const randomEmote = emotes[Math.floor(Math.random() * emotes.length)];
    mascotEngine.value.setEmote(randomEmote);

    const motions = ["cry", "point"];
    const randomMotion = motions[Math.floor(Math.random() * motions.length)];
    activeAnimationName.value = randomMotion;
    
    if (randomMotion === "cry") {
      mascotEngine.value.playAnimation(animations.cry);
    } else {
      mascotEngine.value.playAnimation(animations.point);
    }
  } else {
    mascotEngine.value.setEmote("normal");

    const motions = ["greeting", "jump", "sleep", "idle"];
    const randomMotion = motions[Math.floor(Math.random() * motions.length)];
    activeAnimationName.value = randomMotion;

    if (randomMotion !== "idle") {
      mascotEngine.value.playAnimation(animations[randomMotion]);
    }

    setTimeout(() => {
      if (mascotEngine.value && !isThirsty.value) {
        mascotEngine.value.stopAnimation();
        activeAnimationName.value = 'idle';
        if (Math.random() > 0.5) {
          activeAnimationName.value = 'sit';
          mascotEngine.value.playAnimation(animations.sit);
        }
      }
    }, 4000);
  }
}

let lastUpdate = 0;
let shakeCount = 0;
let lastShakeTime = 0;
const isDeviceMotionRegistered = ref(false);

function handleDeviceMotion(event) {
  const acc = event.acceleration;
  const accWithGravity = event.accelerationIncludingGravity;
  
  let x = 0, y = 0, z = 0;
  let isGravityIncluded = false;

  if (acc && (acc.x !== null || acc.y !== null || acc.z !== null)) {
    x = acc.x || 0;
    y = acc.y || 0;
    z = acc.z || 0;
  } else if (accWithGravity && (accWithGravity.x !== null || accWithGravity.y !== null || accWithGravity.z !== null)) {
    x = accWithGravity.x || 0;
    y = accWithGravity.y || 0;
    z = accWithGravity.z || 0;
    isGravityIncluded = true;
  } else {
    return;
  }

  const curTime = Date.now();
  if (curTime - lastUpdate < 100) return;
  lastUpdate = curTime;

  let magnitude = Math.sqrt(x * x + y * y + z * z);
  if (isGravityIncluded) {
    magnitude = Math.abs(magnitude - 9.8);
  }

  if (magnitude > 13) {
    shakeCount++;
    if (curTime - lastShakeTime > 1200) {
      shakeCount = 1;
    }
    lastShakeTime = curTime;

    if (shakeCount >= 3) {
      shakeCount = 0;
      triggerDizzyState();
    }
  }
}

function requestShakePermission() {
  if (isDeviceMotionRegistered.value) return;

  if (!window.isSecureContext) {
    isDeviceMotionRegistered.value = true;
    return;
  }

  if (typeof DeviceMotionEvent !== 'undefined') {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission()
        .then(permissionState => {
          if (permissionState === 'granted') {
            window.addEventListener('devicemotion', handleDeviceMotion);
            isDeviceMotionRegistered.value = true;
            localStorage.setItem('poto_shake_permission_granted', 'true');
          }
        })
        .catch(err => {
          console.error(err);
        });
    } else {
      window.addEventListener('devicemotion', handleDeviceMotion);
      isDeviceMotionRegistered.value = true;
    }
  }
}

function triggerDizzyState() {
  if (!mascotEngine.value || activeAnimationName.value === 'dizzy') return;

  isBubbleDismissed.value = false;
  const previousHealthyEmote = mascotEngine.value.currentEmote || "normal";

  activeAnimationName.value = 'dizzy';
  mascotEngine.value.setEmote("dizzy");
  mascotEngine.value.playAnimation(animations.sit);

  setTimeout(() => {
    if (mascotEngine.value) {
      mascotEngine.value.stopAnimation();
      mascotEngine.value.previousEmote = "normal";
      
      if (isThirsty.value) {
        runMascotStartupScript();
      } else {
        activeAnimationName.value = 'idle';
        const emoteToRestore = (previousHealthyEmote === "dizzy" || previousHealthyEmote === "hit") ? "normal" : previousHealthyEmote;
        mascotEngine.value.setEmote(emoteToRestore);
      }
    }
  }, 3000);

  confetti({
    particleCount: 50,
    angle: 60,
    spread: 55,
    origin: { x: 0 },
    colors: ['#D5D170', '#AAB952']
  });
  confetti({
    particleCount: 50,
    angle: 120,
    spread: 55,
    origin: { x: 1 },
    colors: ['#D5D170', '#AAB952']
  });
}

function handleMascotClick() {
  if (!mascotEngine.value) return;

  isBubbleDismissed.value = false;

  if (activeAnimationName.value === 'sleep') {
    mascotEngine.value.stopAnimation();
    mascotEngine.value.setEmote("shock");
    activeAnimationName.value = 'greeting';
    wakeUpMessage.value = t('mascot.bubble.wokenUp');
    setTimeout(() => {
      wakeUpMessage.value = '';
    }, 4000);
    mascotEngine.value.playAnimation(animations.greeting);
    tapCount.value = 0;
    return;
  }

  tapCount.value++;
  if (tapTimer) clearTimeout(tapTimer);
  tapTimer = setTimeout(() => {
    tapCount.value = 0;
  }, 2000);

  if (tapCount.value >= 5) {
    tapCount.value = 0;
    if (tapTimer) clearTimeout(tapTimer);
    triggerDizzyState();
  } else {
    if (activeAnimationName.value !== 'dizzy' && animations.hit) {
      mascotEngine.value.playAnimation(animations.hit);
    }
  }
}

const isThirsty = computed(() => {
  return computedPlants.value.some(p => p.wateringStatus.class === 'thirsty');
});

// Sustainability calculations
const calculatedCO2 = computed(() => {
  return ((props.plants.length * 4.2) + (props.stats.streakWeeks * 2.1)).toFixed(1);
});

const calculatedBamboos = computed(() => {
  return props.plants.length + Math.floor(props.stats.streakWeeks / 2);
});

const { locale, t } = useI18n();

function toggleLanguage() {
  locale.value = locale.value === 'en' ? 'vi' : 'en';
}

const userName = computed(() => props.stats.name || t('dashboard.defaultUser'));

// PWA Install banner state
const isInstallBannerDismissed = ref(sessionStorage.getItem('poto_install_dismissed') === 'true');

function dismissInstallBanner() {
  isInstallBannerDismissed.value = true;
  sessionStorage.setItem('poto_install_dismissed', 'true');
}

// Modal States
const showImpactModal = ref(false);

// Mascot States
let mascotEngine = ref(null);
const animations = {};
const tapCount = ref(0);
let tapTimer = null;
const activeAnimationName = ref('idle');
const isBubbleDismissed = ref(false);
const wakeUpMessage = ref('');

// Computed plant details for mascot alerts
const computedPlants = computed(() => {
  return props.plants.map(plant => {
    const species = SPECIES_CATALOG.find(s => s.id === plant.speciesId) || SPECIES_CATALOG[0];
    const { intervalDays } = calculateWatering(plant.speciesId, plant.potSize, props.weatherFactor);
    
    const lastWateredTime = new Date(plant.lastWatered).getTime();
    const daysPassed = (Date.now() - lastWateredTime) / (1000 * 60 * 60 * 24);
    const daysLeft = intervalDays - daysPassed;
    
    let wateringStatus = {
      message: '',
      class: 'healthy',
      daysLeft
    };
    
    if (daysLeft <= 0) {
      wateringStatus.message = t('pots.status.thirsty');
      wateringStatus.class = 'thirsty';
    } else if (daysLeft <= 1) {
      wateringStatus.message = t('pots.status.warning', { hours: Math.round(daysLeft * 24) });
      wateringStatus.class = 'warning';
    } else {
      wateringStatus.message = t('pots.status.healthy', { days: Math.round(daysLeft) });
      wateringStatus.class = 'healthy';
    }

    const latestPhoto = plant.photos && plant.photos.length > 0 
      ? plant.photos[plant.photos.length - 1].url 
      : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%232D6514"><circle cx="50" cy="50" r="40" fill="%23104908"/><path d="M50,75 L50,25 Q50,45 60,35 Q50,55 50,75" stroke="white" stroke-width="4"/></svg>';

    return {
      ...plant,
      species,
      wateringStatus,
      latestPhoto
    };
  });
});

// Mascot Speech Bubble text
const mascotSpeechBubble = computed(() => {
  if (wakeUpMessage.value) return wakeUpMessage.value;
  if (activeAnimationName.value === 'sleep') return t('mascot.bubble.sleep');
  if (activeAnimationName.value === 'dizzy') return t('mascot.bubble.dizzy');

  if (tapCount.value === 1) return t('mascot.bubble.tap1');
  if (tapCount.value === 2) return t('mascot.bubble.tap2');
  if (tapCount.value === 3) return t('mascot.bubble.tap3');
  if (tapCount.value === 4) return t('mascot.bubble.tap4');

  if (props.plants.length === 0) {
    return t('mascot.bubble.lonely');
  }

  const thirsty = computedPlants.value.some(p => p.wateringStatus.class === 'thirsty');
  if (thirsty) {
    return t('mascot.bubble.thirsty');
  }

  const needsPermissionPrompt = typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function';
  if (needsPermissionPrompt && !isDeviceMotionRegistered.value) {
    return t('mascot.bubble.sensorPrompt');
  }
  
  if (props.stats.streakWeeks > 0) {
    return t('mascot.bubble.streakMsg', { streak: props.stats.streakWeeks });
  }
  
  return t('mascot.bubble.defaultMsg');
});

watch(mascotSpeechBubble, () => {
  isBubbleDismissed.value = false;
});

const showPlaceholderModal = ref(false);
const activePlaceholder = ref({ title: '', name: '', description: '', icon: null });

const PLACEHOLDER_FEATURES = {
  aiCare: { icon: SparklesIcon },
  smartSoil: { icon: CpuIcon },
  alerts: { icon: BellIcon },
  badges: { icon: AwardIcon }
};

function handlePlaceholderClick(key) {
  const feature = PLACEHOLDER_FEATURES[key];
  if (feature) {
    activePlaceholder.value = {
      title: t(`placeholders.${key}.title`),
      name: t(`placeholders.${key}.name`),
      description: t(`placeholders.${key}.desc`),
      icon: feature.icon
    };
    showPlaceholderModal.value = true;
  }
}
</script>

<style scoped>
.dashboard {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 0px;
  overflow-y: auto;
  gap: 16px;
  height: 100%;
}

.dashboard-header {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--bg-card);
  border: 1px solid var(--border-glass);
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--accent);
}

.avatar-icon {
  filter: drop-shadow(0 0 4px var(--accent));
}

.user-greeting {
  font-size: 13px;
  color: var(--text-secondary);
}

.user-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--border-glass);
}

.streak-badge {
  transition: all 0.3s ease;
}

.stat-icon {
  display: flex;
  justify-content: center;
  align-items: center;
}

.flame {
  color: var(--text-muted);
}

.streak-active .flame {
  color: #ffa502;
  filter: drop-shadow(0 0 5px #ffa502);
}

.gold {
  color: var(--accent);
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-val {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
}

.stat-lbl {
  font-size: 10px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
}
</style>
