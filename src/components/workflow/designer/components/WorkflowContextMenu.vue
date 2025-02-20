<template>
  <el-dropdown
    v-if="show"
    :visible="show"
    trigger="contextmenu"
    @command="handleCommand"
    :style="{
      position: 'fixed',
      left: x + 'px',
      top: y + 'px'
    }"
  >
    <span class="el-dropdown-link"></span>
    <template #dropdown>
      <el-dropdown-menu>
        <template v-if="nodeId">
          <el-dropdown-item command="delete-node">删除节点</el-dropdown-item>
        </template>
        <template v-else-if="edgeId">
          <el-dropdown-item command="delete-edge">删除连线</el-dropdown-item>
        </template>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
defineProps<{
  show: boolean
  x: number
  y: number
  nodeId: string | null
  edgeId?: string | null
}>()

const emit = defineEmits<{
  (e: 'command', command: string): void
}>()

const handleCommand = (command: string) => {
  emit('command', command)
}
</script> 