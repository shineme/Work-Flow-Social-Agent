<template>
  <div class="workflow-toolbar">
    <el-button-group>
      <el-tooltip content="保存工作流" placement="bottom">
        <el-button @click="$emit('save')">
          <el-icon><DocumentAdd /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="加载工作流" placement="bottom">
        <el-button @click="$emit('load')">
          <el-icon><FolderOpened /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="导出工作流" placement="bottom">
        <el-button @click="$emit('export')">
          <el-icon><Download /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="导入工作流" placement="bottom">
        <el-button @click="$emit('import')">
          <el-icon><Upload /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="清空工作流" placement="bottom">
        <el-button @click="$emit('clear')">
          <el-icon><Delete /></el-icon>
        </el-button>
      </el-tooltip>
    </el-button-group>

    <el-divider direction="vertical" />

    <el-button-group>
      <el-tooltip content="放大" placement="bottom">
        <el-button @click="$emit('zoom-in')">
          <el-icon><ZoomIn /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="缩小" placement="bottom">
        <el-button @click="$emit('zoom-out')">
          <el-icon><ZoomOut /></el-icon>
        </el-button>
      </el-tooltip>
      
      <el-tooltip content="适应画布" placement="bottom">
        <el-button @click="$emit('zoom-fit')">
          <el-icon><FullScreen /></el-icon>
        </el-button>
      </el-tooltip>
    </el-button-group>

    <el-divider direction="vertical" />

    <el-button-group>
      <el-tooltip content="创建分组" placement="bottom">
        <el-button @click="$emit('create-group')">
          <el-icon><FolderAdd /></el-icon>
        </el-button>
      </el-tooltip>
    </el-button-group>

    <el-divider direction="vertical" />

    <el-button-group>
      <el-tooltip content="验证工作流" placement="bottom">
        <el-button @click="$emit('validate')">
          <el-icon><CircleCheck /></el-icon>
        </el-button>
      </el-tooltip>
    </el-button-group>
  </div>
</template>

<script setup lang="ts">
import {
  DocumentAdd,
  FolderOpened,
  Download,
  Upload,
  Delete,
  ZoomIn,
  ZoomOut,
  FullScreen,
  CircleCheck,
  FolderAdd
} from '@element-plus/icons-vue'

defineEmits<{
  (e: 'save'): void
  (e: 'load'): void
  (e: 'export'): void
  (e: 'import'): void
  (e: 'clear'): void
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'zoom-fit'): void
  (e: 'validate'): void
  (e: 'create-group'): void
}>()
</script>

<style scoped>
.workflow-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.el-divider {
  margin: 0 8px;
}

:deep(.el-button) {
  border-color: var(--border-color);
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  padding: 8px;
  height: 32px;
}

:deep(.el-button:hover) {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
  background-color: var(--bg-tertiary);
}

:deep(.el-button:focus) {
  background-color: var(--bg-tertiary);
}

:deep(.el-icon) {
  font-size: 16px;
}
</style> 