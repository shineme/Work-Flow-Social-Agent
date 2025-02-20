<script setup lang="ts">
import { defineComponent } from 'vue'
import template from './WorkflowDesigner.template.vue'
import './WorkflowDesigner.style.css'
import { useWorkflowDesigner } from './WorkflowDesigner.ts'

const {
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
} = useWorkflowDesigner()
</script>

<template>
  <component 
    :is="template"
    :state="state"
    :nodeTypes="nodeTypes"
    :defaultEdgeOptions="defaultEdgeOptions"
    :onDrop="onDrop"
    :onDragOver="onDragOver"
    :onConnect="onConnect"
    :onConnectStart="onConnectStart"
    :onConnectEnd="onConnectEnd"
    :onNodeClick="onNodeClick"
    :onPaneClick="onPaneClick"
    :onPaneDoubleClick="onPaneDoubleClick"
    :onDeleteKey="onDeleteKey"
    :onContextMenu="onContextMenu"
    :onEdgeContextMenu="onEdgeContextMenu"
    :onEdgeClick="onEdgeClick"
    :validateConnection="validateConnection"
    :handleContextMenuCommand="handleContextMenuCommand"
    :handleModuleSelect="handleModuleSelect"
    :closeCompatibleModules="closeCompatibleModules"
    :updateNodeProperties="updateNodeProperties"
    :validateAndShowResult="validateAndShowResult"
    :zoomIn="zoomIn"
    :zoomOut="zoomOut"
    :zoomFit="zoomFit"
    :saveWorkflow="saveWorkflow"
    :loadWorkflow="loadWorkflow"
    :exportWorkflow="exportWorkflow"
    :importWorkflow="importWorkflow"
    :clearWorkflow="clearWorkflow"
    :createGroup="createGroup"
  />
</template> 