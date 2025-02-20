<template>
  <div class="properties-panel">
    <div class="panel-header">
      <h3>{{ props.node.data?.module?.name }} - 属性配置</h3>
    </div>

    <div class="panel-content">
      <div class="variables-section" v-if="hasVariables">
        <h4 class="section-title">
          <span>变量配置</span>
          <el-tooltip content="配置节点的输出变量名，用于在其他节点中引用" placement="top">
            <el-icon><InfoFilled /></el-icon>
          </el-tooltip>
        </h4>
        
        <div class="variables-list">
          <div v-for="output in props.node.data?.module?.outputs" :key="output.id" class="variable-item">
            <div class="variable-header">
              <span class="port-name">{{ output.name }}</span>
              <el-tag size="small" :type="getPortTypeColor(output.type)">{{ output.type }}</el-tag>
            </div>
            
            <el-input
              v-model="variables[output.id]"
              size="small"
              :placeholder="getDefaultVariableName(output)"
              @change="(value) => handleVariableChange(output.id, value)"
            >
              <template #prefix>
                <span class="variable-prefix">var:</span>
              </template>
              <template #suffix>
                <el-tooltip v-if="variableConflicts[output.id]" content="变量名重复，将自动添加后缀" placement="top">
                  <el-icon class="warning-icon"><Warning /></el-icon>
                </el-tooltip>
              </template>
            </el-input>
          </div>
        </div>
      </div>

      <el-form label-position="top">
        <template v-for="(prop, key) in props.node.data?.module?.properties" :key="key">
          <el-form-item :label="prop.description">
            <el-input 
              v-if="prop.type === 'string'" 
              v-model="properties[key]"
              :placeholder="prop.placeholder || prop.description"
              @change="(value: string) => updateProperties()"
            >
              <template #suffix v-if="prop.placeholder && prop.placeholder.includes('${')">
                <el-tooltip content="支持使用 ${变量名} 引用其他节点的输出" placement="top">
                  <el-icon><InfoFilled /></el-icon>
                </el-tooltip>
              </template>
            </el-input>
            
            <el-input-number 
              v-else-if="prop.type === 'number'"
              v-model="properties[key]"
              :min="(prop as ModuleProperty).min"
              :max="(prop as ModuleProperty).max"
              :step="(prop as ModuleProperty).step || 1"
              @change="(value: number) => updateProperties()"
            />
            
            <el-select
              v-else-if="prop.type === 'enum'"
              v-model="properties[key]"
              style="width: 100%"
              @change="(value: string) => updateProperties()"
            >
              <el-option
                v-for="opt in (prop as ModuleProperty).options"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>

            <template v-else-if="prop.type === 'api'">
              <el-input
                :model-value="getApiProperty(key, 'url')"
                placeholder="API地址"
                class="mb-2"
                @update:model-value="(value: string) => updateApiProperty(key, 'url', value)"
              />
              <el-input
                :model-value="getApiProperty(key, 'key')"
                placeholder="API密钥"
                class="mb-2"
                @update:model-value="(value: string) => updateApiProperty(key, 'key', value)"
              />
              <el-select
                :model-value="getApiProperty(key, 'method')"
                style="width: 100%"
                @update:model-value="(value: string) => updateApiProperty(key, 'method', value as 'GET' | 'POST')"
              >
                <el-option label="GET" value="GET" />
                <el-option label="POST" value="POST" />
              </el-select>
            </template>
          </el-form-item>
        </template>
      </el-form>

      <div class="port-info">
        <template v-if="props.node.data?.module?.inputs?.length">
          <div class="port-section">
            <h4>输入端口</h4>
            <div class="port-list">
              <div v-for="port in props.node.data.module.inputs" :key="port.id" class="port-item">
                <span class="port-name">{{ port.name }}</span>
                <el-tag 
                  size="small" 
                  :type="isPortConnected(port.id, 'target') ? 'success' : 'info'"
                >
                  {{ isPortConnected(port.id, 'target') ? '已连接' : port.type }}
                </el-tag>
              </div>
            </div>
          </div>
        </template>

        <template v-if="props.node.data?.module?.outputs?.length">
          <div class="port-section">
            <h4>输出端口</h4>
            <div class="port-list">
              <div v-for="port in props.node.data.module.outputs" :key="port.id" class="port-item">
                <span class="port-name">{{ port.name }}</span>
                <el-tag 
                  size="small" 
                  :type="isPortConnected(port.id, 'source') ? 'success' : 'info'"
                >
                  {{ isPortConnected(port.id, 'source') ? '已连接' : port.type }}
                </el-tag>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import type { Node } from '@vue-flow/core'
