<template>
  <div 
    class="module-panel" 
    ref="panelRef"
    :class="{ 'is-dragging': isDragging }"
    :style="{ width: `${panelWidth}px` }"
  >
    <div class="panel-header">
      <h3>可用模块</h3>
      <el-button type="primary" size="small" @click="$emit('reload')" :loading="loading">
        <template #icon>
          <el-icon><Refresh /></el-icon>
        </template>
        刷新
      </el-button>
    </div>

    <div v-if="loading" class="loading-state">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>正在加载模块...</span>
    </div>

    <template v-else>
      <div v-if="categories.length === 0" class="empty-state">
        <el-icon><Warning /></el-icon>
        <span>没有可用的模块</span>
        <el-button type="primary" size="small" @click="$emit('reload')">重试</el-button>
      </div>

      <div v-else class="module-categories">
        <div v-for="category in categories" :key="category.id" class="category-section">
          <div 
            class="category-header" 
            @click="toggleCategory(category.id)"
            :class="{ 'is-expanded': expandedCategories[category.id] }"
          >
            <el-icon><component :is="category.icon" /></el-icon>
            <span class="category-name">{{ category.name }}</span>
            <el-icon class="expand-icon"><ArrowDown /></el-icon>
          </div>
          
          <div 
            v-show="expandedCategories[category.id]"
            class="category-modules"
            :style="gridStyle"
          >
            <div
              v-for="module in getCategoryModules(category.id)"
              :key="module.id"
              class="module-item"
              draggable="true"
              @dragstart="onDragStart($event, module)"
            >
              <div class="module-header">
                <span class="module-name">{{ module.name }}</span>
                <el-tag size="small" :type="getTagType(module.type)" effect="dark">
                  {{ module.type }}
                </el-tag>
              </div>
              
              <p class="module-description">{{ module.description }}</p>
              
              <div class="module-ports">
                <div v-if="module.inputs?.length" class="port-group">
                  <span class="port-label">输入端口</span>
                  <div class="port-tags">
                    <el-tag 
                      v-for="input in module.inputs" 
                      :key="input.id"
                      size="small"
                      :type="getPortTagType(input)"
                      effect="plain"
                    >
                      {{ input.name }}
                      <el-tooltip 
                        v-if="input.required || input.multiple" 
                        :content="input.required ? '必需' : '可多重连接'"
                        placement="top"
                      >
                        <el-icon class="port-icon">
                          <component :is="input.required ? 'Star' : 'Connection'" />
                        </el-icon>
                      </el-tooltip>
                    </el-tag>
                  </div>
                </div>
                
                <div v-if="module.outputs?.length" class="port-group">
                  <span class="port-label">输出端口</span>
                  <div class="port-tags">
                    <el-tag 
                      v-for="output in module.outputs" 
                      :key="output.id"
                      size="small"
                      :type="getPortTagType(output)"
                      effect="plain"
                    >
                      {{ output.name }}
                      <el-tooltip 
                        v-if="output.multiple" 
                        content="可多重连接"
                        placement="top"
                      >
                        <el-icon class="port-icon"><Connection /></el-icon>
                      </el-tooltip>
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div 
      class="resize-handle" 
      @mousedown="startResize"
      @touchstart="startTouchResize"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { 
  Refresh, Loading, Warning, Star, Connection, ArrowDown,
  Switch, DataLine, Cpu, Edit, Tools
} from '@element-plus/icons-vue'
import type { Module, Port } from '@/types/workflow'

interface Category {
  id: string
  name: string
  icon: string
  expanded: boolean
}

interface ModuleWithCategory extends Module {
  categoryId: string
}

const props = defineProps<{
  modules: ModuleWithCategory[]
  loading: boolean
}>()

defineEmits<{
  (e: 'reload'): void
}>()

const panelRef = ref<HTMLElement | null>(null)
const columnCount = ref(1)
const STORAGE_KEY = 'module-panel-width'
const panelWidth = ref(Number(localStorage.getItem(STORAGE_KEY)) || 280)
const isDragging = ref(false)
const minWidth = 220
const maxWidth = 600

const categories = ref<Category[]>([])
const expandedCategories = ref<Record<string, boolean>>({})

// 加载分类
const loadCategories = async () => {
  try {
    const response = await fetch('/moduleRegistry.json')
    const data = await response.json()
    categories.value = data.categories || []
    // 初始化展开状态
    categories.value.forEach(category => {
      expandedCategories.value[category.id] = category.expanded
    })
  } catch (error) {
    console.error('加载分类失败:', error)
    categories.value = []
  }
}

// 切换分类展开状态
const toggleCategory = (categoryId: string) => {
  expandedCategories.value[categoryId] = !expandedCategories.value[categoryId]
}

// 获取分类下的模块
const getCategoryModules = (categoryId: string) => {
  return props.modules.filter(module => module.categoryId === categoryId)
}

// 计算最佳列数
const calculateColumns = (width: number) => {
  const minItemWidth = 280
  const gap = 8
  const padding = 16
  const availableWidth = width - padding
  
  if (availableWidth < minItemWidth + gap) {
    columnCount.value = 1
  } else if (availableWidth < (minItemWidth * 2) + (gap * 2)) {
    columnCount.value = 1
  } else if (availableWidth < (minItemWidth * 3) + (gap * 3)) {
    columnCount.value = 2
  } else {
    columnCount.value = 3
  }
}

// Grid布局样式
const gridStyle = computed(() => ({
  display: 'grid',
  gridTemplateColumns: `repeat(${columnCount.value}, minmax(0, 1fr))`,
  gap: '8px',
  padding: '8px',
  width: '100%'
}))

