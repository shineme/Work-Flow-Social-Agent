import { useVueFlow } from '@vue-flow/core'
import type { Connection, Node, Edge } from '@vue-flow/core'
import { ElMessage } from 'element-plus'
import type { Module, Port } from '@/types/workflow'
import type { WorkflowState } from './useWorkflowState'

export function useWorkflowEvents(state: WorkflowState) {
  const { 
    addNodes,
    addEdges,
    removeNodes,
    removeEdges,
    getNodes,
    getEdges,
    setEdges
  } = useVueFlow()

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    
    const moduleData = event.dataTransfer?.getData('application/json')
    if (!moduleData) return
    
    try {
      const module = JSON.parse(moduleData) as Module
      
      const wrapper = document.querySelector('.vue-flow__transformationpane')
      if (!wrapper) return
      
      const bounds = wrapper.getBoundingClientRect()
      
      const position = {
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
      }
      
      const newNode = {
        id: `node-${Date.now()}`,
        type: 'custom',
        position,
        data: {
          module,
          properties: {}
        }
      }
      
      addNodes([newNode])
    } catch (error) {
      console.error('创建节点失败:', error)
      ElMessage.error('创建节点失败')
    }
  }

  const onConnect = (connection: Connection) => {
    const { source, target, sourceHandle, targetHandle } = connection
    if (!source || !target || !sourceHandle || !targetHandle) return
    
    const edge = {
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
    
    addEdges([edge])
  }

  const onNodeClick = ({ node }: { node: Node }) => {
    state.selectedNode = node
    state.contextMenu.show = false
  }

  const onPaneClick = () => {
    state.selectedNode = null
    state.contextMenu.show = false
  }

  const onDeleteKey = (event: KeyboardEvent) => {
    if (event.key === 'Delete' && state.selectedNode) {
      const node = state.selectedNode
      if (node?.data?.module?.type === 'start') {
        ElMessage.warning('不能删除开始节点')
        return
      }
      deleteNode(node.id)
    }
  }

  const deleteNode = (nodeId: string) => {
    const edges = getEdges.value.filter(edge => 
      edge.source === nodeId || edge.target === nodeId
    )
    
    if (edges.length > 0) {
      removeEdges(edges.map(edge => edge.id))
    }
    
    removeNodes([nodeId])
    
    if (state.selectedNode?.id === nodeId) {
      state.selectedNode = null
    }
    
    state.contextMenu.show = false
  }

  const onEdgeContextMenu = (event: MouseEvent, edge: Edge) => {
    event.preventDefault()
    state.contextMenu = {
      show: true,
      x: event.clientX,
      y: event.clientY,
      nodeId: null,
      edgeId: edge.id
    }
  }

  const deleteEdge = (edgeId: string) => {
    removeEdges([edgeId])
    state.contextMenu.show = false
  }

  const onEdgeClick = (event: MouseEvent, edge: Edge) => {
    if (event.shiftKey) {
      // Shift + 点击删除连接线
      deleteEdge(edge.id)
    }
  }

  return {
    onDrop,
    onConnect,
    onNodeClick,
    onPaneClick,
    onDeleteKey,
    deleteNode,
    onEdgeContextMenu,
    onEdgeClick,
    deleteEdge
  }
} 