<template>
  <div class="app">
    <WorkflowDesigner />
  </div>
</template>

<script setup lang="ts">
import WorkflowDesigner from './views/WorkflowDesigner/index.vue'
</script>
 
<style>
.app {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* 重置默认样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style> 