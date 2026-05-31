<template>
  <div class="plant-detail animate-fade-in">
    <!-- Header/Back Nav -->
    <div class="detail-header">
      <button class="back-btn" @click="emit('close')">
        <ChevronLeftIcon :size="24" /> {{ t('general.back') }}
      </button>
      <button class="delete-btn-ghost" @click="confirmDelete" :title="t('detail.deletePot')">
        <Trash2Icon :size="18" />
      </button>
    </div>

    <div class="detail-body" v-if="plant && species">
      <!-- Plant Showcase Section -->
      <section class="showcase-card glass-panel">
        <div class="showcase-img-container">
          <!-- Active photo display (either timelapse frame or latest photo) -->
          <img :src="displayedPhotoUrl" alt="Plant showcase" class="showcase-img" />
          
          <div class="showcase-overlay">
            <span class="species-tag">{{ species.name }}</span>
            <span class="pot-tag" :class="plant.potSize">{{ t('pots.fieldSize') }}: {{ t('pots.potSize.' + plant.potSize) }}</span>
          </div>

          <!-- Playback Status Overlay -->
          <div v-if="isTimelapsePlaying" class="timelapse-status">
            <span class="pulse-red"></span> {{ locale === 'vi' ? 'ĐANG PHÁT NHẬT KÝ' : 'TIMELAPSE PLAYING' }} ({{ activeFrameIndex + 1 }}/{{ plant.photos.length }})
          </div>
        </div>

        <div class="showcase-details">
          <h1 class="plant-name">{{ plant.name }}</h1>
          <p class="species-scientific">{{ species.speciesName }}</p>
          <p class="species-desc">{{ species.desc }}</p>
        </div>
      </section>

      <!-- Action Button Group -->
      <div class="action-grid">
        <button class="action-btn water" @click="handleWater">
          <DropletIcon :size="20" /> {{ t('detail.waterSprout') }}
        </button>
        <button class="action-btn photo" @click="toggleCameraPanel">
          <CameraIcon :size="20" /> {{ t('detail.uploadPhoto') }}
        </button>
      </div>

      <!-- Camera Capture Panel -->
      <section v-if="showCameraPanel" class="camera-panel glass-card animate-slide-up">
        <div class="panel-header">
          <h4>{{ t('detail.uploadPhoto') }}</h4>
          <button @click="showCameraPanel = false" class="close-panel-btn"><XIcon :size="16" /></button>
        </div>
        
        <div class="camera-workspace">
          <div v-if="cameraActive" class="video-preview-wrapper">
            <video ref="videoRef" autoplay playsinline class="webcam-view"></video>
            <button @click="captureWebcamPhoto" class="btn-snap">
              <CameraIcon :size="16" /> {{ locale === 'vi' ? 'Chụp ảnh ngay' : 'Snap Capture' }}
            </button>
          </div>
          <div class="camera-fallback-options" v-else>
            <p class="camera-hint">{{ locale === 'vi' ? 'Thêm ảnh mới vào nhật ký tăng trưởng của bạn. Nhiều ảnh hơn giúp thể hiện quá trình lớn lên của cây!' : 'Add a new photo to your timelapse. More photos show your plant growing in size!' }}</p>
            <div class="btn-group-row">
              <button @click="startWebcam" class="workspace-btn">
                <CameraIcon :size="16" /> {{ locale === 'vi' ? 'Máy ảnh trực tiếp' : 'Live Camera' }}
              </button>
              <button @click="captureMockPhoto" class="workspace-btn highlight">
                <SparklesIcon :size="16" /> {{ locale === 'vi' ? 'Mô phỏng chụp' : 'Simulate Capture' }}
              </button>
            </div>
          </div>
        </div>
        
        <div v-if="cameraActive" class="btn-cancel-wrapper">
          <button @click="stopWebcam" class="btn-cancel-webcam">{{ locale === 'vi' ? 'Hủy máy ảnh' : 'Cancel Webcam' }}</button>
        </div>
      </section>

      <!-- Timelapse Player Section -->
      <section class="timelapse-panel glass-card">
        <div class="panel-header">
          <div class="title-with-badge">
            <HistoryIcon :size="18" class="section-icon" />
            <h3>{{ locale === 'vi' ? 'Nhật ký Tăng trưởng' : 'Growth Timelapse' }}</h3>
          </div>
          <span class="photo-count-badge">{{ plant.photos.length }} {{ locale === 'vi' ? 'Ảnh' : 'Photos' }}</span>
        </div>

        <div v-if="plant.photos.length === 0" class="empty-timelapse">
          <p>{{ locale === 'vi' ? 'Chưa có ảnh nào. Hãy chụp bức ảnh đầu tiên để bắt đầu nhật ký!' : 'No photos logged yet. Take your first photo to start the timelapse!' }}</p>
        </div>

        <div class="timelapse-controls" v-else>
          <!-- Playback Row -->
          <div class="playback-row">
            <button class="playback-btn" @click="toggleTimelapse">
              <PauseIcon v-if="isTimelapsePlaying" :size="20" />
              <PlayIcon v-else :size="20" />
            </button>
            
            <div class="scrubber-container">
              <input 
                type="range" 
                min="0" 
                :max="plant.photos.length - 1" 
                v-model.number="activeFrameIndex" 
                class="scrubber-slider" 
                @input="pauseTimelapse"
              />
              <div class="frame-date">
                {{ locale === 'vi' ? 'Đã chụp' : 'Captured' }}: {{ formatDate(plant.photos[activeFrameIndex]?.date) }}
              </div>
            </div>
          </div>

          <!-- Speed controller -->
          <div class="timelapse-speed">
            <span>{{ locale === 'vi' ? 'Tốc độ phát:' : 'Playback Speed:' }}</span>
            <div class="speed-selector">
              <button 
                v-for="speed in [400, 800, 1500]" 
                :key="speed"
                :class="['speed-btn', timelapseIntervalMs === speed ? 'active' : '']"
                @click="timelapseIntervalMs = speed"
              >
                {{ speed === 400 ? (locale === 'vi' ? 'Nhanh' : 'Fast') : speed === 800 ? (locale === 'vi' ? 'Trung bình' : 'Medium') : (locale === 'vi' ? 'Chậm' : 'Slow') }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Watering Schedule Model Math -->
      <section class="math-panel glass-card">
        <div class="panel-header">
          <div class="title-with-badge">
            <CalculatorIcon :size="18" class="section-icon" />
            <h3>{{ locale === 'vi' ? 'Mô hình Thoát hơi nước' : 'Evapotranspiration Model' }}</h3>
          </div>
        </div>

        <div class="math-body">
          <div class="formula-box">
            <span class="formula-item title">{{ locale === 'vi' ? 'Công thức Chu kỳ tưới:' : 'Watering Interval formula:' }}</span>
            <span class="formula-text">{{ locale === 'vi' ? 'Ngày = Dung tích / Tỉ lệ Thoát hơi nước hiệu quả' : 'Days = Capacity / Effective ET Rate' }}</span>
          </div>

          <!-- Math Parameters -->
          <div class="math-grid">
            <div class="math-row">
              <span class="math-lbl">{{ locale === 'vi' ? 'Mức thoát hơi cơ bản của loài:' : 'Species Baseline ET:' }}</span>
              <span class="math-val">{{ species.baselineET }} {{ locale === 'vi' ? 'Lít/ngày' : 'Liters/day' }}</span>
            </div>
            
            <div class="math-row">
              <span class="math-lbl">{{ locale === 'vi' ? 'Hệ số chậu:' : 'Pot Factor:' }}</span>
              <span class="math-val">x{{ potMultiplier }} ({{ t('pots.fieldSize') }}: {{ t('pots.potSize.' + plant.potSize) }})</span>
            </div>

            <div class="math-row">
              <span class="math-lbl">{{ locale === 'vi' ? 'Điều chỉnh thời tiết:' : 'Weather adjustment:' }}</span>
              <span class="math-val">x{{ weatherFactor.toFixed(1) }}</span>
            </div>

            <div class="math-divider"></div>

            <div class="math-row highlight">
              <span class="math-lbl font-bold">{{ locale === 'vi' ? 'Tỉ lệ Thoát hơi hiệu quả:' : 'Effective ET Rate:' }}</span>
              <span class="math-val text-accent">{{ calculated.dailyETMl }} ml/{{ locale === 'vi' ? 'ngày' : 'day' }}</span>
            </div>

            <div class="math-row highlight">
              <span class="math-lbl font-bold">{{ locale === 'vi' ? 'Dung tích chậu:' : 'Pot Capacity:' }}</span>
              <span class="math-val text-accent">{{ calculated.capacityMl }} ml</span>
            </div>

            <div class="math-row final-result">
              <span class="math-lbl font-bold">{{ locale === 'vi' ? 'Chu kỳ Tính toán:' : 'Calculated Interval:' }}</span>
              <span class="math-val final-days">{{ calculated.intervalDays }} {{ locale === 'vi' ? 'Ngày' : 'Days' }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { 
  ChevronLeft as ChevronLeftIcon,
  Trash2 as Trash2Icon,
  Droplet as DropletIcon,
  Camera as CameraIcon,
  Play as PlayIcon,
  Pause as PauseIcon,
  History as HistoryIcon,
  Calculator as CalculatorIcon,
  Sparkles as SparklesIcon,
  X as XIcon
} from '@lucide/vue';
import { SPECIES_CATALOG, calculateWatering, waterPlant, addPhotoToPlant, deletePlant } from '../utils/db';
import { getMockPlantSVG } from '../utils/plantPainter';
import { useI18n } from '../utils/i18n';
import confetti from 'canvas-confetti';

const props = defineProps({
  plantId: {
    type: String,
    required: true
  },
  plants: {
    type: Array,
    required: true
  },
  weatherFactor: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['close', 'plantUpdated']);
const { t, locale } = useI18n();

const plant = ref(null);
const species = ref(null);

// Timelapse States
const activeFrameIndex = ref(0);
const isTimelapsePlaying = ref(false);
const timelapseIntervalMs = ref(800);
let timelapseTimer = null;

// Camera States
const showCameraPanel = ref(false);
const cameraActive = ref(false);
const videoRef = ref(null);
let streamInstance = null;

// Load plant data
function loadPlant() {
  const foundPlant = props.plants.find(p => p.id === props.plantId);
  if (foundPlant) {
    plant.value = foundPlant;
    species.value = SPECIES_CATALOG.find(s => s.id === foundPlant.speciesId) || SPECIES_CATALOG[0];
    // Default show latest photo
    if (foundPlant.photos && foundPlant.photos.length > 0) {
      activeFrameIndex.value = foundPlant.photos.length - 1;
    }
  } else {
    emit('close');
  }
}

// Watch plantId and plants for changes
watch([() => props.plantId, () => props.plants], () => {
  loadPlant();
}, { immediate: true, deep: true });

// Dynamic math properties based on selected plant and current weather
const potMultiplier = computed(() => {
  if (!plant.value) return 1.0;
  if (plant.value.potSize === 'small') return 0.85;
  if (plant.value.potSize === 'large') return 1.15;
  return 1.0;
});

const calculated = computed(() => {
  if (!plant.value) return { intervalDays: 0, capacityMl: 0, dailyETMl: 0 };
  return calculateWatering(plant.value.speciesId, plant.value.potSize, props.weatherFactor);
});

// Photo selection display
const displayedPhotoUrl = computed(() => {
  if (!plant.value || !plant.value.photos || plant.value.photos.length === 0) {
    return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%232D6514"><circle cx="50" cy="50" r="40" fill="%23104908"/><path d="M50,75 L50,25 Q50,45 60,35 Q50,55 50,75" stroke="white" stroke-width="4"/></svg>';
  }
  return plant.value.photos[activeFrameIndex.value]?.url;
});

// Water action
async function handleWater() {
  if (!plant.value) return;
  const updated = await waterPlant(plant.value.id);
  if (updated) {
    plant.value.lastWatered = updated.lastWatered;
    emit('plantUpdated');
    
    // Confetti effect
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#D5D170', '#AAB952', '#7C9D39', '#528124', '#2D6514']
    });
  }
}

// Webcam Capture Action
async function startWebcam() {
  cameraActive.value = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: 400, height: 400 },
      audio: false
    });
    streamInstance = stream;
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
    }
  } catch (err) {
    console.error('Webcam error:', err);
    alert(locale.value === 'vi' ? 'Máy ảnh không khả dụng. Sử dụng chức năng Mô phỏng chụp thay thế.' : 'Webcam not available. Using Simulated Capture instead.');
    cameraActive.value = false;
    captureMockPhoto();
  }
}