// 监听面板大小变化
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  loadCategories()
  if (panelRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        calculateColumns(entry.contentRect.width)
      }
    })
    resizeObserver.observe(panelRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

const getTagType = (type: string) => {
  const types: Record<string, string> = {
    'start': 'success',
    'end': 'danger',
    'control': 'warning',
    'function': 'primary'
  }
  return types[type] || 'info'
}

const getPortTagType = (port: Port) => {
  if (port.required) return 'danger'
  if (port.multiple) return 'warning'
  return 'info'
}

const onDragStart = (event: DragEvent, module: Module) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('application/json', JSON.stringify(module))
    event.dataTransfer.effectAllowed = 'move'
  }
}

// 开始拖拽
const startResize = (e: MouseEvent) => {
  e.preventDefault()
  isDragging.value = true
  const startX = e.clientX
  const startWidth = panelWidth.value
  
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    
    const delta = e.clientX - startX
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta))
    panelWidth.value = newWidth
    calculateColumns(newWidth)
    
    localStorage.setItem(STORAGE_KEY, String(newWidth))
  }
  
  const handleMouseUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = ''
  }
  
  document.body.style.cursor = 'col-resize'
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}

// 添加触摸事件处理
const startTouchResize = (e: TouchEvent) => {
  e.preventDefault()
  isDragging.value = true
  const startX = e.touches[0].clientX
  const startWidth = panelWidth.value
  
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging.value) return
    
    const delta = e.touches[0].clientX - startX
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + delta))
    panelWidth.value = newWidth
    calculateColumns(newWidth)
    localStorage.setItem(STORAGE_KEY, String(newWidth))
  }
  
  const handleTouchEnd = () => {
    isDragging.value = false
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  }
  
  document.addEventListener('touchmove', handleTouchMove)
  document.addEventListener('touchend', handleTouchEnd)
}
</script>

<style scoped>
.module-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
  overflow: hidden;
  position: relative;
  transition: width 0.05s ease;
}

.module-categories {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.category-section {
  margin-bottom: 1px;
  background-color: var(--bg-secondary);
}

.category-header {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  background-color: var(--bg-tertiary);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
  border-left: 2px solid transparent;
}

.category-header:hover {
  background-color: var(--border-color);
}

.category-header.is-expanded {
  border-left-color: var(--accent-primary);
}

.category-header .el-icon {
  margin-right: 6px;
  font-size: 14px;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.category-header:hover .el-icon {
  color: var(--text-primary);
}

.category-name {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 0.2s;
}

.category-header:hover .category-name {
  color: var(--text-primary);
}

.expand-icon {
  font-size: 12px;
  transition: transform 0.2s;
  color: var(--text-secondary);
}

.category-header.is-expanded .expand-icon {
  transform: rotate(180deg);
  color: var(--accent-primary);
}

.category-modules {
  background-color: var(--bg-secondary);
  transition: all 0.3s ease;
  padding: 4px;
}

.module-item {
  background-color: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 8px;
  cursor: move;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 4px;
}

.module-item:hover {
  background-color: var(--bg-tertiary);
  border-color: var(--accent-primary);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.module-name {
  color: var(--text-primary);
  font-weight: normal;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.module-description {
  color: var(--text-secondary);
  font-size: 11px;
  line-height: 1.3;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.module-ports {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.port-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.port-label {
  color: var(--text-secondary);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.port-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

:deep(.el-tag) {
  border: 1px solid transparent;
  padding: 0 4px;
  height: 20px;
  line-height: 18px;
  font-size: 11px;
}

:deep(.el-tag.el-tag--plain) {
  background-color: transparent;
  border-color: var(--border-color);
}

:deep(.el-tag.el-tag--plain:hover) {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.port-icon {
  margin-left: 2px;
  font-size: 10px;
}

/* 移动端适配 */
@media (max-width: 600px) {
  .module-categories {
    padding: 8px;
  }

  .category-header {
    padding: 8px;
  }

  .category-name {
    font-size: 13px;
  }

  .module-item {
    padding: 10px;
  }

  .module-name {
    font-size: 13px;
  }

  .module-description {
    font-size: 12px;
  }
}

/* 滚动条样式 */
.module-categories::-webkit-scrollbar {
  width: 4px;
}

.module-categories::-webkit-scrollbar-track {
  background: transparent;
}

.module-categories::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.module-categories::-webkit-scrollbar-thumb:hover {
  background: var(--accent-primary);
}

.module-panel.is-dragging {
  transition: none;
  user-select: none;
}

.resize-handle {
  position: absolute;
  right: -4px;
  top: 0;
  width: 8px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  z-index: 10;
}

.resize-handle::after {
  content: '';
  position: absolute;
  right: 4px;
  top: 0;
  width: 2px;
  height: 100%;
  background-color: var(--border-color);
  opacity: 0;
  transition: opacity 0.2s, background-color 0.2s;
}

.resize-handle:hover::after,
.module-panel:hover .resize-handle::after,
.module-panel.is-dragging .resize-handle::after {
  opacity: 1;
  background-color: var(--accent-primary);
}

.module-panel.is-dragging * {
  user-select: none;
}

.module-panel.is-dragging::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: transparent;
  z-index: 9;
}

.panel-header {
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-tertiary);
  flex-shrink: 0;
}

.panel-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 16px;
  font-weight: 600;
}

.loading-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  padding: 24px;
}

.loading-state .el-icon,
.empty-state .el-icon {
  font-size: 24px;
}
</style> 