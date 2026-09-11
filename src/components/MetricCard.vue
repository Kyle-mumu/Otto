<template>
  <div class="metric-card" :style="{ borderLeftColor: color }">
    <div class="metric-icon" :style="{ color }">
      <el-icon :size="24"><component :is="icon" /></el-icon>
    </div>
    <div class="metric-value">{{ value }}</div>
    <div class="metric-label">{{ label }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon: string
  color: string
}>()
</script>

<style scoped>
.metric-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border-left: 4px solid v-bind('color');
  transition: transform 0.15s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.metric-icon {
  margin-bottom: 4px;
}

.metric-value {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.metric-label {
  font-size: 13px;
  color: #6b7280;
}
</style>