function stopWebcam() {
  if (streamInstance) {
    streamInstance.getTracks().forEach(track => track.stop());
    streamInstance = null;
  }
  cameraActive.value = false;
}

function captureWebcamPhoto() {
  if (!videoRef.value) return;
  
  const canvas = document.createElement('canvas');
  canvas.width = videoRef.value.videoWidth || 400;
  canvas.height = videoRef.value.videoHeight || 400;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);
  
  const imgUrl = canvas.toDataURL('image/jpeg', 0.85);
  stopWebcam();
  saveCapturedPhoto(imgUrl);
}

// Generate Growth SVG fallback photo
function captureMockPhoto() {
  if (!plant.value) return;
  
  // Growth stage increases as they capture more photos
  const numPhotos = plant.value.photos.length;
  // stage 1 for sprout, stage 2 for intermediate, stage 3 for mature
  let stage = 1;
  if (numPhotos === 1) stage = 2;
  else if (numPhotos >= 2) stage = 3;
  
  const mockUrl = getMockPlantSVG(plant.value.speciesId, stage);
  saveCapturedPhoto(mockUrl);
}

// Common function to register captured image in DB
async function saveCapturedPhoto(photoUrl) {
  const result = await addPhotoToPlant(plant.value.id, photoUrl);
  if (result) {
    plant.value = result.plant;
    showCameraPanel.value = false;
    emit('plantUpdated');
    
    // Set index to the newly added photo
    activeFrameIndex.value = plant.value.photos.length - 1;
    
    // Fire confetti for photo captures
    confetti({
      particleCount: 60,
      spread: 50,
      origin: { y: 0.8 },
      colors: ['#D5D170', '#AAB952', '#7C9D39']
    });

    if (result.streakMilestone) {
      setTimeout(() => {
        alert(locale.value === 'vi' ? '🎉 Đạt cột mốc mới! Bạn đã nhận phần thưởng chuỗi hàng tuần: +50 Xu Tre!' : '🎉 Milestone reached! You earned a weekly streak milestone bonus: +50 Bamboo Coins!');
      }, 500);
    }
  }
}