import type { Module, Port } from '@/types/workflow'
import { InfoFilled, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface ModuleProperty {
  type: 'string' | 'number' | 'enum' | 'api'
  description: string
  required?: boolean
  default?: any
  min?: number
  max?: number
  step?: number
  options?: Array<{
    label: string
    value: any
  }>
}

interface Properties {
  [key: string]: any
}

interface ApiProperty {
  url: string
  key: string
  method: 'GET' | 'POST'
}

const props = defineProps<{
  node: Node<{
    module: Module
    properties: Properties
  }>
}>()

const emit = defineEmits<{
  (e: 'update:properties', nodeId: string, properties: Properties): void
}>()

const { getEdges, getNodes } = useVueFlow()

const properties = ref<Properties>({})

// 变量相关状态
const variables = ref<Record<string, string>>({})
const variableConflicts = ref<Record<string, boolean>>({})

// 检查是否有变量配置
const hasVariables = computed(() => {
  return props.node.data?.module?.outputs?.some(output => output.variable !== undefined)
})

// 获取端口类型的颜色
const getPortTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    'string': 'success',
    'number': 'warning',
    'boolean': 'danger',
    'array': 'primary',
    'object': 'info',
    'any': 'info',
    'image': 'success',
    'text': 'primary'
  }
  return colors[type] || 'info'
}

// 检查变量名是否重复
const checkVariableConflict = (variableName: string, currentNodeId: string, outputId: string): boolean => {
  const nodes = getNodes.value
  return nodes.some(node => {
    if (node.id === currentNodeId) return false
    return node.data?.module?.outputs?.some((output: Port) => {
      const outputVar = variables.value[output.id] || output.variable || getDefaultVariableName(output)
      return outputVar === variableName
    })
  })
}

// 初始化变量
const initializeVariables = () => {
  if (!props.node.data?.module?.outputs) return
  
  // 检查节点是否已经有变量配置
  const existingVariables = props.node.data.properties?._variables || {}
  
  props.node.data.module.outputs.forEach(output => {
    // 如果已经有变量名，就使用现有的
    if (existingVariables[output.id]) {
      variables.value[output.id] = existingVariables[output.id]
    } else if (output.variable) {
      // 如果模块定义中有默认变量名，检查是否需要处理冲突
      checkAndHandleConflict(output.id, output.variable)
    } else {
      // 只有在没有现有变量名的情况下才生成新的
      const defaultName = `${props.node.data?.module?.type}_${output.id}`
      checkAndHandleConflict(output.id, defaultName)
    }
  })
}

// 检查并处理变量名冲突
const checkAndHandleConflict = (outputId: string, value: string) => {
  const hasConflict = checkVariableConflict(value, props.node.id, outputId)
  variableConflicts.value[outputId] = hasConflict

  if (hasConflict) {
    // 如果已经存在这个变量名，生成新的唯一名称
    const moduleType = props.node.data?.module?.type || ''
    const nodeId = props.node.id.split('-').pop() || ''
    const newValue = `${value}_${moduleType}_${nodeId}`
    variables.value[outputId] = newValue
    ElMessage.info(`变量名 "${value}" 已被使用，已自动重命名为 "${newValue}"`)
  } else {
    variables.value[outputId] = value
  }

  // 更新节点数据
  updateNodeVariables()
}

// 处理变量名变化
const handleVariableChange = (outputId: string, value: string) => {
  if (!value) {
    // 如果清空了变量名，使用默认的命名规则
    const defaultName = `${props.node.data?.module?.type}_${outputId}`
    checkAndHandleConflict(outputId, defaultName)
    return
  }

  // 检查变量名格式
  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
    ElMessage.warning('变量名只能包含字母、数字和下划线，且必须以字母开头')
    variables.value[outputId] = value.replace(/[^a-zA-Z0-9_]/g, '')
    return
  }

  checkAndHandleConflict(outputId, value)
}

// 修改获取默认变量名的逻辑
const getDefaultVariableName = (output: Port): string => {
  const moduleType = props.node.data?.module?.type || ''
  return output.variable || `${moduleType}_${output.id}`
}

// 更新节点的变量配置
const updateNodeVariables = () => {
  const updatedOutputs = props.node.data?.module?.outputs?.map(output => ({
    ...output,
    variable: variables.value[output.id] || output.variable
  }))

  emit('update:properties', props.node.id, {
    ...props.node.data?.properties,
    _variables: variables.value
  })
}

