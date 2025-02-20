<template>
  <el-dialog
    v-model="dialogVisible"
    :title="type === 'input' ? '选择输入模块' : '选择输出模块'"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="true"
    @close="handleCancel"
    destroy-on-close
  >
    <div class="search-bar">
      <el-input
        v-model="searchText"
        placeholder="搜索模块..."
        :prefix-icon="Search"
        clearable
      />
      <el-select
        v-model="filterCategory"
        placeholder="选择分类"
        clearable
        style="margin-left: 10px; width: 120px"
      >
        <el-option
          v-for="category in categories"
          :key="category.value"
          :label="category.label"
          :value="category.value"
        />
      </el-select>
    </div>

    <div class="module-list">
      <el-radio-group v-model="selectedModuleId">
        <el-scrollbar height="400px">
          <div
            v-for="module in filteredModules"
            :key="module.id"
            class="module-item"
            :class="{ selected: selectedModuleId === module.id }"
          >
            <el-radio :value="module.id">
              <div class="module-info">
                <div class="module-name">{{ module.name }}</div>
                <div class="module-desc">{{ module.description }}</div>
              </div>
            </el-radio>
          </div>
        </el-scrollbar>
      </el-radio-group>
    </div>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSelect">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Module, Port } from '@/types/workflow'
import { ElMessage } from 'element-plus'
import { Search, Star, Connection } from '@element-plus/icons-vue'

interface ModuleWithCategory extends Module {
  categoryId: string
}

interface Category {
  id: string
  name: string
  icon: string
  expanded: boolean
}

const props = defineProps<{
  show: boolean
  type: 'input' | 'output'
  modules: ModuleWithCategory[]
}>()

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void
  (e: 'select', moduleId: string): void
  (e: 'cancel'): void
}>()

const dialogVisible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value)
})

const selectedModuleId = ref<string>('')
const searchText = ref('')
const filterCategory = ref('')

// 获取所有可用的分类
const categories = computed(() => {
  const categorySet = new Set(props.modules.map(m => m.categoryId))
  const categoryList = Array.from(categorySet)
  return [
    { value: '', label: '全部分类' },
    ...categoryList.map(id => ({
      value: id,
      label: id === 'basic' ? '基础模块' :
            id === 'control' ? '控制流' :
            id === 'data' ? '数据处理' :
            id === 'ai' ? 'AI处理' :
            id === 'content' ? '内容生成' :
            id === 'tools' ? '工具模块' : id
    }))
  ]
})

// 过滤模块
const filteredModules = computed(() => {
  return props.modules.filter(module => {
    const matchSearch = !searchText.value || 
      module.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      module.description.toLowerCase().includes(searchText.value.toLowerCase())
    
    const matchCategory = !filterCategory.value || module.categoryId === filterCategory.value
    
    return matchSearch && matchCategory
  })
})

const handleSelect = () => {
  if (!selectedModuleId.value) {
    ElMessage.warning('请选择一个模块')
    return
  }
  emit('select', selectedModuleId.value)
  dialogVisible.value = false
}

const handleCancel = () => {
  emit('cancel')
  dialogVisible.value = false
}

// 当模块列表变化时重置选择
watch(() => props.modules, () => {
  selectedModuleId.value = ''
}, { deep: true })

// 当对话框显示时打印可用模块
watch(() => props.show, (newValue) => {
  if (newValue) {
    console.log('可用模块列表:', props.modules)
  } else {
    selectedModuleId.value = ''
    searchText.value = ''
    filterCategory.value = ''
  }
})

const getTagType = (category: string) => {
  const types: Record<string, string> = {
    '数据处理': 'primary',
    '机器学习': 'success',
    'API': 'warning',
    '工具': 'info',
    '控制流': 'danger',
    '基础模块': ''
  }
  return types[category] || 'info'
}

const getPortTagType = (port: Port) => {
  if (port.required) return 'danger'
  if (port.multiple) return 'warning'
  return 'info'
}
</script>

<style scoped>
.search-bar {
  display: flex;
  margin-bottom: 15px;
}

.module-list {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}

.module-item {
  padding: 12px;
  border-bottom: 1px solid var(--el-border-color);
  transition: background-color 0.2s;
}

.module-item:last-child {
  border-bottom: none;
}

.module-item:hover {
  background-color: var(--el-fill-color-light);
}

.module-item.selected {
  background-color: var(--el-color-primary-light-9);
}

.module-info {
  margin-left: 8px;
}

.module-name {
  font-weight: 500;
  margin-bottom: 4px;
}

.module-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style> 