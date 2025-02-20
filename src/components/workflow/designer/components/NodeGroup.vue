<template>
  <div 
    :class="[
      'node-group',
      { expanded: isExpanded }
    ]"
    :style="{
      borderColor: color,
      backgroundColor: `${color}10`
    }"
  >
    <div class="group-header" @click="toggleExpand">
      <div class="group-title">
        <el-input
          v-if="isEditing"
          v-model="editingTitle"
          size="small"
          @blur="saveTitle"
          @keyup.enter="saveTitle"
          @keyup.esc="cancelEditing"
          v-focus
          :placeholder="title"
        />
        <div v-else class="title-display" @dblclick="startEditing">
          <span class="title-text">{{ title }}</span>
          <el-tooltip content="双击编辑标题" placement="top" :show-after="500">
            <el-icon class="edit-icon"><Edit /></el-icon>
          </el-tooltip>
        </div>
      </div>
      <div class="group-actions">
        <el-tooltip content="选择颜色" placement="top">
          <div class="color-picker">
            <div 
              class="color-preview"
              :style="{ backgroundColor: color }"
              @click.stop="showColorPicker = true"
            ></div>
            <el-color-picker
              v-model="color"
              :predefine="predefineColors"
              size="small"
              v-if="showColorPicker"
              @change="updateColor"
              @click.stop
            />
          </div>
        </el-tooltip>
        <el-tooltip :content="isExpanded ? '收起' : '展开'" placement="top">
          <el-icon class="expand-icon" :class="{ expanded: isExpanded }">
            <ArrowDown />
          </el-icon>
        </el-tooltip>
      </div>
    </div>
    <div class="group-content" v-show="isExpanded">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Edit, ArrowDown } from '@element-plus/icons-vue'

const props = defineProps<{
  initialTitle: string
  initialColor?: string
  initialExpanded?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:title', value: string): void
  (e: 'update:color', value: string): void
  (e: 'update:expanded', value: boolean): void
}>()

// 标题编辑
const isEditing = ref(false)
const editingTitle = ref(props.initialTitle)
const title = ref(props.initialTitle)

const startEditing = () => {
  editingTitle.value = title.value
  isEditing.value = true
}

const saveTitle = () => {
  const newTitle = editingTitle.value.trim()
  if (newTitle) {
    title.value = newTitle
    emit('update:title', newTitle)
  }
  isEditing.value = false
}

const cancelEditing = () => {
  isEditing.value = false
}

// 颜色选择
const showColorPicker = ref(false)
const color = ref(props.initialColor || '#89b4fa')
const predefineColors = [
  '#89b4fa',
  '#94e2d5',
  '#f5c2e7',
  '#fab387',
  '#a6e3a1',
  '#eba0ac'
]

const updateColor = (value: string) => {
  color.value = value
  emit('update:color', value)
  showColorPicker.value = false
}

// 展开/收起
const isExpanded = ref(props.initialExpanded ?? true)

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  emit('update:expanded', isExpanded.value)
}

// 自定义指令
const vFocus = {
  mounted: (el: HTMLElement) => el.querySelector('input')?.focus()
}
</script>

<style scoped>
.node-group {
  border: 2px solid var(--accent-primary);
  border-radius: 8px;
  margin: 16px;
  transition: all 0.3s ease;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
}

.group-title {
  flex: 1;
  margin-right: 16px;
}

.title-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.edit-icon {
  font-size: 14px;
  color: var(--text-secondary);
  opacity: 0;
  transition: opacity 0.2s;
}

.title-display:hover .edit-icon {
  opacity: 1;
}

.group-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-picker {
  position: relative;
}

.color-preview {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  cursor: pointer;
}

:deep(.el-color-picker) {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
}

.expand-icon {
  font-size: 16px;
  color: var(--text-secondary);
  transition: transform 0.3s ease;
}

.expand-icon.expanded {
  transform: rotate(180deg);
}

.group-content {
  padding: 12px;
  border-top: 1px solid var(--border-color);
}

:deep(.el-input__wrapper) {
  background-color: var(--bg-secondary) !important;
  box-shadow: none !important;
  border: 1px solid var(--accent-primary);
}

:deep(.el-input__inner) {
  color: var(--text-primary) !important;
  height: 24px;
  font-size: 13px;
}
</style> 