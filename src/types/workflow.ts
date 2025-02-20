// src/types/workflow.ts
import type { Node, Edge } from '@vue-flow/core'
import type { Ref } from 'vue'

export type PortDataType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'any'

export interface Port {
  id: string
  name: string
  type: string
  description: string
  required?: boolean
  multiple?: boolean
  variable?: string
}

export interface WorkflowNode extends Node {
  data: {
    module: Module
    properties: Record<string, any>
    title?: string
    note?: string
  }
}

export interface Module {
  id: string
  name: string
  type: string
  category: string
  categoryId: string
  description: string
  properties: Record<string, ModuleProperty>
  inputs?: Port[]
  outputs?: Port[]
}

export interface ModuleProperty {
  type: string
  description: string
  required: boolean
  default?: any
  placeholder?: string
  min?: number
  max?: number
  step?: number
  options?: Array<{
    label: string
    value: any
  }>
}

export interface WorkflowStateRefs {
  modules: Ref<Module[]>
  loading: Ref<boolean>
  elements: Ref<(Node | Edge)[]>
  selectedNode: Ref<Node | null>
  contextMenu: {
    show: boolean
    x: number
    y: number
    nodeId: string | null
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
}

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
}