function toggleCameraPanel() {
  showCameraPanel.value = !showCameraPanel.value;
  if (!showCameraPanel.value) {
    stopWebcam();
  }
}

// Delete Plant Pot
async function confirmDelete() {
  if (confirm(locale.value === 'vi' ? `Bạn có chắc chắn muốn xóa "${plant.value.name}" khỏi bộ sưu tập?` : `Are you sure you want to remove "${plant.value.name}" from your collection?`)) {
    const success = await deletePlant(plant.value.id);
    if (success) {
      emit('plantUpdated');
      emit('close');
    }
  }
}

// Timelapse logic
function toggleTimelapse() {
  if (isTimelapsePlaying.value) {
    pauseTimelapse();
  } else {
    playTimelapse();
  }
}

function playTimelapse() {
  if (!plant.value || !plant.value.photos || plant.value.photos.length === 0) return;
  
  isTimelapsePlaying.value = true;
  
  // If we're at the last frame, start over
  if (activeFrameIndex.value >= plant.value.photos.length - 1) {
    activeFrameIndex.value = 0;
  }
  
  const run = () => {
    if (!isTimelapsePlaying.value) return;
    
    if (activeFrameIndex.value < plant.value.photos.length - 1) {
      activeFrameIndex.value++;
      timelapseTimer = setTimeout(run, timelapseIntervalMs.value);
    } else {
      // Loop back or stop
      isTimelapsePlaying.value = false;
    }
  };
  
  timelapseTimer = setTimeout(run, timelapseIntervalMs.value);
}

