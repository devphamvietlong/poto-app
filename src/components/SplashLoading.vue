<template>
  <div class="splash-screen">
    <div class="logo-container">
      <!-- We can import the SVG asset or render a beautiful animated circle wrapper -->
      <div class="logo-glow-wrapper animate-pulse-glow">
        <img :src="logoSrc" class="app-logo" alt="Poto Logo" />
      </div>
      <h1 class="app-title">Poto</h1>
      <p class="app-tagline">{{ t('splash.subtitle') }}</p>
    </div>
    
    <div class="loader-track">
      <div class="loader-bar" :style="{ width: progress + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import logoSrc from '../assets/logo-cropped.svg';
import { useI18n } from '../utils/i18n';

const { t } = useI18n();

const emit = defineEmits(['loaded']);
const progress = ref(0);

onMounted(() => {
  const duration = 2500; // 2.5 seconds loading
  const intervalTime = 50;
  const step = 100 / (duration / intervalTime);
  
  const timer = setInterval(() => {
    progress.value += step;
    if (progress.value >= 100) {
      progress.value = 100;
      clearInterval(timer);
      setTimeout(() => {
        emit('loaded');
      }, 300); // Small delay for visual completion
    }
  }, intervalTime);
});
</script>

<style scoped>
.splash-screen {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, var(--c-very-dark-green) 0%, var(--c-deep-black-green) 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 24px;
}

.logo-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 40px;
}

.logo-glow-wrapper {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: rgba(45, 101, 20, 0.3);
  border: 2px solid var(--border-glass);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
}

.app-logo {
  width: 90px;
  height: 90px;
  object-fit: contain;
}

.app-title {
  font-size: 42px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #ffffff 0%, var(--c-light-green-yellow) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.app-tagline {
  font-size: 15px;
  color: #B0C4A4;
  font-weight: 400;
  letter-spacing: 0.02em;
}

.loader-track {
  width: 180px;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.loader-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--c-olive-green) 0%, var(--c-light-green-yellow) 100%);
  box-shadow: 0 0 8px var(--c-light-green-yellow);
  transition: width 0.05s linear;
}
</style>
