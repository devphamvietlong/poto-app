<template>
  <div class="modal-overlay animate-fade-in" @click.self="emit('close')">
    <div class="modal-content glass-panel animate-slide-up">
      <!-- Modal Header -->
      <div class="modal-header">
        <h2>{{ t('pots.titleAdd') }}</h2>
        <button class="close-btn" @click="emit('close')">
          <XIcon :size="24" />
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="modal-body">
        <!-- Name Input -->
        <div class="form-group">
          <label class="form-label" for="plant-name">{{ t('pots.fieldNickname') }}</label>
          <input 
            id="plant-name"
            v-model="name"
            type="text" 
            :placeholder="t('pots.nicknamePlaceholder')" 
            required 
            class="form-input"
          />
        </div>

        <!-- Species Selector -->
        <div class="form-group">
          <label class="form-label" for="plant-species">{{ t('pots.fieldSpecies') }}</label>
          <select 
            id="plant-species"
            v-model="speciesId" 
            class="form-input select-input"
            required
          >
            <option v-for="sp in SPECIES_CATALOG" :key="sp.id" :value="sp.id">
              {{ sp.name }} ({{ sp.speciesName }})
            </option>
          </select>
          <div v-if="selectedSpecies" class="species-preview-badge">
            <span class="preview-label">{{ t('shop.capacity') }}:</span>
            <span class="preview-value">{{ selectedSpecies.minVol }}ml - {{ selectedSpecies.maxVol }}ml</span>
          </div>
        </div>

        <!-- Pot Size Select -->
        <div class="form-group">
          <label class="form-label">{{ t('pots.fieldSize') }}</label>
          <div class="pot-size-selector">
            <label 
              v-for="size in ['small', 'medium', 'large']" 
              :key="size"
              :class="['pot-size-option', potSize === size ? 'active' : '']"
            >
              <input 
                type="radio" 
                name="potSize" 
                :value="size" 
                v-model="potSize"
                class="hidden-radio"
              />
              <span class="size-indicator" :class="size"></span>
              <span class="size-name">{{ t('pots.potSize.' + size) }}</span>
            </label>
          </div>
        </div>

        <!-- Plant Image Source Select -->
        <div class="form-group">
          <label class="form-label">{{ t('pots.fieldPhoto') }}</label>
          
          <!-- Image Preview Area -->
          <div class="photo-preview-box">
            <div v-if="cameraActive" class="video-container">
              <video ref="videoRef" autoplay playsinline class="camera-stream"></video>
              <button type="button" @click="capturePhoto" class="btn-capture">
                <CameraIcon :size="20" /> {{ locale === 'vi' ? 'Chụp ảnh' : 'Snap Photo' }}
              </button>
            </div>
            
            <div v-else-if="photoUrl" class="preview-img-container">
              <img :src="photoUrl" alt="Plant Preview" class="preview-img" />
              <button type="button" @click="clearPhoto" class="btn-clear-photo">
                <Trash2Icon :size="16" /> {{ t('pots.retakePhoto') }}
              </button>
            </div>

            <div class="empty-photo-placeholder" v-else>
              <SproutIcon :size="36" class="sprout-placeholder-icon" />
              <p>{{ locale === 'vi' ? 'Chưa chụp ảnh nào' : 'No photo captured yet' }}</p>
            </div>
          </div>

          <!-- Photo Actions -->
          <div v-if="!cameraActive" class="photo-actions-grid">
            <button type="button" @click="startCamera" class="photo-btn">
              <CameraIcon :size="16" /> {{ locale === 'vi' ? 'Máy ảnh' : 'Camera' }}
            </button>
            <button type="button" @click="generateMockPhoto" class="photo-btn">
              <SparklesIcon :size="16" /> {{ locale === 'vi' ? 'Vẽ mầm cây' : 'Draw Sprout' }}
            </button>
            <label class="photo-btn file-label">
              <UploadIcon :size="16" /> {{ locale === 'vi' ? 'Tải lên' : 'Upload' }}
              <input type="file" accept="image/*" @change="handleFileUpload" class="hidden-file-input" />
            </label>
          </div>
          
          <button v-else type="button" @click="stopCamera" class="btn-cancel-camera">
            {{ locale === 'vi' ? 'Hủy máy ảnh' : 'Cancel Camera' }}
          </button>
        </div>

        <!-- Submit Button -->
        <button type="submit" class="submit-btn" :disabled="!name.trim()">
          <PlusIcon :size="18" /> {{ t('pots.btnSubmit') }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { 
  X as XIcon, 
  Camera as CameraIcon, 
  Sparkles as SparklesIcon, 
  Upload as UploadIcon, 
  Trash2 as Trash2Icon, 
  Sprout as SproutIcon,
  Plus as PlusIcon
} from '@lucide/vue';
import { SPECIES_CATALOG, addPlant } from '../utils/db';
import { getMockPlantSVG } from '../utils/plantPainter';
import { useI18n } from '../utils/i18n';

const emit = defineEmits(['close', 'plantAdded']);
const { t, locale } = useI18n();

const name = ref('');
const speciesId = ref('monstera');
const potSize = ref('medium');
const photoUrl = ref('');

// Camera state
const cameraActive = ref(false);
const videoRef = ref(null);
let streamInstance = null;

const selectedSpecies = computed(() => {
  return SPECIES_CATALOG.find(s => s.id === speciesId.value);
});

// Access webcam
async function startCamera() {
  cameraActive.value = true;
  photoUrl.value = '';
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
    console.error('Webcam access error:', err);
    alert(locale.value === 'vi' ? 'Không thể truy cập máy ảnh. Sử dụng bản vẽ vector thay thế.' : 'Could not access camera. Using vector drawing fallback.');
    cameraActive.value = false;
    generateMockPhoto();
  }
}

