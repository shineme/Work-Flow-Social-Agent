<template>
  <div class="workflow-designer">
    <div class="module-panel">
      <ModulePanel 
        :modules="state.modules" 
        :loading="state.loading"
      />
    </div>
    
    <div class="designer-container">
      <div class="toolbar">
        <WorkflowToolbar
          @save="saveWorkflow"
          @load="loadWorkflow"
          @export="exportWorkflow"
          @import="importWorkflow"
          @clear="clearWorkflow"
          @zoom-in="zoomIn"
          @zoom-out="zoomOut"
          @zoom-fit="zoomFit"
          @validate="validateAndShowResult"
          @create-group="createGroup"
        />
      </div>
      
      <VueFlow
        v-model="state.elements"
        :default-viewport="{ zoom: 1 }"
        :min-zoom="0.2"
        :max-zoom="4"
        :snap-to-grid="true"
        :snap-grid="[20, 20]"
        :node-types="nodeTypes"
        :default-edge-options="defaultEdgeOptions"
        :connect-on-click="false"
        :validate-connection="validateConnection"
        :enable-strict-mode="false"
        :enable-connect-target-handle="true"
        :enable-connect-source-handle="true"
        class="workflow-canvas"
        @drop="onDrop"
        @dragover="onDragOver"
        @connect="onConnect"
        @connect-start="onConnectStart"
        @connect-end="onConnectEnd"
        @node-click="onNodeClick"
        @pane-click="onPaneClick"
        @dbl-click="onPaneDoubleClick"
        @keydown.delete="onDeleteKey"
        @node-contextmenu="onContextMenu"
        @edge-contextmenu="onEdgeContextMenu"
        @edge-click="onEdgeClick"
      >
        <template #node-custom="nodeProps">
          <ModuleNode v-bind="nodeProps" />
        </template>
        
        <Background :pattern="'dots'" :gap="[20, 20]" />
        <Controls />
        
        <!-- 右键菜单 -->
        <WorkflowContextMenu
          v-bind="state.contextMenu"
          @command="handleContextMenuCommand"
        />
        
        <!-- 模块选择对话框 -->
        <WorkflowModuleDialog
          :show="state.compatibleModules.show"
          :type="state.compatibleModules.type"
          :modules="state.compatibleModules.modules"
          @update:show="(value) => { state.compatibleModules.show = value }"
          @select="handleModuleSelect"
          @cancel="closeCompatibleModules"
        />
      </VueFlow>
    </div>
    
    <div class="properties-panel">
      <PropertiesPanel
        v-if="state.selectedNode"
        :node="state.selectedNode"
        @update:properties="updateNodeProperties"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import ModulePanel from '@/components/workflow/ModulePanel.vue'
import WorkflowToolbar from '@/components/workflow/WorkflowToolbar.vue'
import ModuleNode from '@/components/workflow/ModuleNode.vue'
import PropertiesPanel from '@/components/workflow/PropertiesPanel.vue'
import WorkflowContextMenu from '@/components/workflow/designer/components/WorkflowContextMenu.vue'
import WorkflowModuleDialog from '@/components/workflow/designer/components/WorkflowModuleDialog.vue'

defineProps<{
  state: any
  nodeTypes: any
  defaultEdgeOptions: any
  onDrop: (event: DragEvent) => void
  onDragOver: (event: DragEvent) => void
  onConnect: (connection: any) => void
  onConnectStart: (event: any) => void
  onConnectEnd: (event: any) => void
  onNodeClick: (event: any) => void
  onPaneClick: () => void
  onPaneDoubleClick: (event: MouseEvent) => void
  onDeleteKey: (event: KeyboardEvent) => void
  onContextMenu: (event: MouseEvent, node: any) => void
  onEdgeContextMenu: (event: any) => void
  onEdgeClick: (event: any) => void
  validateConnection: (connection: any) => boolean
  handleContextMenuCommand: (command: string) => void
  handleModuleSelect: (moduleId: string) => void
  closeCompatibleModules: () => void
  updateNodeProperties: (nodeId: string, properties: any) => void
  validateAndShowResult: () => void
  zoomIn: () => void
  zoomOut: () => void
  zoomFit: () => void
  saveWorkflow: () => void
  loadWorkflow: () => void
  exportWorkflow: () => void
  importWorkflow: () => void
  clearWorkflow: () => void
  createGroup: () => void
}>()
</script> 