<template>
  <div
    :class="[
      'module-node',
      { selected: props.selected },
      { 'has-note': props.data.note }
    ]"
    @click="onNodeClick"
    @contextmenu="onContextMenu"
  >
    <div class="node-title" @dblclick="startEditing">
      <el-input
        v-if="isEditing"
        v-model="editingTitle"
        size="small"
        @blur="saveTitle"
        @keyup.enter="saveTitle"
        @keyup.esc="cancelEditing"
        v-focus
        :placeholder="props.data.module.name"
      />
      <div v-else class="title-display">
        <span class="custom-title">{{ props.data.title || props.data.module.name }}</span>
        <div class="title-actions">
          <el-tooltip content="添加备注" placement="top" :show-after="500">
            <el-icon class="action-icon" @click.stop="openNoteEditor">
              <DocumentAdd v-if="!props.data.note"/>
              <Document v-else />
            </el-icon>
          </el-tooltip>
          <el-tooltip content="双击编辑标题" placement="top" :show-after="500">
            <el-icon class="edit-icon"><Edit /></el-icon>
          </el-tooltip>
        </div>
      </div>
    </div>

    <div class="node-content">
      <div v-if="props.data.module.inputs?.length" class="input-ports">
        <div
          v-for="input in props.data.module.inputs"
          :key="input.id"
          class="port"
        >
          <Handle
            :id="input.id"
            type="target"
            :position="Position.Left"
            :style="getPortStyle(input)"
            :title="input.name"
          />
          <el-popover
            placement="left"
            :width="300"
            trigger="hover"
            :show-arrow="true"
            popper-class="port-popover"
          >
            <template #reference>
              <span class="port-name">{{ input.name }}</span>
            </template>
            <div class="port-info">
              <div class="info-item">
                <span class="info-label">类型：</span>
                <el-tag size="small" :type="getPortTypeColor(input.type)">
                  {{ input.type }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">描述：</span>
                <span class="info-value">{{ input.description }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">变量引用：</span>
                <div class="variable-container">
                  <el-tooltip content="支持在属性中使用此格式引用其他节点的输出" placement="top">
                    <el-tag size="small" type="info" class="variable-tag">
                      ${变量名}
                    </el-tag>
                  </el-tooltip>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">必需：</span>
                <el-tag size="small" :type="input.required ? 'danger' : 'info'">
                  {{ input.required ? '是' : '否' }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">多重连接：</span>
                <el-tag size="small" :type="input.multiple ? 'warning' : 'info'">
                  {{ input.multiple ? '是' : '否' }}
                </el-tag>
              </div>
            </div>
          </el-popover>
          <span
            v-if="isPortConnected(props.id, input.id, 'target')"
            class="port-connected"
          />
        </div>
      </div>

      <div class="node-header">
        <el-tag size="small" :type="getTagType(props.data.module.category)">
          {{ props.data.module.category }}
        </el-tag>
      </div>
      <p class="node-description">{{ props.data.module.description }}</p>

      <div v-if="props.data.module.outputs?.length" class="output-ports">
        <div
          v-for="output in props.data.module.outputs"
          :key="output.id"
          class="port"
        >
          <el-popover
            placement="right"
            :width="300"
            trigger="hover"
            :show-arrow="true"
            popper-class="port-popover"
          >
            <template #reference>
              <span class="port-name">{{ output.name }}</span>
            </template>
            <div class="port-info">
              <div class="info-item">
                <span class="info-label">类型：</span>
                <el-tag size="small" :type="getPortTypeColor(output.type)">
                  {{ output.type }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">描述：</span>
                <span class="info-value">{{ output.description }}</span>
              </div>
              <div class="info-item" v-if="output.variable">
                <span class="info-label">变量名：</span>
                <div class="variable-container">
                  <el-tag size="small" type="success" class="variable-tag">
                    {{ getVariableName(output.variable, props.id) }}
                    <el-icon class="copy-icon" @click.stop="copyVariable(output.variable, props.id)">
                      <DocumentCopy />
                    </el-icon>
                  </el-tag>
                  <el-tooltip content="点击复制变量引用" placement="top">
                    <div class="variable-reference" @click.stop="copyVariable(output.variable, props.id)">
                      ${<span class="reference-text">{{ getVariableName(output.variable, props.id) }}</span>}
                    </div>
                  </el-tooltip>
                </div>
              </div>
              <div class="info-item">
                <span class="info-label">必需：</span>
                <el-tag size="small" :type="output.required ? 'danger' : 'info'">
                  {{ output.required ? '是' : '否' }}
                </el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">多重连接：</span>
                <el-tag size="small" :type="output.multiple ? 'warning' : 'info'">
                  {{ output.multiple ? '是' : '否' }}
                </el-tag>
              </div>
            </div>
          </el-popover>
          <Handle
            :id="output.id"
            type="source"
            :position="Position.Right"
            :style="getPortStyle(output)"
            :title="output.name"
          />
          <span
            v-if="isPortConnected(props.id, output.id, 'source')"
            class="port-connected"
          />
        </div>
      </div>
    </div>

    <!-- 备注编辑对话框 -->
    <el-dialog
      v-model="showNoteEditor"
      title="节点备注"
      width="500px"
      :close-on-click-modal="false"
      append-to-body
      destroy-on-close
    >
      <div class="note-editor">
        <el-form>
          <el-form-item>
            <el-input
              v-model="editingNote"
              type="textarea"
              :rows="6"
              placeholder="请输入节点备注..."
              resize="none"
            />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelNote">取消</el-button>
          <el-button type="primary" @click="saveNote">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Position, useVueFlow, Handle } from '@vue-flow/core'
import type { NodeProps } from '@vue-flow/core'
import type { Module, Port } from '@/types/workflow'
import { Edit, Document, DocumentAdd, DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// 添加自定义指令
const vFocus = {
  mounted: (el: HTMLElement) => el.querySelector('input')?.focus()
}

const props = defineProps<NodeProps<{
  module: Module
  properties: Record<string, any>
  title?: string
  note?: string
}>>()

const { getEdges, setNodes, getNodes } = useVueFlow()

const isEditing = ref(false)
const editingTitle = ref('')

const startEditing = () => {
  editingTitle.value = props.data.title || props.data.module.name
  isEditing.value = true
}

const saveTitle = () => {
  const newTitle = editingTitle.value.trim()
  if (newTitle && newTitle !== props.data.module.name) {
    setNodes(nodes => 
      nodes.map(node => {
        if (node.id === props.id) {
          return {
            ...node,
            data: {
              ...node.data,
              title: newTitle
            }
          }
        }
        return node
      })
    )
  }
  isEditing.value = false
}

const cancelEditing = () => {
  isEditing.value = false
}

const getTagType = (category: string) => {
  const types: Record<string, string> = {
    '数据处理': 'primary',
    '机器学习': 'success',
    'API': 'warning',
    '工具': 'info',
    '系统': 'info'
  }
  return types[category] || 'info'
}

const getPortStyle = (port: Port) => ({
  background: port.type === 'any' ? 'var(--accent-secondary)' : 'var(--accent-primary)'
})

const isPortConnected = (nodeId: string, portId: string, type: 'source' | 'target') => {
  const edges = getEdges.value
  return edges.some(edge => {
    if (type === 'source') {
      return edge.source === nodeId && edge.sourceHandle === portId
    } else {
      return edge.target === nodeId && edge.targetHandle === portId
    }
  })
}

const onNodeClick = () => {
  console.log('Node clicked:', {
    id: props.id,
    data: props.data,
    selected: props.selected
  })
}

const onContextMenu = (event: MouseEvent) => {
  event.preventDefault()
}

const showNoteEditor = ref(false)
const editingNote = ref('')

const openNoteEditor = () => {
  editingNote.value = props.data.note || ''
  showNoteEditor.value = true
}

const saveNote = () => {
  const newNote = editingNote.value.trim()
  setNodes(nodes => 
    nodes.map(node => {
      if (node.id === props.id) {
        return {
          ...node,
          data: {
            ...node.data,
            note: newNote || null
          }
        }
      }
      return node
    })
  )
  showNoteEditor.value = false
}

const cancelNote = () => {
  showNoteEditor.value = false
}

const getPortTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'string': 'success',
    'number': 'warning',
    'boolean': 'danger',
    'array': 'primary',
    'object': 'info',
    'any': 'info'
  }
  return colors[type] || 'info'
}

// 获取带序号的变量名
const getVariableName = (baseVariable: string, nodeId: string) => {
  const nodes = getNodes.value
  const sameTypeNodes = nodes.filter(n => 
    n.data?.module?.type === props.data.module.type
  )
  
  if (sameTypeNodes.length === 1) {
    return baseVariable
  }
  
  const index = sameTypeNodes.findIndex(n => n.id === nodeId) + 1
  return `${baseVariable}${index}`
}

// 复制变量引用
const copyVariable = (baseVariable: string, nodeId: string) => {
  const variableName = getVariableName(baseVariable, nodeId)
  const reference = '${' + variableName + '}'
  navigator.clipboard.writeText(reference)
    .then(() => {
      ElMessage.success('变量引用已复制')
    })
    .catch(() => {
      ElMessage.error('复制失败')
    })
}

watch(() => props.data, (newData) => {
  console.log('Module data changed:', newData)
}, { deep: true })

watch(() => props.selected, (newSelected) => {
  console.log('Node selection changed:', newSelected)
})
</script>

<style scoped>
.module-node {
  background-color: var(--node-bg);
  border: 2px solid var(--node-border);
  border-radius: 8px;
  padding: 0;
  min-width: 200px;
  color: var(--text-primary);
  font-size: 12px;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.module-node:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transform: translateY(-1px);
}

.module-node.selected {
  border-color: var(--node-selected);
  box-shadow: 0 0 0 2px var(--node-selected);
}

.module-node.has-note {
  border-color: var(--accent-secondary);
}

.module-node.has-note::after {
  content: '';
  position: absolute;
  top: -6px;
  right: -6px;
  width: 12px;
  height: 12px;
  background-color: var(--accent-secondary);
  border-radius: 50%;
  border: 2px solid var(--bg-primary);
}

.node-title {
  padding: 4px 8px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--bg-tertiary);
  border-radius: 6px 6px 0 0;
}

.title-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 24px;
}

