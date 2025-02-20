import { useVueFlow } from '@vue-flow/core'
import type { Edge, Node } from '@vue-flow/core'
import type { Port, Module } from '@/types/workflow'

interface ValidationResult {
  errors: string[]
}

interface NodeWithData extends Node {
  data: {
    module: Module
    properties: Record<string, any>
  }
}

export function useWorkflowValidation() {
  const { getNodes, getEdges } = useVueFlow()

  const validateWorkflow = (): ValidationResult => {
    const nodes = getNodes.value as NodeWithData[]
    const edges = getEdges.value
    const errors: string[] = []

    // 检查是否有起始节点
    const startNode = nodes.find(node => node.data?.module?.type === 'start')
    if (!startNode) {
      errors.push('工作流缺少起始节点')
    }

    // 检查孤立节点
    nodes.forEach(node => {
      const hasConnections = edges.some(edge => 
        edge.source === node.id || edge.target === node.id
      )
      if (!hasConnections && node.data?.module?.type !== 'start') {
        errors.push(`节点 "${node.data?.module?.name}" 未连接到工作流`)
      }
    })

    // 检查必需的端口连接
    nodes.forEach(node => {
      // 检查必需的输入端口
      node.data?.module?.inputs?.forEach((input: Port) => {
        if (input.required) {
          const hasConnection = edges.some(edge => 
            edge.target === node.id && edge.targetHandle === input.id
          )
          if (!hasConnection) {
            errors.push(`节点 "${node.data?.module?.name}" 的必需输入端口 "${input.name}" 未连接`)
          }
        }
      })

      // 检查必需的输出端口
      node.data?.module?.outputs?.forEach((output: Port) => {
        if (output.required) {
          const hasConnection = edges.some(edge => 
            edge.source === node.id && edge.sourceHandle === output.id
          )
          if (!hasConnection) {
            errors.push(`节点 "${node.data?.module?.name}" 的必需输出端口 "${output.name}" 未连接`)
          }
        }
      })
    })

    // 检查必需的属性配置
    nodes.forEach(node => {
      const properties = node.data?.module?.properties
      if (properties) {
        Object.entries(properties).forEach(([key, prop]: [string, any]) => {
          if (prop.required && !node.data?.properties[key]) {
            errors.push(`节点 "${node.data?.module?.name}" 的必需属性 "${prop.description}" 未配置`)
          }
        })
      }
    })

    return { errors }
  }

  // 检查是否会形成循环
  const checkForCycles = (source: string, target: string, edges: Edge[]): boolean => {
    const visited = new Set<string>()
    const stack = [target]
    
    while (stack.length > 0) {
      const current = stack.pop()!
      
      if (current === source) {
        return true // 找到循环
      }
      
      if (!visited.has(current)) {
        visited.add(current)
        
        // 查找所有以当前节点为源的边
        const nextNodes = edges
          .filter(edge => edge.source === current)
          .map(edge => edge.target)
        
        stack.push(...nextNodes)
      }
    }
    
    return false
  }

  return {
    validateWorkflow,
    checkForCycles
  }
} 