<template>
  <div class="me-page animate-fade-in">
    <!-- Profile Card -->
    <div class="profile-card glass-card">
      <div class="profile-header">
        <div class="profile-avatar-large">
          <UserIcon :size="36" class="profile-avatar-icon" />
        </div>
        
        <!-- View Mode -->
        <div v-if="!isEditing">
          <h3 class="profile-name">{{ userName }}</h3>
          <p class="profile-email">{{ userEmail }}</p>
          <button 
            type="button" 
            class="empty-cta-btn" 
            style="padding: 6px 14px; font-size: 12px; margin-top: 8px; background: rgba(255,255,255,0.06); border: 1px solid var(--border-glass);" 
            @click="startEditing"
          >
            {{ t('me.editBtn') }}
          </button>
        </div>

        <!-- Edit Mode -->
        <div v-else class="profile-edit-inline">
          <div class="form-group" style="margin-bottom: 8px; text-align: left;">
            <label class="form-label" style="font-size: 11px;">{{ t('me.fieldName') }}</label>
            <input 
              type="text" 
              v-model="editName" 
              class="form-input" 
              style="padding: 8px 12px; font-size: 14px;" 
            />
          </div>
          <div class="form-group" style="margin-bottom: 12px; text-align: left;">
            <label class="form-label" style="font-size: 11px;">{{ t('me.fieldEmail') }}</label>
            <input 
              type="email" 
              v-model="editEmail" 
              class="form-input" 
              style="padding: 8px 12px; font-size: 14px;" 
            />
          </div>
          <div class="profile-edit-actions">
            <button class="btn-small-action save" @click="saveProfile">{{ t('general.save') }}</button>
            <button class="btn-small-action cancel" @click="cancelEditing">{{ t('general.cancel') }}</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Stats Dashboard Card -->
    <div class="me-stats-card glass-card">
      <h4 style="font-size: 14px; font-weight: 600; margin-bottom: 12px;">{{ t('me.statsTitle') }}</h4>
      <div class="me-stats-grid">
        <div class="me-stat-item">
          <span class="me-stat-val">{{ stats.bambooCoins }}</span>
          <span class="me-stat-lbl">{{ t('general.coins') }}</span>
        </div>
        <div class="me-stat-item">
          <span class="me-stat-val">{{ stats.streakWeeks }} {{ t('general.weeks') }}</span>
          <span class="me-stat-lbl">{{ t('general.streak') }}</span>
        </div>
        <div class="me-stat-item">
          <span class="me-stat-val">{{ plants.length }}</span>
          <span class="me-stat-lbl">{{ t('general.pots') }}</span>
        </div>
      </div>
    </div>

    <!-- Environmental Impact Card -->
    <div class="me-stats-card glass-card" style="display: flex; flex-direction: column; gap: 10px;">
      <h4 style="font-size: 14px; font-weight: 600;">{{ t('me.footprintTitle') }}</h4>
      <div class="impact-grid" style="grid-template-columns: 1fr 1fr; gap: 10px;">
        <div class="impact-card" style="padding: 10px;">
          <span class="impact-num" style="font-size: 18px;">{{ calculatedCO2 }} kg</span>
          <span class="impact-lbl" style="font-size: 9.5px;">{{ t('dashboard.co2Saved') }}</span>
        </div>
        <div class="impact-card" style="padding: 10px;">
          <span class="impact-num" style="font-size: 18px;">{{ calculatedBamboos }}</span>
          <span class="impact-lbl" style="font-size: 9.5px;">{{ t('dashboard.treesPlanted') }}</span>
        </div>
      </div>
    </div>

    <!-- Display Settings -->
    <div class="me-stats-card glass-card" style="display: flex; flex-direction: column; gap: 12px; padding: 16px;">
      <h4 style="font-size: 14px; font-weight: 600; color: var(--text-primary);">{{ t('me.displaySettings') }}</h4>
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.08); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);">
        <!-- Light Theme Tab -->
        <button 
          type="button"
          style="flex: 1; padding: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; font-weight: 600; border-radius: 8px; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);"
          :style="!isDark ? { background: 'var(--bg-card-solid)', color: 'var(--text-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } : { color: 'var(--text-muted)' }"
          @click="!isDark ? null : $emit('toggleTheme')"
        >
          <SunIcon :size="15" />
          <span>{{ t('me.lightMode') }}</span>
        </button>
        <!-- Dark Theme Tab -->
        <button 
          type="button"
          style="flex: 1; padding: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; font-weight: 600; border-radius: 8px; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);"
          :style="isDark ? { background: 'var(--bg-card-solid)', color: 'var(--text-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { color: 'var(--text-muted)' }"
          @click="isDark ? null : $emit('toggleTheme')"
        >
          <MoonIcon :size="15" />
          <span>{{ t('me.darkMode') }}</span>
        </button>
      </div>

      <!-- Segmented Language Switcher -->
      <h4 style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-top: 8px;">{{ t('me.langSettings') }}</h4>
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.08); padding: 4px; border-radius: 12px; border: 1px solid var(--border-glass);">
        <!-- English Tab -->
        <button 
          type="button"
          style="flex: 1; padding: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; font-weight: 600; border-radius: 8px; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);"
          :style="locale === 'en' ? { background: 'var(--bg-card-solid)', color: 'var(--text-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' } : { color: 'var(--text-muted)' }"
          @click="locale = 'en'"
        >
          <span>English</span>
        </button>
        <!-- Vietnamese Tab -->
        <button 
          type="button"
          style="flex: 1; padding: 8px; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; font-weight: 600; border-radius: 8px; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);"
          :style="locale === 'vi' ? { background: 'var(--bg-card-solid)', color: 'var(--text-primary)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' } : { color: 'var(--text-muted)' }"
          @click="locale = 'vi'"
        >
          <span>Tiếng Việt</span>
        </button>
      </div>
    </div>

    <!-- PWA Install Section -->
    <div v-if="canInstall" class="me-stats-card glass-card" style="display: flex; flex-direction: column; gap: 12px; padding: 16px;">
      <h4 style="font-size: 14px; font-weight: 600; color: var(--text-primary);">{{ t('me.pwaTitle') }}</h4>
      <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.4;">{{ t('me.pwaDesc') }}</p>
      <button 
        type="button"
        class="pwa-install-btn" 
        @click="$emit('installApp')"
      >
        <DownloadIcon :size="16" />
        <span>{{ t('me.pwaBtn') }}</span>
      </button>
    </div>

    <!-- Settings / Account Actions -->
    <div class="me-actions-list" style="margin-bottom: 24px;">
      <button class="me-btn me-btn-secondary" @click="handlePlaceholderAction('Change Password')">
        <KeyIcon :size="16" />
        {{ t('me.changePassword') }}
      </button>
      <button class="me-btn me-btn-secondary" @click="handlePlaceholderAction('Sign Out')">
        <LogOutIcon :size="16" />
        {{ t('me.signOut') }}
      </button>
      <button class="me-btn me-btn-danger" @click="handlePlaceholderAction('Delete Account')">
        <TrashIcon :size="16" />
        {{ t('me.deleteAccount') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { 
  User as UserIcon, 
  Key as KeyIcon, 
  LogOut as LogOutIcon, 
  Trash as TrashIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Download as DownloadIcon
} from '@lucide/vue';
import { updateProfile } from '../utils/db';
import { useI18n } from '../utils/i18n';

const props = defineProps({
  plants: {
    type: Array,
    required: true
  },
  stats: {
    type: Object,
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

const emit = defineEmits(['plantWatered', 'toggleTheme', 'installApp']);
const { t, locale } = useI18n();

const isEditing = ref(false);
const editName = ref('');
const editEmail = ref('');

const userName = computed(() => props.stats.name || 'Green Thumb');
const userEmail = computed(() => props.stats.email || '');

function startEditing() {
  editName.value = userName.value;
  editEmail.value = userEmail.value;
  isEditing.value = true;
}

async function saveProfile() {
  if (!editName.value.trim() || !editEmail.value.trim()) {
    alert(locale.value === 'vi' ? "Tên và email không được để trống." : "Name and email cannot be empty.");
    return;
  }
  const result = await updateProfile(editName.value, editEmail.value);
  if (result) {
    localStorage.setItem('poto_user_name', editName.value);
    localStorage.setItem('poto_user_email', editEmail.value);
    isEditing.value = false;
    // Trigger update so profile renders immediately in header
    emit('plantWatered');
  } else {
    alert(locale.value === 'vi' ? "❌ Cập nhật thông tin thất bại." : "❌ Failed to update profile on the server.");
  }
}

function cancelEditing() {
  isEditing.value = false;
}

// Sustainability calculations
const calculatedCO2 = computed(() => {
  return ((props.plants.length * 4.2) + (props.stats.streakWeeks * 2.1)).toFixed(1);
});

const calculatedBamboos = computed(() => {
  return props.plants.length + Math.floor(props.stats.streakWeeks / 2);
});

function handlePlaceholderAction(actionKey) {
  let actionName = '';
  if (actionKey === 'Change Password') {
    actionName = t('me.changePassword');
  } else if (actionKey === 'Sign Out') {
    actionName = t('me.signOut');
  } else if (actionKey === 'Delete Account') {
    actionName = t('me.deleteAccount');
  } else {
    actionName = actionKey;
  }
  alert(t('me.placeholderAlert', { action: actionName }));
}
</script>

<style scoped>
.me-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>