.custom-title {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary);
  flex: 1;
  margin-right: 8px;
}

.edit-icon {
  font-size: 14px;
  color: var(--text-secondary);
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
}

.title-display:hover .edit-icon {
  opacity: 1;
}

.title-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-icon {
  font-size: 14px;
  color: var(--text-secondary);
  opacity: 0;
  transition: opacity 0.2s;
  cursor: pointer;
}

.title-display:hover .action-icon {
  opacity: 1;
}

.action-icon:hover {
  color: var(--accent-primary);
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

.node-content {
  padding: 12px;
}

.port {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  position: relative;
  min-height: 32px;
  margin: 2px 0;
}

.port:hover {
  background-color: var(--bg-tertiary);
}

.port.connected {
  background-color: var(--bg-tertiary);
}

.port::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  background: var(--accent-primary);
  opacity: 0;
  border-radius: 4px;
  transition: opacity 0.2s ease;
}

.port:hover::before {
  opacity: 0.1;
}

.port.connected::before {
  opacity: 0.15;
}

.port-name {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
}

.port-type {
  font-size: 10px;
  color: var(--text-secondary);
  background-color: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.port:hover .port-type {
  background-color: var(--accent-primary);
  color: var(--bg-primary);
}

:deep(.vue-flow__handle) {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--node-bg);
  border: 2px solid var(--node-border);
  transition: all 0.2s ease;
}

