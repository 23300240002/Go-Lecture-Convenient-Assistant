<template>
  <section class="text-block">
    <header class="toolbar" data-export-ignore="true">
      <label>
        字体
        <select v-model="currentFont.family" @change="applyFontFamily">
          <option value="Microsoft YaHei">微软雅黑</option>
          <option value="SimSun">宋体</option>
          <option value="KaiTi">楷体</option>
          <option value="Arial">Arial</option>
        </select>
      </label>
      <label>
        大小
        <select v-model.number="currentFont.size" @change="applyFontSize">
          <option :value="16">16</option>
          <option :value="18">18</option>
          <option :value="20">20</option>
          <option :value="22">22</option>
          <option :value="24">24</option>
        </select>
      </label>
      <label class="color-picker">
        颜色
        <input type="color" v-model="currentFont.color" @input="applyFontColor" />
      </label>
      <button type="button" class="compact" @click="execCommand('bold')">加粗</button>
      <button type="button" class="compact" @click="execCommand('italic')">斜体</button>
      <button type="button" class="compact" @click="execCommand('underline')">下划线</button>
      <button type="button" class="compact" @click="clearFormatting">清除格式</button>
    </header>

    <div
      ref="editorRef"
      class="editor"
      contenteditable="true"
      :data-placeholder="placeholder"
      @input="handleInput"
      @blur="syncState"
      @mouseup="rememberSelection"
      @keyup="rememberSelection"
    ></div>
  </section>
</template>

<script setup>
import {nextTick, onMounted, reactive, ref, watch} from 'vue'

const props = defineProps({
  block: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update-content', 'update-style'])

const editorRef = ref(null)
const savedSelection = ref(null)
const placeholder = '请输入讲解内容…'

const currentFont = reactive({
  family: 'Microsoft YaHei',
  size: 18,
  color: '#1f2937'
})

const restoreSelection = () => {
  const selection = window.getSelection()
  if (!selection || !savedSelection.value) return
  selection.removeAllRanges()
  selection.addRange(savedSelection.value)
}

const rememberSelection = () => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  savedSelection.value = selection.getRangeAt(0)
}

const emitStyle = () => {
  emit('update-style', {
    blockId: props.block.id,
    style: {
      family: currentFont.family,
      size: currentFont.size,
      color: currentFont.color
    }
  })
}

const execCommand = command => {
  restoreSelection()
  document.execCommand(command, false)
  syncState()
}

const applyFontFamily = () => {
  restoreSelection()
  document.execCommand('fontName', false, currentFont.family)
  emitStyle()
  syncState()
}

const applyFontSize = () => {
  restoreSelection()
  document.execCommand('fontSize', false, 7)
  const editor = editorRef.value
  if (!editor) return
  Array.from(editor.getElementsByTagName('font')).forEach(font => {
    if (font.size === '7') {
      font.removeAttribute('size')
      font.style.fontSize = `${currentFont.size}px`
    }
  })
  emitStyle()
  syncState()
}

const applyFontColor = () => {
  restoreSelection()
  document.execCommand('foreColor', false, currentFont.color)
  emitStyle()
  syncState()
}

const clearFormatting = () => {
  restoreSelection()
  document.execCommand('removeFormat', false)
  emitStyle()
  syncState()
}

const syncState = () => {
  const editor = editorRef.value
  if (!editor) return
  emit('update-content', {blockId: props.block.id, content: editor.innerHTML})
}

const handleInput = () => {
  rememberSelection()
  syncState()
}

watch(
  () => props.block.content,
  content => {
    const editor = editorRef.value
    if (!editor) return
    if (editor.innerHTML !== (content ?? '')) {
      editor.innerHTML = content ?? ''
    }
  },
  {immediate: true}
)

watch(
  () => props.block.style,
  style => {
    currentFont.family = style?.family ?? 'Microsoft YaHei'
    currentFont.size = style?.size ?? 18
    currentFont.color = style?.color ?? '#1f2937'
  },
  {immediate: true, deep: true}
)

onMounted(() => {
  nextTick(() => {
    if (editorRef.value && !props.block.content) {
      editorRef.value.innerHTML = ''
    }
  })
})
</script>

<style scoped>
.text-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  font-size: 13px;
  color: #4b5563;
}

.toolbar label {
  display: flex;
  align-items: center;
  gap: 6px;
}

.toolbar select,
.toolbar input[type='color'] {
  border: 1px solid #cbd5f5;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 13px;
  background: #fff;
}

.toolbar .compact {
  padding: 4px 10px;
  border: 1px solid rgba(37, 99, 235, 0.6);
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
  border-radius: 6px;
  cursor: pointer;
}

.toolbar .compact:hover {
  background: rgba(37, 99, 235, 0.18);
}

.editor {
  min-height: 220px;
  padding: 16px;
  border: 1px solid #d1d5db;
  border-radius: 14px;
  background: #fff;
  box-shadow: inset 0 1px 4px rgba(15, 23, 42, 0.08);
  line-height: 1.7;
  font-size: 18px;
  overflow-wrap: break-word;
}

.editor:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.18);
}

.editor:empty::before {
  content: attr(data-placeholder);
  display: block;
  color: #9ca3af;
}
</style>