const initializeProperties = () => {
  if (!props.node.data?.module?.properties) {
    return
  }

  // 创建新的属性对象，避免直接修改响应式对象
  const newProperties: Properties = {}

  // 遍历模块定义的属性
  Object.entries(props.node.data.module.properties).forEach(([key, prop]) => {
    const typedProp = prop as ModuleProperty

    // 如果已经有值，使用现有值
    if (props.node.data?.properties && key in props.node.data.properties) {
      newProperties[key] = JSON.parse(JSON.stringify(props.node.data.properties[key]))
      return
    }

    // 否则设置默认值
    if ('default' in typedProp) {
      newProperties[key] = JSON.parse(JSON.stringify(typedProp.default))
    } else {
      // 根据类型设置默认值
      switch (typedProp.type) {
        case 'string':
          newProperties[key] = ''
          break
        case 'number':
          newProperties[key] = typedProp.min ?? 0
          break
        case 'enum':
          newProperties[key] = typedProp.options?.[0]?.value ?? null
          break
        case 'api':
          newProperties[key] = {
            url: '',
            key: '',
            method: 'POST'
          } as ApiProperty
          break
        default:
          newProperties[key] = null
      }
    }
  })

  // 一次性更新所有属性
  properties.value = newProperties
}

const updateProperties = () => {
  emit('update:properties', props.node.id, JSON.parse(JSON.stringify(properties.value)))
}

const isPortConnected = (portId: string, type: 'source' | 'target') => {
  const edges = getEdges.value
  return edges.some(edge => edge[type] === portId)
}

const getApiProperty = (key: string, field: keyof ApiProperty) => {
  if (!properties.value[key]) {
    properties.value[key] = {
      url: '',
      key: '',
      method: 'POST'
    } as ApiProperty
  }
  return (properties.value[key] as ApiProperty)[field]
}

const updateApiProperty = (key: string, field: keyof ApiProperty, value: string) => {
  if (!properties.value[key]) {
    properties.value[key] = {
      url: '',
      key: '',
      method: 'POST'
    } as ApiProperty
  }
  (properties.value[key] as ApiProperty)[field] = value as any
  updateProperties()
}

// 监听节点变化
watch(() => props.node.id, () => {
  initializeVariables()
  initializeProperties()
})

onMounted(() => {
  initializeVariables()
  initializeProperties()
})
</script>

<style scoped>
.properties-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-secondary);
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
}

.panel-header h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 16px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.port-info {
  margin-top: 24px;
}

.port-section {
  margin-bottom: 16px;
}

.port-section h4 {
  color: var(--text-primary);
  font-size: 14px;
  margin: 0 0 8px 0;
}

.port-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.port-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: var(--bg-tertiary);
  border-radius: 4px;
}

.port-name {
  color: var(--text-primary);
  font-size: 12px;
}

.mb-2 {
  margin-bottom: 8px;
}

:deep(.el-form-item__label) {
  color: var(--text-secondary);
}

:deep(.el-input__inner),
:deep(.el-input-number__decrease),
:deep(.el-input-number__increase),
:deep(.el-select__input) {
  background-color: var(--bg-tertiary);
  border-color: var(--border-color);
  color: var(--text-primary);
}

:deep(.el-input__inner:hover),
:deep(.el-input__inner:focus),
:deep(.el-select__input:hover),
:deep(.el-select__input:focus) {
  border-color: var(--accent-primary);
}

:deep(.el-select__dropdown) {
  background-color: var(--bg-tertiary);
  border-color: var(--border-color);
}

:deep(.el-select-dropdown__item) {
  color: var(--text-primary);
}

:deep(.el-select-dropdown__item.hover),
:deep(.el-select-dropdown__item:hover) {
  background-color: var(--bg-secondary);
}

:deep(.el-select-dropdown__item.selected) {
  background-color: var(--accent-primary);
  color: var(--bg-primary);
}

.variables-section {
  margin-bottom: 20px;
  padding: 16px;
  background-color: var(--bg-tertiary);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px 0;
  color: var(--text-primary);
  font-size: 14px;
}

.variables-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.variable-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.variable-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.variable-prefix {
  color: var(--text-secondary);
  font-size: 12px;
  margin-right: 4px;
}

.warning-icon {
  color: var(--warning-color);
}

:deep(.el-input__wrapper) {
  background-color: var(--bg-secondary);
}

:deep(.el-input__inner) {
  color: var(--text-primary);
}

:deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--accent-primary) inset;
}
</style> 