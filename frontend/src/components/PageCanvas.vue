<template>
  <section class="page-canvas">
    <header class="page-header">
      <h2>{{ page.title }}</h2>
      <div class="actions" data-export-ignore="true">
        <button type="button" @click="$emit('add-text')">插入文字</button>
        <button type="button" @click="$emit('add-board', 'full')">插入整盘</button>
        <button type="button" @click="$emit('add-board', 'corner')">插入角部</button>
      </div>
    </header>

    <TitleEditor
      v-if="page.heading"
      :heading="page.heading"
      @toggle="$emit('heading-toggle', $event)"
      @update-content="$emit('heading-content', $event)"
      @update-style="$emit('heading-style', $event)"
    />

    <div v-if="page.blocks.length === 0" class="placeholder">
      当前页暂无内容，请插入文本或棋盘。
    </div>

    <div v-else class="block-list">
      <article
        v-for="block in page.blocks"
        :key="block.id"
        class="block-item"
      >
        <button
          type="button"
          class="remove-block"
          data-export-ignore="true"
          title="删除该块"
          @click="$emit('remove-block', block.id)"
        >
          ✕
        </button>

        <TextBlock
          v-if="block.type === 'text'"
          :block="block"
          @update-content="$emit('text-content', $event)"
          @update-style="$emit('text-style', $event)"
        />
        <BoardBlock
          v-else
          :block="block"
          @place="$emit('place', $event)"
          @toggle-side="$emit('toggle-side', $event)"
          @side-text="$emit('side-text', $event)"
          @side-style="$emit('side-style', $event)"
        />
      </article>
    </div>
  </section>
</template>

<script setup>
import BoardBlock from './BoardBlock.vue'
import TextBlock from './TextBlock.vue'
import TitleEditor from './TitleEditor.vue'

defineProps({
  page: {
    type: Object,
    required: true
  }
})

defineEmits([
  'add-text',
  'add-board',
  'place',
  'toggle-side',
  'side-text',
  'side-style',
  'text-content',
  'text-style',
  'remove-block',
  'heading-toggle',
  'heading-content',
  'heading-style'
])
</script>

<style scoped>
.page-canvas {
  background: transparent;
  padding: 24px;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 12px;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions button {
  padding: 6px 12px;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.placeholder {
  flex: 1;
  color: #9ca3af;
  text-align: center;
  padding: 120px 0;
}

.block-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.block-item {
  position: relative;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
}

.remove-block {
  position: absolute;
  top: 8px;
  right: 8px;
  border: none;
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
  border-radius: 999px;
  width: 26px;
  height: 26px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.remove-block:hover {
  background: rgba(239, 68, 68, 0.22);
}
</style>