:deep(.vue-flow__handle:hover) {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
  transform: scale(1.2);
}

:deep(.vue-flow__handle-connecting) {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
  transform: scale(1.2);
}

:deep(.vue-flow__handle-valid) {
  background-color: var(--success-color);
  border-color: var(--success-color);
}

:deep(.vue-flow__handle-invalid) {
  background-color: var(--error-color);
  border-color: var(--error-color);
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.node-description {
  color: var(--text-secondary);
  font-size: 12px;
  margin: 8px 0;
  line-height: 1.4;
}

.input-ports,
.output-ports {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.input-ports .port {
  padding-left: 20px;
}

.output-ports .port {
  padding-right: 20px;
}

.port-connected {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--success-color);
}

.note-editor {
  padding: 0 20px;
}

:deep(.el-dialog__body) {
  padding-top: 10px;
  padding-bottom: 10px;
}

:deep(.el-textarea__inner) {
  background-color: var(--bg-secondary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

:deep(.el-textarea__inner:focus) {
  border-color: var(--accent-primary);
}

.dialog-footer {
  text-align: right;
  margin-top: 20px;
}

:deep(.port-popover) {
  background-color: var(--bg-secondary);
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.port-info {
  padding: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-label {
  color: var(--text-secondary);
  font-size: 12px;
  width: 70px;
  flex-shrink: 0;
}

.info-value {
  color: var(--text-primary);
  font-size: 12px;
  flex: 1;
}

:deep(.el-tag--small) {
  height: 20px;
  padding: 0 6px;
  font-size: 11px;
}

.variable-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.variable-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.variable-tag:hover {
  transform: scale(1.05);
}

.copy-icon {
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.copy-icon:hover {
  color: var(--accent-primary);
  transform: scale(1.1);
}

.variable-reference {
  font-family: monospace;
  font-size: 12px;
  color: var(--text-secondary);
  background-color: var(--bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
}

.variable-reference:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}

.reference-text {
  color: var(--accent-primary);
}
</style> 