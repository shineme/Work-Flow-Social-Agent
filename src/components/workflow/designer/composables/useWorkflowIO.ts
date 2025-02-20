import { ElMessage } from 'element-plus'
import type { Node, Edge } from '@vue-flow/core'
import type { WorkflowNode } from '@/types/workflow'
import type { WorkflowState } from './useWorkflowState'

interface WorkflowData {
  nodes: WorkflowNode[]
  edges: Edge[]
}

export function useWorkflowIO(state: WorkflowState) {
  const saveWorkflow = () => {
    const workflow: WorkflowData = {
      nodes: state.elements.filter((el): el is WorkflowNode => el.type === 'custom') as WorkflowNode[],
      edges: state.elements.filter((el): el is Edge => 'source' in el && 'target' in el)
    }
    localStorage.setItem('workflow', JSON.stringify(workflow))
    ElMessage.success('工作流已保存')
  }

  const loadWorkflow = () => {
    const saved = localStorage.getItem('workflow')
    if (saved) {
      try {
        const workflow = JSON.parse(saved) as WorkflowData
        state.elements = [...workflow.nodes, ...workflow.edges]
        ElMessage.success('工作流已加载')
      } catch (error) {
        console.error('加载工作流失败:', error)
        ElMessage.error('加载工作流失败')
      }
    }
  }

  const exportWorkflow = () => {
    const workflow: WorkflowData = {
      nodes: state.elements.filter((el): el is WorkflowNode => el.type === 'custom') as WorkflowNode[],
      edges: state.elements.filter((el): el is Edge => 'source' in el && 'target' in el)
    }
    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'workflow.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importWorkflow = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      
      try {
        const text = await file.text()
        const workflow = JSON.parse(text) as WorkflowData
        state.elements = [...workflow.nodes, ...workflow.edges]
        ElMessage.success('工作流已导入')
      } catch (error) {
        console.error('导入工作流失败:', error)
        ElMessage.error('导入工作流失败')
      }
    }
    input.click()
  }

  const clearWorkflow = () => {
    state.elements = []
    ElMessage.success('工作流已清空')
  }

  return {
    saveWorkflow,
    loadWorkflow,
    exportWorkflow,
    importWorkflow,
    clearWorkflow
  }
} 