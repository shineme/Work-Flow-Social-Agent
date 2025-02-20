import { reactive } from 'vue'
import type { Node, Edge } from '@vue-flow/core'
import type { Module } from '@/types/workflow'

export interface WorkflowState {
  modules: Module[]
  loading: boolean
  elements: (Node | Edge)[]
  selectedNode: Node | null
  contextMenu: {
    show: boolean
    x: number
    y: number
    nodeId: string | null
    edgeId?: string | null
  }
  compatibleModules: {
    show: boolean
    type: 'input' | 'output'
    modules: Module[]
    sourceNodeId: string
    sourcePortId: string
    mousePosition: { x: number; y: number }
    selectedModule: string | null
  }
  currentConnection: {
    nodeId: string
    handleId: string
    handleType: 'source' | 'target'
    portType: string
    mousePosition: { x: number; y: number }
  } | null
}

export function useWorkflowState() {
  return reactive<WorkflowState>({
    modules: [],
    loading: false,
    elements: [],
    selectedNode: null,
    contextMenu: {
      show: false,
      x: 0,
      y: 0,
      nodeId: null
    },
    compatibleModules: {
      show: false,
      type: 'input',
      modules: [],
      sourceNodeId: '',
      sourcePortId: '',
      mousePosition: { x: 0, y: 0 },
      selectedModule: null
    },
    currentConnection: null
  })
} 