function stopCamera() {
  if (streamInstance) {
    streamInstance.getTracks().forEach(track => track.stop());
    streamInstance = null;
  }
  cameraActive.value = false;
}

function capturePhoto() {
  if (!videoRef.value) return;
  
  const canvas = document.createElement('canvas');
  canvas.width = videoRef.value.videoWidth || 400;
  canvas.height = videoRef.value.videoHeight || 400;
  
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);
  
  photoUrl.value = canvas.toDataURL('image/jpeg', 0.85);
  stopCamera();
}

function clearPhoto() {
  photoUrl.value = '';
}

// Generate mock SVG
function generateMockPhoto() {
  // A newly added plant is at stage 1 (sprout)
  photoUrl.value = getMockPlantSVG(speciesId.value, 1);
}

// File upload
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    photoUrl.value = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Submit Form
async function handleSubmit() {
  if (!name.value.trim()) return;
  
  // If no photo, auto-generate a sprout mock photo
  if (!photoUrl.value) {
    generateMockPhoto();
  }
  
  const plantData = {
    name: name.value,
    speciesId: speciesId.value,
    potSize: potSize.value,
    initialPhotoUrl: photoUrl.value
  };
  
  await addPlant(plantData);
  emit('plantAdded');
  emit('close');
}

onBeforeUnmount(() => {
  stopCamera();
});
</script>

<style scoped>
.modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(1, 45, 4, 0.75);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: flex-end;
}

.modal-content {
  width: 100%;
  max-height: 92%;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-top-left-radius: 30px;
  border-top-right-radius: 30px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-bottom: none;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-glass);
}

.modal-header h2 {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-primary);
}

.close-btn {
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px 24px 30px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.select-input {
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23B0C4A4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
}

.species-preview-badge {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 8px 12px;
  background: rgba(213, 209, 112, 0.08);
  border: 1px solid rgba(213, 209, 112, 0.15);
  border-radius: 8px;
  margin-top: 6px;
}

.preview-label {
  color: var(--text-secondary);
}

.preview-value {
  color: var(--accent);
  font-weight: 600;
}

/* Pot Size radio buttons */
.pot-size-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.pot-size-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  background: rgba(16, 73, 8, 0.2);
  border: 1px solid var(--border-glass);
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.pot-size-option.active {
  background: rgba(82, 129, 36, 0.35);
  border-color: var(--accent);
  box-shadow: 0 0 8px rgba(213, 209, 112, 0.15);
}

.hidden-radio {
  position: absolute;
  opacity: 0;
}

.size-indicator {
  border-radius: 50%;
  background: var(--c-olive-green);
  margin-bottom: 8px;
  transition: transform 0.2s ease;
}

.size-indicator.small {
  width: 14px;
  height: 14px;
}

.size-indicator.medium {
  width: 20px;
  height: 20px;
}

.size-indicator.large {
  width: 26px;
  height: 26px;
}

.pot-size-option.active .size-indicator {
  transform: scale(1.15);
  background: var(--accent);
}

.size-name {
  font-size: 13px;
  font-weight: 500;
}

/* Camera and photos */
.photo-preview-box {
  width: 100%;
  height: 200px;
  background: rgba(1, 45, 4, 0.4);
  border: 2px dashed var(--border-glass);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.video-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.camera-stream {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.btn-capture {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--c-medium-forest);
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.3);
}

.preview-img-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.btn-clear-photo {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.6);
  color: #ff6b6b;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty-photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
}

.sprout-placeholder-icon {
  opacity: 0.4;
}

.photo-actions-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 10px;
}

.photo-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border-glass);
  border-radius: 10px;
  font-size: 13px;
  color: var(--text-secondary);
}

.photo-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
  border-color: var(--accent-secondary);
}

.file-label {
  position: relative;
  cursor: pointer;
}

.hidden-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.btn-cancel-camera {
  margin-top: 10px;
  padding: 10px;
  background: rgba(255, 107, 107, 0.15);
  color: #ff6b6b;
  border: 1px solid rgba(255, 107, 107, 0.3);
  border-radius: 10px;
  width: 100%;
  font-size: 13px;
}

.submit-btn {
  margin-top: 8px;
  background: var(--c-medium-forest);
  color: white;
  padding: 14px;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(82, 129, 36, 0.3);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.submit-btn:not(:disabled):hover {
  background: var(--c-olive-green);
}
</style>
