import { onMounted, onBeforeUnmount } from 'vue'
import { useVueFlow } from '@vue-flow/core'
import type { Node, Edge, Connection } from '@vue-flow/core'
import { ElMessage } from 'element-plus'
import ModuleNode from '@/components/workflow/ModuleNode.vue'
import { useWorkflowState } from '@/components/workflow/designer/composables/useWorkflowState'
import { useWorkflowEvents } from '@/components/workflow/designer/composables/useWorkflowEvents'
import { useWorkflowValidation } from '@/components/workflow/designer/composables/useWorkflowValidation'
import { useWorkflowIO } from '@/components/workflow/designer/composables/useWorkflowIO'
import type { Port, Module } from '@/types/workflow'

export function useWorkflowDesigner() {
  // 注册自定义节点类型
  const nodeTypes = {
    custom: ModuleNode
  } as const

  // 默认连线配置
  const defaultEdgeOptions = {
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: 'var(--accent-primary)',
      strokeWidth: 2
    },
    validateConnections: false,
    allowAllConnections: true
  }

  // 使用组合式函数
  const state = useWorkflowState()

  // 加载模块数据
  const loadModules = async () => {
    try {
      state.loading = true
      const response = await fetch('/moduleRegistry.json')
      const data = await response.json()
      state.modules = Object.values(data.modules) as Module[]
      console.log('加载的模块:', state.modules)
    } catch (error) {
      console.error('加载模块失败:', error)
      ElMessage.error('加载模块失败')
    } finally {
      state.loading = false
    }
  }

  // 使用状态
  const {
    onDrop,
    onNodeClick,
    onPaneClick,
    onDeleteKey,
    deleteNode,
    deleteEdge
  } = useWorkflowEvents(state)

  const {
    validateWorkflow,
    checkForCycles
  } = useWorkflowValidation()

  const {
    saveWorkflow,
    loadWorkflow,
    exportWorkflow,
    importWorkflow,
    clearWorkflow
  } = useWorkflowIO(state)

  const { 
    getNodes,
    getEdges,
    addNodes,
    addEdges,
    removeNodes,
    removeEdges,
    setNodes,
    project,
    zoomIn: zoomInFlow, 
    zoomOut: zoomOutFlow,
    fitView
  } = useVueFlow()

  // 分组相关
  const createGroup = () => {
    const selectedNodes = getNodes.value.filter(node => node.selected)
    if (selectedNodes.length < 2) {
      ElMessage.warning('请至少选择两个节点进行分组')
      return
    }

    const group = {
      id: `group-${Date.now()}`,
      title: '新建分组',
      color: '#89b4fa',
      expanded: true,
      nodes: selectedNodes.map(node => node.id)
    }

    // 更新节点的分组信息
    setNodes(nodes => 
      nodes.map(node => ({
        ...node,
        selected: false,
        data: {
          ...node.data,
          groupId: selectedNodes.some(n => n.id === node.id) ? group.id : node.data.groupId
        }
      }))
    )
  }

  // 更新节点属性
  const updateNodeProperties = (nodeId: string, properties: any) => {
    setNodes((nodes) => 
      nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              properties: { ...properties }
            }
          }
        }
        return node
      })
    )
  }

  // 验证并显示结果
  const validateAndShowResult = () => {
    const { errors } = validateWorkflow()
    if (errors.length > 0) {
      ElMessage.warning({
        message: '工作流存在以下问题：\n' + errors.join('\n'),
        duration: 5000,
        showClose: true
      })
    } else {
      ElMessage.success('工作流验证通过')
    }
  }

  // 缩放相关
  const zoomIn = () => zoomInFlow()
  const zoomOut = () => zoomOutFlow()
  const zoomFit = () => fitView()

  // 拖拽相关
  const onDragOver = (event: DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }

  // 连线相关
  const onConnectStart = (event: any) => {
    const { nodeId, handleId, handleType } = event
    console.log('连接开始:', { nodeId, handleId, handleType, event })
    
    if (nodeId && handleId) {
      const nodes = getNodes.value
      const node = nodes.find(n => n.id === nodeId)
      console.log('源节点:', node)
      
      if (!node) return

      // 获取端口信息,不区分输入输出
      const port: Port | undefined = handleType === 'source' 
        ? (node.data?.module?.outputs?.find((p: Port) => p.id === handleId) || 
           node.data?.module?.inputs?.find((p: Port) => p.id === handleId))
        : (node.data?.module?.inputs?.find((p: Port) => p.id === handleId) || 
           node.data?.module?.outputs?.find((p: Port) => p.id === handleId))
      
      console.log('选中的端口:', port)
    
      if (!port) return

      state.currentConnection = {
        nodeId,
        handleId,
        handleType,
        portType: port.type,
        mousePosition: { x: event.clientX, y: event.clientY }
      }
      console.log('设置当前连接状态:', state.currentConnection)
    }
  }

  const onConnectEnd = (event: MouseEvent) => {
    console.log('连接结束:', event)
    console.log('当前连接状态:', state.currentConnection)
    
    if (!state.currentConnection) return

    const currentConnection = state.currentConnection // 创建一个本地引用

    // 获取兼容的模块
    const compatibleModules = state.modules.filter(module => {
      // 排除开始节点
      if (module.type === 'start') return false

      // 检查端口兼容性
      const checkPortCompatibility = (port: Port) => 
        port.type === currentConnection.portType || 
        port.type === 'any' || 
        currentConnection.portType === 'any'

      // 如果是从输出端口开始连接,查找有兼容输入端口的模块
      // 如果是从输入端口开始连接,查找有兼容输出端口的模块
      const hasCompatiblePorts = currentConnection.handleType === 'source'
        ? module.inputs?.some(input => {
            const isCompatible = checkPortCompatibility(input)
            console.log(`检查模块 ${module.name} 的输入端口 ${input.name} 兼容性:`, isCompatible)
            return isCompatible
          })
        : module.outputs?.some(output => {
            const isCompatible = checkPortCompatibility(output)
            console.log(`检查模块 ${module.name} 的输出端口 ${output.name} 兼容性:`, isCompatible)
            return isCompatible
          })

      return hasCompatiblePorts
    })

    console.log('兼容的模块:', compatibleModules)

    if (compatibleModules.length > 0) {
      // 获取鼠标相对于画布的位置
      const wrapper = document.querySelector('.vue-flow__transformationpane')
      if (!wrapper) return
      
      const bounds = wrapper.getBoundingClientRect()
      const position = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
      }
      
      console.log('计算的位置:', position, '画布信息:', bounds)

      // 更新兼容模块状态
      state.compatibleModules = {
        show: true,
        type: currentConnection.handleType === 'source' ? 'input' : 'output',
        modules: compatibleModules,
        sourceNodeId: currentConnection.nodeId,
        sourcePortId: currentConnection.handleId,
        mousePosition: position,
        selectedModule: null
      }
      
      console.log('设置兼容模块状态:', state.compatibleModules)
    }
  }

  // 双击事件
  const onPaneDoubleClick = (event: MouseEvent) => {
    // 检查是否已经存在开始节点
    const hasStartNode = getNodes.value.some(node => node.data?.module?.type === 'start')
    if (hasStartNode) {
      ElMessage.warning('工作流中已存在开始节点')
      return
    }

    // 获取开始节点模块定义
    const startModule = state.modules.find(m => m.type === 'start')
    if (!startModule) {
      ElMessage.error('未找到开始节点模块定义')
      return
    }
    
    // 获取画布位置
    const wrapper = document.querySelector('.vue-flow__viewport')
    if (!wrapper) return

    const bounds = wrapper.getBoundingClientRect()
    const position = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top
    }

    // 创建开始节点
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position,
      data: {
        module: startModule,
        properties: {}
      }
    }

    addNodes([newNode])
    ElMessage.success('已创建开始节点')
  }

  // 右键菜单
  const onContextMenu = (event: MouseEvent, node: Node) => {
    event.preventDefault()
    if (node) {
      if (node.data?.module?.type === 'start') {
        ElMessage.warning('不能删除开始节点')
        return
      }
      
      state.contextMenu = {
        show: true,
        x: event.clientX,
        y: event.clientY,
        nodeId: node.id
      }
    }
  }

  const onEdgeContextMenu = (edgeMouseEvent: any) => {
    const event = edgeMouseEvent.event
    event.preventDefault()
    
    state.contextMenu = {
      show: true,
      x: event.clientX || (event.touches && event.touches[0] ? event.touches[0].clientX : 0),
      y: event.clientY || (event.touches && event.touches[0] ? event.touches[0].clientY : 0),
      nodeId: null,
      edgeId: edgeMouseEvent.edge.id
    }
  }

  const onEdgeClick = (edgeMouseEvent: any) => {
    const event = edgeMouseEvent.event
    if (event.shiftKey) {
      deleteEdge(edgeMouseEvent.edge.id)
    }
  }

  // 添加 validateConnection 函数
  const validateConnection = (connection: Connection) => {
    const { source, target, sourceHandle, targetHandle } = connection
    const sourceNode = getNodes.value.find(node => node.id === source)
    const targetNode = getNodes.value.find(node => node.id === target)
    
    // 检查节点是否存在
    if (!sourceNode || !targetNode) {
      console.log('节点不存在')
      return false
    }
    
    // 获取连接的端口
    const sourcePort = sourceNode.data?.module?.outputs?.find((p: Port) => p.id === sourceHandle) || 
                      sourceNode.data?.module?.inputs?.find((p: Port) => p.id === sourceHandle)
    
    const targetPort = targetNode.data?.module?.inputs?.find((p: Port) => p.id === targetHandle) ||
                      targetNode.data?.module?.outputs?.find((p: Port) => p.id === targetHandle)
    
    if (!sourcePort || !targetPort) {
      console.log('端口不存在')
      return false
    }
    
    // 检查端口类型兼容性
    const isTypeCompatible = sourcePort.type === targetPort.type || 
                           sourcePort.type === 'any' || 
                           targetPort.type === 'any'
    
    if (!isTypeCompatible) {
      ElMessage.warning('端口类型不兼容')
      return false
    }
    
    // 检查是否会形成循环
    if (checkForCycles(source, target, getEdges.value)) {
      ElMessage.warning('检测到循环连接')
      return false
    }
    
    return true
  }

  // 处理右键菜单命令
  const handleContextMenuCommand = (command: string) => {
    if (command === 'delete-node' && state.contextMenu.nodeId) {
      deleteNode(state.contextMenu.nodeId)
    } else if (command === 'delete-edge' && state.contextMenu.edgeId) {
      deleteEdge(state.contextMenu.edgeId)
    }
    state.contextMenu.show = false
  }

  // 处理模块选择
  const handleModuleSelect = (moduleId: string) => {
    console.log('选择模块:', moduleId)
    const selectedModule = state.modules.find(m => m.id === moduleId)
    if (!selectedModule) return
    console.log('找到模块:', selectedModule)

    const { nodeId, handleId, handleType, portType, mousePosition } = state.currentConnection || {}
    if (!nodeId || !handleId || !handleType || !mousePosition) return

    // 创建新节点
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'custom',
      position: mousePosition,
      data: {
        module: selectedModule,
        properties: {}
      }
    }

    console.log('创建新节点:', newNode)
    addNodes([newNode])

    // 根据连接起点类型决定连接方向
    let sourceId, targetId, sourceHandle, targetHandle

    if (handleType === 'source') {
      // 从输出端口开始连接，连到新节点的输入端口
      const targetPort = selectedModule.inputs?.find(input => 
        input.type === portType || input.type === 'any' || portType === 'any'
      )
      if (!targetPort) {
        console.error('未找到兼容的输入端口')
        return
      }
      console.log('选择的输入端口:', targetPort)

      sourceId = nodeId
      targetId = newNode.id
      sourceHandle = handleId
      targetHandle = targetPort.id
    } else {
      // 从输入端口开始连接，连到新节点的输出端口
      const sourcePort = selectedModule.outputs?.find(output => 
        output.type === portType || output.type === 'any' || portType === 'any'
      )
      if (!sourcePort) {
        console.error('未找到兼容的输出端口')
        return
      }
      console.log('选择的输出端口:', sourcePort)

      sourceId = newNode.id
      targetId = nodeId
      sourceHandle = sourcePort.id
      targetHandle = handleId
    }

    const edge: Edge = {
      id: `edge-${Date.now()}`,
      source: sourceId,
      target: targetId,
      sourceHandle,
      targetHandle,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: 'var(--accent-primary)',
        strokeWidth: 2
      }
    }

    console.log('创建连线:', edge)
    addEdges([edge])
    console.log('关闭模块选择对话框')
    state.compatibleModules.show = false
    state.currentConnection = null
  }

  // 关闭模块选择对话框
  const closeCompatibleModules = () => {
    state.compatibleModules.show = false
  }

  // 生命周期钩子
  onMounted(() => {
    window.addEventListener('keydown', onDeleteKey)
    loadModules()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onDeleteKey)
  })

  // 处理连接
  const handleConnect = (connection: Connection) => {
    const { source, target, sourceHandle, targetHandle } = connection
    if (!source || !target || !sourceHandle || !targetHandle) return

    // 获取源节点和目标节点
    const sourceNode = getNodes.value.find(node => node.id === source)
    const targetNode = getNodes.value.find(node => node.id === target)
    if (!sourceNode || !targetNode) return

    // 获取源端口和目标端口
    const sourceOutputPort = sourceNode.data?.module?.outputs?.find((p: Port) => p.id === sourceHandle)
    const sourceInputPort = sourceNode.data?.module?.inputs?.find((p: Port) => p.id === sourceHandle)
    const targetOutputPort = targetNode.data?.module?.outputs?.find((p: Port) => p.id === targetHandle)
    const targetInputPort = targetNode.data?.module?.inputs?.find((p: Port) => p.id === targetHandle)

    // 确定正确的连接方向
    let finalConnection: Edge | null = null

    if (sourceOutputPort && targetInputPort) {
      // 输出端口连接到输入端口
      finalConnection = {
        id: `edge-${Date.now()}`,
        source,
        target,
        sourceHandle,
        targetHandle,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: 'var(--accent-primary)',
          strokeWidth: 2
        }
      }
    } else if (sourceInputPort && targetOutputPort) {
      // 输入端口连接到输出端口，需要交换方向
      finalConnection = {
        id: `edge-${Date.now()}`,
        source: target, // 交换源和目标
        target: source,
        sourceHandle: targetHandle, // 交换源端口和目标端口
        targetHandle: sourceHandle,
        type: 'smoothstep',
        animated: true,
        style: {
          stroke: 'var(--accent-primary)',
          strokeWidth: 2
        }
      }
    }

    if (finalConnection && validateConnection(finalConnection)) {
      addEdges([finalConnection])
    }
  }

  // 将 handleConnect 赋值给 onConnect
  const onConnect = handleConnect

  return {
    state,
    nodeTypes,
    defaultEdgeOptions,
    onDrop,
    onDragOver,
    onConnect,
    onConnectStart,
    onConnectEnd,
    onNodeClick,
    onPaneClick,
    onPaneDoubleClick,
    onDeleteKey,
    onContextMenu,
    onEdgeContextMenu,
    onEdgeClick,
    validateConnection,
    handleContextMenuCommand,
    handleModuleSelect,
    closeCompatibleModules,
    updateNodeProperties,
    validateAndShowResult,
    zoomIn,
    zoomOut,
    zoomFit,
    saveWorkflow,
    loadWorkflow,
    exportWorkflow,
    importWorkflow,
    clearWorkflow,
    createGroup
  }
} 