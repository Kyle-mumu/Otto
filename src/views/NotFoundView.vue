<template>
  <div class="not-found">
    <el-result
      icon="warning"
      title="404"
      sub-title="页面不存在"
    >
      <template #extra>
        <RouterLink to="/">
          <el-button type="primary" size="large">返回首页</el-button>
        </RouterLink>
      </template>
    </el-result>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-page, #FAFAFA);
}
</style>