function pauseTimelapse() {
  isTimelapsePlaying.value = false;
  if (timelapseTimer) {
    clearTimeout(timelapseTimer);
    timelapseTimer = null;
  }
}

// Monitor speed changes to adjust active timer interval
watch(timelapseIntervalMs, () => {
  if (isTimelapsePlaying.value) {
    pauseTimelapse();
    playTimelapse();
  }
});

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString(locale.value === 'vi' ? 'vi-VN' : 'en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

onBeforeUnmount(() => {
  pauseTimelapse();
  stopWebcam();
});
</script>

<style scoped>
.plant-detail {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 16px;
  overflow-y: auto;
  gap: 16px;
  height: 100%;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
}

.back-btn:hover {
  color: var(--text-primary);
}

.delete-btn-ghost {
  color: var(--text-muted);
  padding: 8px;
  border-radius: 8px;
}

.delete-btn-ghost:hover {
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Showcase Card */
.showcase-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.showcase-img-container {
  width: 100%;
  height: 280px;
  position: relative;
  background: #000;
}

.showcase-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.showcase-overlay {
  position: absolute;
  bottom: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.species-tag {
  background: rgba(16, 73, 8, 0.85);
  backdrop-filter: blur(4px);
  color: var(--accent);
  border: 1px solid rgba(213, 209, 112, 0.2);
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.pot-tag {
  background: rgba(0, 0, 0, 0.65);
  color: white;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
}

.pot-tag.small { border: 1px solid var(--c-olive-green); }
.pot-tag.medium { border: 1px solid var(--c-medium-forest); }
.pot-tag.large { border: 1px solid var(--c-dark-forest); }

.timelapse-status {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(255, 10, 10, 0.8);
  color: white;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.pulse-red {
  width: 8px;
  height: 8px;
  background: white;
  border-radius: 50%;
  animation: pulse-red-anim 1s infinite alternate;
}

@keyframes pulse-red-anim {
  0% { transform: scale(0.8); opacity: 0.5; }
  100% { transform: scale(1.2); opacity: 1; }
}

.showcase-details {
  padding: 16px;
}

.plant-name {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.species-scientific {
  font-size: 14px;
  color: var(--text-secondary);
  font-style: italic;
  margin-bottom: 12px;
}

.species-desc {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.45;
}

/* Action button grid */
.action-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.action-btn.water {
  background: var(--c-medium-forest);
  color: white;
  border: 1px solid rgba(82, 129, 36, 0.4);
}

.action-btn.water:hover {
  background: var(--c-olive-green);
}

.action-btn.photo {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  color: var(--accent);
}

.action-btn.photo:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: var(--accent);
}

/* Camera Panel overlay drawer */
.camera-panel {
  padding: 16px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  border-bottom: 1px solid var(--border-glass);
  padding-bottom: 8px;
}

.panel-header h4 {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--accent-secondary);
  letter-spacing: 0.05em;
}

.close-panel-btn {
  color: var(--text-secondary);
}

.camera-workspace {
  background: rgba(0,0,0,0.3);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.video-preview-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.webcam-view {
  width: 100%;
  height: 200px;
  border-radius: 8px;
  object-fit: cover;
  background: #000;
}

.btn-snap {
  background: var(--c-medium-forest);
  color: white;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.camera-fallback-options {
  text-align: center;
}

.camera-hint {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 14px;
  line-height: 1.4;
}

.btn-group-row {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.workspace-btn {
  padding: 10px 16px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.workspace-btn.highlight {
  background: rgba(82, 129, 36, 0.3);
  border-color: var(--accent-secondary);
  color: var(--accent);
}

.btn-cancel-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.btn-cancel-webcam {
  font-size: 12px;
  color: #ff6b6b;
  padding: 4px 8px;
  background: rgba(255, 107, 107, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.25);
  border-radius: 6px;
}

/* Timelapse Player */
.timelapse-panel {
  padding: 16px;
}

.title-with-badge {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-icon {
  color: var(--accent);
}

.timelapse-panel h3 {
  font-size: 15px;
  font-weight: 600;
}

.photo-count-badge {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 8px;
  border-radius: 8px;
  color: var(--text-secondary);
}

.empty-timelapse {
  padding: 24px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13.5px;
}

.timelapse-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 8px;
}

.playback-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.playback-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(82, 129, 36, 0.2);
  border: 1px solid var(--border-glass);
  color: var(--accent);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
}

.playback-btn:hover {
  background: rgba(82, 129, 36, 0.35);
  transform: scale(1.05);
}

.scrubber-container {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.scrubber-slider {
  width: 100%;
  height: 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 3px;
  outline: none;
  appearance: none;
  cursor: pointer;
}

.scrubber-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 6px var(--accent);
  cursor: pointer;
}

.frame-date {
  font-size: 11px;
  color: var(--text-secondary);
}

.timelapse-speed {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12.5px;
  color: var(--text-secondary);
  border-top: 1px solid rgba(255,255,255,0.04);
  padding-top: 12px;
}

.speed-selector {
  display: flex;
  gap: 6px;
}

.speed-btn {
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.03);
  font-size: 11px;
  border: 1px solid var(--border-glass);
  color: var(--text-secondary);
}

.speed-btn.active {
  background: rgba(82, 129, 36, 0.3);
  color: var(--accent);
  border-color: var(--accent-secondary);
}

/* Math Panel */
.math-panel {
  padding: 16px;
}

.math-panel h3 {
  font-size: 15px;
  font-weight: 600;
}

.math-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.formula-box {
  background: rgba(1, 45, 4, 0.35);
  border: 1px solid var(--border-glass);
  padding: 10px 14px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.formula-item.title {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
}

.formula-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  font-family: monospace;
}

.math-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.math-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
}

.math-row.highlight {
  color: var(--text-primary);
}

.text-accent {
  color: var(--accent);
  font-weight: 600;
}

.math-divider {
  height: 1px;
  background: var(--border-glass);
  margin: 4px 0;
}

.final-result {
  background: rgba(82, 129, 36, 0.15);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px dashed var(--accent-secondary);
  margin-top: 4px;
}

.final-days {
  color: var(--accent);
  font-size: 16px;
  font-weight: 700;
}

.font-bold {
  font-weight: 500;
}
</style>
