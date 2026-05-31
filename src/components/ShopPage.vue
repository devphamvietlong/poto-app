<template>
  <div class="shop-page">
    <div class="animate-fade-in" style="display: flex; flex-direction: column; gap: 16px;">
      <!-- Header -->
      <div class="section-header" style="margin-bottom: 4px;">
        <h3>{{ t('shop.title') }}</h3>
        <div class="coin-balance-display glass-card" style="display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 10px;">
          <CoinsIcon :size="16" class="text-accent" style="color: var(--accent);" />
          <span style="font-size: 13.5px; font-weight: 700; color: var(--accent);">{{ stats.bambooCoins }} {{ t('shop.coinsLabel') }}</span>
        </div>
      </div>

      <!-- Search & Filter Row -->
      <div class="search-filter-row" style="margin-bottom: 4px;">
        <div class="search-input-wrapper">
          <SearchIcon :size="16" />
          <input 
            type="text" 
            v-model="searchQuery" 
            :placeholder="t('shop.searchPlaceholder')" 
          />
        </div>
        <select v-model="categoryFilter" class="filter-select">
          <option value="all">{{ t('shop.categories.all') }}</option>
          <option value="pot">{{ t('shop.categories.pot') }}</option>
          <option value="pearl_pot">{{ t('shop.categories.pearl_pot') }}</option>
          <option value="plant">{{ t('shop.categories.plant') }}</option>
          <option value="flower">{{ t('shop.categories.flower') }}</option>
          <option value="digital">{{ t('shop.categories.digital') }}</option>
          <option value="coins">{{ t('shop.categories.coins') }}</option>
        </select>
      </div>

      <!-- Shop Grid -->
      <div class="shop-grid" style="margin-bottom: 24px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;">
        <div 
          v-for="product in groupedProducts" 
          :key="product.sku" 
          class="shop-card glass-card"
          style="padding: 16px 12px; display: flex; flex-direction: column; justify-content: space-between; align-items: center;"
          @click="openShopProduct(product)"
        >
          <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
            <div class="shop-img-holder" style="width: 60px; height: 60px; margin-bottom: 8px; background: rgba(255,255,255,0.03); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-glass); overflow: hidden;">
              <img v-if="product.variants[0] && product.variants[0].image_url" :src="product.variants[0].image_url" style="width: 100%; height: 100%; object-fit: cover;" :alt="product.name_en" />
              <component v-else :is="getProductIcon(product.category)" :size="32" style="color: var(--accent);" />
            </div>
            <span class="shop-name" style="font-size: 13px; font-weight: 600; display: block; text-align: center; color: var(--text-primary);">{{ locale === 'en' ? product.name_en : product.name_vi }}</span>
            <span class="shop-name-vi" style="font-size: 10.5px; color: var(--text-muted); display: block; text-align: center; margin-top: 2px; margin-bottom: 2px;">{{ locale === 'en' ? product.name_vi : product.name_en }}</span>
            <span v-if="product.variants.length > 1" style="font-size: 9.5px; font-weight: 600; color: var(--accent); background: rgba(170, 185, 82, 0.1); padding: 2px 6px; border-radius: 4px; margin-bottom: 8px;">
              {{ t('shop.sizesCount', { count: product.variants.length }) }}
            </span>
          </div>
          <div class="shop-pricing-info" style="display: flex; flex-direction: column; align-items: center; gap: 4px; width: 100%;">
            <span class="shop-price" style="font-size: 13px; font-weight: 700; color: var(--text-secondary);" v-if="product.variants[0] && product.variants[0].price > 0">
              <span v-if="product.variants.length > 1" style="font-size: 11px; font-weight: 500; color: var(--text-muted); text-transform: capitalize;">{{ t('shop.from') }} </span>
              {{ formatPrice(product.variants[0].price, product.category) }}
            </span>
            <span v-if="product.category === 'digital' && product.variants[0] && product.variants[0].coins_cost" class="shop-coins-cost" style="font-size: 10.5px; font-weight: 600; color: var(--accent); background: rgba(213,209,112,0.1); border: 1px solid rgba(213,209,112,0.2); padding: 3px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px;">
              <CoinsIcon :size="10" /> {{ product.variants[0].coins_cost }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="groupedProducts.length === 0" class="empty-state glass-card">
        <ShoppingBagIcon :size="48" class="empty-icon" />
        <h4>{{ t('shop.noProductsFound') }}</h4>
        <p>{{ t('shop.clearFilter') }}</p>
      </div>
    </div>

    <!-- Details Modal -->
    <div v-if="showShopModal" class="modal-overlay animate-fade-in" @click.self="showShopModal = false">
      <div class="modal-content glass-panel animate-slide-up" v-if="selectedProduct">
        <div class="modal-header">
          <h2>{{ locale === 'en' ? selectedProduct.name_en : selectedProduct.name_vi }}</h2>
          <button class="close-btn" @click="showShopModal = false"><XIcon :size="20" /></button>
        </div>
        <div class="modal-body modal-article-body">
          <div class="shop-detail-container">
            <div class="shop-detail-img" style="display: flex; justify-content: center; margin-bottom: 16px;">
              <div style="width: 120px; height: 120px; border-radius: 12px; background: rgba(255,255,255,0.03); display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-glass); overflow: hidden;">
                <img v-if="activeVariant && activeVariant.image_url" :src="activeVariant.image_url" style="width: 100%; height: 100%; object-fit: cover;" :alt="selectedProduct.name_en" />
                <component v-else :is="getProductIcon(selectedProduct.category)" :size="64" style="color: var(--accent);" />
              </div>
            </div>
            
            <div class="shop-meta-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <span class="shop-detail-price" style="font-size: 18px; font-weight: 700; color: var(--text-primary);" v-if="activeVariant && activeVariant.price > 0">
                {{ formatPrice(activeVariant.price, selectedProduct.category) }}
              </span>
              <span class="shop-detail-price" style="font-size: 18px; font-weight: 700; color: var(--accent);" v-else>
                {{ t('shop.freeDigital') }}
              </span>
              <span class="preview-value" style="font-size: 13px; color: #7C9D39; background: rgba(124, 157, 57, 0.1); padding: 2px 8px; border-radius: 4px; font-weight: 600;">
                {{ t('shop.inStock') }}
              </span>
            </div>

            <!-- Decoupled Size Selector Pills -->
            <div v-if="uniqueSizes.length > 1" class="variant-selector" style="margin-top: 8px; margin-bottom: 12px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); display: block; margin-bottom: 8px;">
                {{ t('shop.selectSize') }}
              </span>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <button 
                  v-for="sz in uniqueSizes" 
                  :key="sz"
                  class="size-pill-btn"
                  :class="{ 'active': selectedSize === sz }"
                  style="padding: 6px 12px; font-size: 12px; border-radius: 8px; border: 1px solid var(--border-glass); transition: all 0.2s;"
                  @click="selectSizeOption(sz)"
                >
                  {{ parseSizeLabel(sz) }}
                </button>
              </div>
            </div>

            <!-- Decoupled Color Selector Pills -->
            <div v-if="colorsForSelectedSize.length > 1 && !(colorsForSelectedSize.length === 1 && colorsForSelectedSize[0] === 'Standard')" class="variant-selector" style="margin-top: 8px; margin-bottom: 16px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); display: block; margin-bottom: 8px;">
                Select Color
              </span>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <button 
                  v-for="col in colorsForSelectedSize" 
                  :key="col"
                  class="size-pill-btn"
                  :class="{ 'active': selectedColor === col }"
                  style="padding: 6px 12px; font-size: 12px; border-radius: 8px; border: 1px solid var(--border-glass); transition: all 0.2s;"
                  @click="selectedColor = col"
                >
                  {{ col }}
                </button>
              </div>
            </div>

            <p style="margin-bottom: 6px; line-height: 1.5; color: var(--text-primary);">{{ locale === 'en' ? (selectedProduct.short_desc_en || selectedProduct.detailed_desc_en) : (selectedProduct.short_desc_vi || selectedProduct.detailed_desc_vi) }}</p>
            <p style="font-size: 12.5px; color: var(--text-muted); font-style: italic; line-height: 1.4; margin-bottom: 16px;">{{ locale === 'en' ? (selectedProduct.short_desc_vi || selectedProduct.detailed_desc_vi) : (selectedProduct.short_desc_en || selectedProduct.detailed_desc_en) }}</p>
            
            <div class="shop-detail-specs" style="margin-bottom: 20px;">
              <div class="shop-spec-item">
                <span class="shop-spec-lbl">{{ t('shop.categoryLabel') }}</span>
                <span class="shop-spec-val" style="text-transform: capitalize;">{{ selectedProduct.category.replace('_', ' ') }}</span>
              </div>
              <div class="shop-spec-item" v-if="activeVariant && activeVariant.size">
                <span class="shop-spec-lbl">{{ t('shop.dimensions') }}</span>
                <span class="shop-spec-val">{{ parseSizeDetail(activeVariant.size) }}</span>
              </div>
              <div class="shop-spec-item" v-if="selectedProduct.category === 'digital' && activeVariant && activeVariant.coins_cost">
                <span class="shop-spec-lbl">{{ t('shop.coinCostLabel') }}</span>
                <span class="shop-spec-val text-accent" style="color: var(--accent); font-weight: 700;">{{ activeVariant.coins_cost }} {{ t('general.coins') }}</span>
              </div>
            </div>

            <!-- Gamified Purchase Buttons -->
            <div style="display: flex; flex-direction: column; gap: 8px;" v-if="activeVariant">
              <button 
                v-if="selectedProduct.category === 'digital' && activeVariant.coins_cost"
                class="btn-purchase" 
                @click="purchaseProductWithCoins(selectedProduct)"
              >
                {{ t('shop.buyWithCoins', { coins: activeVariant.coins_cost }) }}
              </button>
              <button 
                v-else-if="selectedProduct.category !== 'digital' && activeVariant.price > 0"
                class="btn-purchase" 
                @click="mockCashPurchase"
              >
                {{ t('shop.orderNow', { price: formatPrice(activeVariant.price, selectedProduct.category) }) }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Sprout as SproutIcon, 
  Gift as GiftIcon, 
  Sparkles as SparklesIcon,
  Coins as CoinsIcon,
  Search as SearchIcon,
  ShoppingBag as ShoppingBagIcon,
  X as XIcon,
  Leaf as LeafIcon,
  Flower as FlowerIcon,
  Palette as PaletteIcon
} from '@lucide/vue';
import { purchaseProduct, addPlant, getShopProducts } from '../utils/db';
import { getMockPlantSVG } from '../utils/plantPainter';
import { useI18n } from '../utils/i18n';
import confetti from 'canvas-confetti';

const { locale, t } = useI18n();

const props = defineProps({
  plants: {
    type: Array,
    required: true
  },
  stats: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['plantWatered']);

const searchQuery = ref('');
const categoryFilter = ref('all');
const showShopModal = ref(false);
const selectedProduct = ref(null);
const shopProducts = ref([]);

const selectedSize = ref('');
const selectedColor = ref('');

function getProductIcon(category) {
  if (category === 'pot') return SproutIcon;
  if (category === 'pearl_pot') return GiftIcon;
  if (category === 'plant') return LeafIcon;
  if (category === 'flower') return FlowerIcon;
  if (category === 'digital') return PaletteIcon;
  return ShoppingBagIcon;
}

function formatPrice(price, category) {
  if (category === 'digital' || price === 0) return t('shop.freeDigital');
  return price.toLocaleString('vi-VN') + ' VNĐ';
}

async function loadProducts() {
  const data = await getShopProducts();
  shopProducts.value = data;
}

onMounted(() => {
  loadProducts();
});

// Computed products matching search and category filter
const filteredProducts = computed(() => {
  return shopProducts.value.filter(product => {
    // 1. Search Query
    const matchesSearch = 
      (product.name_en || '').toLowerCase().includes(searchQuery.value.toLowerCase()) || 
      (product.name_vi || '').toLowerCase().includes(searchQuery.value.toLowerCase()) || 
      (product.short_desc_en || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (product.short_desc_vi || '').toLowerCase().includes(searchQuery.value.toLowerCase());
    
    // 2. Category Filter
    let matchesCategory = true;
    if (categoryFilter.value === 'coins') {
      matchesCategory = product.category === 'digital' && product.variants && product.variants.some(v => !!v.coins_cost);
    } else if (categoryFilter.value !== 'all') {
      matchesCategory = product.category === categoryFilter.value;
    }

    return matchesSearch && matchesCategory;
  });
});

// Directly present structured catalog (variants grouped on backend!)
const groupedProducts = computed(() => {
  return filteredProducts.value;
});

// Compute unique size strings for active product
const uniqueSizes = computed(() => {
  if (!selectedProduct.value || !selectedProduct.value.variants) return [];
  const sizes = new Set();
  selectedProduct.value.variants.forEach(v => {
    sizes.add(v.size);
  });
  return Array.from(sizes);
});

// Compute unique color strings specific to selected size
const colorsForSelectedSize = computed(() => {
  if (!selectedProduct.value || !selectedProduct.value.variants || !selectedSize.value) return [];
  const colors = new Set();
  selectedProduct.value.variants
    .filter(v => v.size === selectedSize.value)
    .forEach(v => {
      colors.add(v.color);
    });
  return Array.from(colors);
});

// Resolve exact variant matching current selections
const activeVariant = computed(() => {
  if (!selectedProduct.value || !selectedProduct.value.variants) return null;
  if (!selectedSize.value || !selectedColor.value) return selectedProduct.value.variants[0];
  return selectedProduct.value.variants.find(
    v => v.size === selectedSize.value && v.color === selectedColor.value
  ) || selectedProduct.value.variants[0];
});

function parseSizeLabel(sizeStr) {
  if (!sizeStr) return t('shop.standardSize');
  const parts = sizeStr.split('(');
  return parts[0].trim();
}

function parseSizeDetail(sizeStr) {
  if (!sizeStr) return t('shop.notAvailable');
  const parts = sizeStr.split('(');
  if (parts.length > 1) {
    return parts[1].replace(')', '').replace(/\n/g, ', ').trim();
  }
  return sizeStr;
}

function openShopProduct(product) {
  selectedProduct.value = product;
  
  // Set initial selections
  const uniqueSzs = Array.from(new Set(product.variants.map(v => v.size)));
  selectedSize.value = uniqueSzs[0] || '';
  
  const availableColors = product.variants
    .filter(v => v.size === selectedSize.value)
    .map(v => v.color);
  selectedColor.value = availableColors[0] || 'Standard';
  
  showShopModal.value = true;
}

function selectSizeOption(sz) {
  selectedSize.value = sz;
  const availableColors = selectedProduct.value.variants
    .filter(v => v.size === sz)
    .map(v => v.color);
  selectedColor.value = availableColors[0] || 'Standard';
}

async function purchaseProductWithCoins(product) {
  if (!activeVariant.value) return;
  const activeVar = activeVariant.value;
  
  if (props.stats.bambooCoins < activeVar.coins_cost) {
    alert(t('shop.insufficientCoins', { needed: activeVar.coins_cost, current: props.stats.bambooCoins }));
    return;
  }
  
  const result = await purchaseProduct(activeVar.sku, activeVar.size, 'coins');
  
  if (result && result.success) {
    const productName = locale.value === 'en' ? product.name_en : product.name_vi;
    if (product.category === 'plant' || product.category === 'flower') {
      let speciesId = 'monstera';
      if (activeVar.sku === 'CAY00001') speciesId = 'snake';
      else if (activeVar.sku === 'CAY00002') speciesId = 'fig';
      else if (activeVar.sku === 'CAY00003') speciesId = 'monstera';
      else if (activeVar.sku === 'HOA00001') speciesId = 'pothos';
      else if (activeVar.sku === 'HOA00002') speciesId = 'succulent';
      
      const mockPhoto = getMockPlantSVG(speciesId, 1);
      await addPlant({
        name: `My ${product.name_en}`,
        speciesId: speciesId,
        potSize: activeVar.size.toLowerCase().includes('large') ? 'large' : (activeVar.size.toLowerCase().includes('medium') ? 'medium' : 'small'),
        initialPhotoUrl: mockPhoto
      });
      alert(t('shop.successPlant', { coins: activeVar.coins_cost, name: productName }));
    } else if (product.category === 'pot' || product.category === 'pearl_pot') {
      const mockPhoto = getMockPlantSVG('monstera', 1);
      await addPlant({
        name: `My Monstera in ${product.name_en}`,
        speciesId: 'monstera',
        potSize: activeVar.size.toLowerCase().includes('large') ? 'large' : (activeVar.size.toLowerCase().includes('medium') ? 'medium' : 'small'),
        initialPhotoUrl: mockPhoto
      });
      alert(t('shop.successPot', { coins: activeVar.coins_cost }));
    } else if (product.category === 'digital') {
      alert(t('shop.successDigital', { coins: activeVar.coins_cost, name: productName }));
    } else {
      alert(t('shop.successOther', { coins: activeVar.coins_cost }));
    }
    
    showShopModal.value = false;
    emit('plantWatered');
    
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#D5D170', '#AAB952', '#7C9D39']
    });
  } else {
    alert(t('shop.purchaseFailed'));
  }
}

async function mockCashPurchase() {
  if (!activeVariant.value) return;
  const product = selectedProduct.value;
  const activeVar = activeVariant.value;
  
  const result = await purchaseProduct(activeVar.sku, activeVar.size, 'cash');
  if (result && result.success) {
    const productName = locale.value === 'en' ? product.name_en : product.name_vi;
    if (product.category === 'plant' || product.category === 'flower') {
      let speciesId = 'monstera';
      if (activeVar.sku === 'CAY00001') speciesId = 'snake';
      else if (activeVar.sku === 'CAY00002') speciesId = 'fig';
      else if (activeVar.sku === 'CAY00003') speciesId = 'monstera';
      else if (activeVar.sku === 'HOA00001') speciesId = 'pothos';
      else if (activeVar.sku === 'HOA00002') speciesId = 'succulent';
      
      const mockPhoto = getMockPlantSVG(speciesId, 1);
      await addPlant({
        name: `My ${product.name_en}`,
        speciesId: speciesId,
        potSize: activeVar.size.toLowerCase().includes('large') ? 'large' : (activeVar.size.toLowerCase().includes('medium') ? 'medium' : 'small'),
        initialPhotoUrl: mockPhoto
      });
      alert(t('shop.cashSuccessPlant', { name: productName }));
    } else if (product.category === 'pot' || product.category === 'pearl_pot') {
      const mockPhoto = getMockPlantSVG('monstera', 1);
      await addPlant({
        name: `My Monstera in ${product.name_en}`,
        speciesId: 'monstera',
        potSize: activeVar.size.toLowerCase().includes('large') ? 'large' : (activeVar.size.toLowerCase().includes('medium') ? 'medium' : 'small'),
        initialPhotoUrl: mockPhoto
      });
      alert(t('shop.cashSuccessPot'));
    } else {
      alert(t('shop.cashSuccessOther'));
    }
    showShopModal.value = false;
    emit('plantWatered');
  } else {
    alert(t('shop.checkoutFailed'));
  }
}
</script>

<style scoped>
.shop-page {
  display: flex;
  flex-direction: column;
}
.size-pill-btn {
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-secondary);
  border: 1px solid var(--border-glass);
  cursor: pointer;
}
.size-pill-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}
.size-pill-btn.active {
  background: var(--accent);
  color: #111;
  border-color: var(--accent);
  font-weight: 700;
  box-shadow: 0 0 12px rgba(213, 209, 112, 0.3);
}
</style>
