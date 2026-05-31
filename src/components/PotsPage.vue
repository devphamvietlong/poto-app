<template>
  <div class="pots-page animate-fade-in">
    <!-- Header -->
    <div class="section-header" style="margin-bottom: 12px;">
      <h3>{{ t('pots.title') }} ({{ filteredPlants.length }} / {{ plants.length }})</h3>
      <button class="add-btn-small" @click="emit('openAddModal')">
        <PlusIcon :size="16" /> {{ t('pots.addNew') }}
      </button>
    </div>

    <!-- Search & Filter Row -->
    <div class="search-filter-row" style="margin-bottom: 16px;">
      <div class="search-input-wrapper">
        <SearchIcon :size="16" />
        <input 
          type="text" 
          v-model="searchQuery" 
          :placeholder="t('pots.searchPlaceholder')" 
        />
      </div>
      <select v-model="speciesFilter" class="filter-select">
        <option value="all">{{ t('pots.allSpecies') }}</option>
        <option 
          v-for="spec in SPECIES_CATALOG" 
          :key="spec.id" 
          :value="spec.id"
        >
          {{ spec.name }}
        </option>
      </select>
    </div>

    <!-- Empty State -->
    <div v-if="filteredPlants.length === 0" class="empty-state glass-card">
      <SproutIcon :size="48" class="empty-icon" />
      <h4>{{ t('pots.noPotsFound') }}</h4>
      <p v-if="plants.length > 0">{{ t('pots.clearFilter') }}</p>
      <p v-else>{{ t('pots.setupFirst') }}</p>
      <button v-if="plants.length === 0" class="empty-cta-btn" @click="emit('openAddModal')">
        <PlusIcon :size="14" /> {{ t('pots.addPotBtn') }}
      </button>
    </div>

    <!-- Plants Grid/List -->
    <div v-else class="plants-grid" style="margin-bottom: 24px;">
      <div 
        v-for="plant in filteredPlants" 
        :key="plant.id" 
        class="plant-card glass-card"
        @click="emit('selectPlant', plant.id)"
      >
        <!-- Thumbnail -->
        <div class="plant-thumb-container">
          <img :src="plant.latestPhoto" alt="Plant Thumbnail" class="plant-thumb" />
          <div class="pot-badge" :class="plant.potSize">
            {{ plant.potSize.charAt(0).toUpperCase() }}
          </div>
        </div>
        
        <!-- Details -->
        <div class="plant-info">
          <h4 class="plant-name-txt">{{ plant.name }}</h4>
          <span class="plant-species-txt">{{ plant.species.name }}</span>
          
          <!-- Watering Status -->
          <div class="watering-status-container">
            <div class="status-indicator" :class="plant.wateringStatus.class"></div>
            <span class="status-txt" :class="plant.wateringStatus.class">
              {{ plant.wateringStatus.message }}
            </span>
          </div>
        </div>

        <!-- Quick Water Button -->
        <button 
          type="button"
          class="quick-water-btn"
          :class="{ 'thirsty': plant.wateringStatus.daysLeft <= 0 }"
          @click.stop="handleWater(plant.id)"
          title="Water plant"
        >
          <DropletIcon :size="18" />
        </button>
      </div>
    </div>

    <!-- Floating Action Button -->
    <button class="fab-btn" @click="emit('openAddModal')" title="Add New Plant Pot">
      <PlusIcon :size="28" />
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  Sprout as SproutIcon, 
  Plus as PlusIcon, 
  Droplet as DropletIcon,
  Search as SearchIcon
} from '@lucide/vue';
import { SPECIES_CATALOG, calculateWatering, waterPlant } from '../utils/db';
import { useI18n } from '../utils/i18n';
import confetti from 'canvas-confetti';

const { t } = useI18n();

const props = defineProps({
  plants: {
    type: Array,
    required: true
  },
  weatherFactor: {
    type: Number,
    required: true
  }
});

const emit = defineEmits(['openAddModal', 'selectPlant', 'plantWatered']);

const searchQuery = ref('');
const speciesFilter = ref('all');

// Computed list with watering details computed matching Dashboard.vue's format
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

// Apply Search and Category filter
const filteredPlants = computed(() => {
  return computedPlants.value.filter(plant => {
    // 1. Search Query
    const nameMatch = plant.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const speciesMatch = plant.species.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesSearch = nameMatch || speciesMatch;

    // 2. Species Filter
    const matchesSpecies = speciesFilter.value === 'all' || plant.speciesId === speciesFilter.value;

    return matchesSearch && matchesSpecies;
  });
});

function handleWater(plantId) {
  const result = waterPlant(plantId);
  if (result) {
    emit('plantWatered');
    
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#D5D170', '#AAB952', '#7C9D39', '#528124', '#2D6514']
    });
  }
}
</script>

<style scoped>
.pots-page {
  display: flex;
  flex-direction: column;
}
</style>
