<template>
  <section class="title-editor">
    <article class="title-segment">
      <header class="segment-header">
        <h3>主标题</h3>
        <button
          type="button"
          data-export-ignore="true"
          @click="emitToggle('main')"
        >
          {{ heading.main?.enabled ? '隐藏' : '显示' }}
        </button>
      </header>

      <div v-if="heading.main?.enabled" class="segment-body">
        <div class="toolbar" data-export-ignore="true">
          <label>
            字体
            <select v-model="mainFont.family" @change="applyFontFamily('main')">
              <option value="Microsoft YaHei">微软雅黑</option>
              <option value="SimSun">宋体</option>
              <option value="KaiTi">楷体</option>
              <option value="Arial">Arial</option>
            </select>
          </label>
          <label>
            大小
            <select v-model.number="mainFont.size" @change="applyFontSize('main')">
              <option :value="24">24</option>
              <option :value="28">28</option>
              <option :value="32">32</option>
              <option :value="36">36</option>
              <option :value="42">42</option>
            </select>
          </label>
          <label class="color-picker">
            颜色
            <input type="color" v-model="mainFont.color" @input="applyFontColor('main')" />
          </label>
          <button type="button" class="compact" @click="execCommand('main', 'bold')">加粗</button>
          <button type="button" class="compact" @click="execCommand('main', 'italic')">斜体</button>
          <button type="button" class="compact" @click="execCommand('main', 'underline')">下划线</button>
          <button type="button" class="compact" @click="clearFormatting('main')">清除格式</button>
        </div>

        <div
          ref="mainEditor"
          class="editor main"
          contenteditable="true"
          data-placeholder="请输入主标题…"
          @input="handleInput('main')"
          @blur="syncContent('main')"
          @mouseup="rememberSelection('main')"
          @keyup="rememberSelection('main')"
        ></div>
      </div>
    </article>

    <article class="title-segment">
      <header class="segment-header">
        <h3>副标题</h3>
        <button
          type="button"
          data-export-ignore="true"
          @click="emitToggle('sub')"
        >
          {{ heading.sub?.enabled ? '隐藏' : '显示' }}
        </button>
      </header>

      <div v-if="heading.sub?.enabled" class="segment-body">
        <div class="toolbar" data-export-ignore="true">
          <label>
            字体
            <select v-model="subFont.family" @change="applyFontFamily('sub')">
              <option value="Microsoft YaHei">微软雅黑</option>
              <option value="SimSun">宋体</option>
              <option value="KaiTi">楷体</option>
              <option value="Arial">Arial</option>
            </select>
          </label>
          <label>
            大小
            <select v-model.number="subFont.size" @change="applyFontSize('sub')">
              <option :value="18">18</option>
              <option :value="20">20</option>
              <option :value="22">22</option>
              <option :value="24">24</option>
              <option :value="26">26</option>
            </select>
          </label>
          <label class="color-picker">
            颜色
            <input type="color" v-model="subFont.color" @input="applyFontColor('sub')" />
          </label>
          <button type="button" class="compact" @click="execCommand('sub', 'bold')">加粗</button>
          <button type="button" class="compact" @click="execCommand('sub', 'italic')">斜体</button>
          <button type="button" class="compact" @click="execCommand('sub', 'underline')">下划线</button>
          <button type="button" class="compact" @click="clearFormatting('sub')">清除格式</button>
        </div>

        <div
          ref="subEditor"
          class="editor sub"
          contenteditable="true"
          data-placeholder="请输入副标题…"
          @input="handleInput('sub')"
          @blur="syncContent('sub')"
          @mouseup="rememberSelection('sub')"
          @keyup="rememberSelection('sub')"
        ></div>
      </div>
    </article>
  </section>
</template>

<script setup>
import {nextTick, reactive, ref, watch} from 'vue'

const props = defineProps({
  heading: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['toggle', 'update-content', 'update-style'])

const mainEditor = ref(null)
const subEditor = ref(null)

const selections = reactive({
  main: null,
  sub: null
})

const mainFont = reactive({
  family: props.heading.main?.style?.family ?? 'Microsoft YaHei',
  size: props.heading.main?.style?.size ?? 36,
  color: props.heading.main?.style?.color ?? '#0f172a'
})

const subFont = reactive({
  family: props.heading.sub?.style?.family ?? 'Microsoft YaHei',
  size: props.heading.sub?.style?.size ?? 24,
  color: props.heading.sub?.style?.color ?? '#334155'
})

const editorMap = {
  main: mainEditor,
  sub: subEditor
}

const fontMap = {
  main: mainFont,
  sub: subFont
}

const emitToggle = target => {
  emit('toggle', {target})
}

const restoreSelection = target => {
  const selection = window.getSelection()
  if (!selection) return
  const range = selections[target]
  if (!range) return
  selection.removeAllRanges()
  selection.addRange(range)
}

const rememberSelection = target => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  selections[target] = selection.getRangeAt(0)
}

const execCommand = (target, command) => {
  restoreSelection(target)
  document.execCommand(command, false)
  syncContent(target)
}

const applyFontFamily = target => {
  restoreSelection(target)
  document.execCommand('fontName', false, fontMap[target].family)
  emitStyle(target)
  syncContent(target)
}

const applyFontSize = target => {
  restoreSelection(target)
  document.execCommand('fontSize', false, 7)
  const editor = editorMap[target].value
  if (!editor) return
  Array.from(editor.getElementsByTagName('font')).forEach(font => {
    if (font.size === '7') {
      font.removeAttribute('size')
      font.style.fontSize = `${fontMap[target].size}px`
    }
  })
  emitStyle(target)
  syncContent(target)
}

const applyFontColor = target => {
  restoreSelection(target)
  document.execCommand('foreColor', false, fontMap[target].color)
  emitStyle(target)
  syncContent(target)
}

const clearFormatting = target => {
  restoreSelection(target)
  document.execCommand('removeFormat', false)
  emitStyle(target)
  syncContent(target)
}

const syncContent = target => {
  const editor = editorMap[target].value
  if (!editor) return
  emit('update-content', {
    target,
    content: editor.innerHTML
  })
}

const handleInput = target => {
  rememberSelection(target)
  syncContent(target)
}

const emitStyle = target => {
  emit('update-style', {
    target,
    style: {
      family: fontMap[target].family,
      size: fontMap[target].size,
      color: fontMap[target].color
    }
  })
}

watch(
  () => props.heading.main?.style,
  style => {
    if (!style) return
    mainFont.family = style.family ?? mainFont.family
    mainFont.size = style.size ?? mainFont.size
    mainFont.color = style.color ?? mainFont.color
  },
  {deep: true}
)

watch(
  () => props.heading.sub?.style,
  style => {
    if (!style) return
    subFont.family = style.family ?? subFont.family
    subFont.size = style.size ?? subFont.size
    subFont.color = style.color ?? subFont.color
  },
  {deep: true}
)

watch(
  () => props.heading.main?.content,
  content => {
    const editor = mainEditor.value
    if (!editor) return
    if (editor.innerHTML !== (content ?? '')) {
      editor.innerHTML = content ?? ''
    }
  },
  {immediate: true}
)

watch(
  () => props.heading.sub?.content,
  content => {
    const editor = subEditor.value
    if (!editor) return
    if (editor.innerHTML !== (content ?? '')) {
      editor.innerHTML = content ?? ''
    }
  },
  {immediate: true}
)

watch(
  () => props.heading.main?.enabled,
  enabled => {
    if (!enabled) return
    nextTick(() => {
      if (mainEditor.value && props.heading.main?.content) {
        mainEditor.value.innerHTML = props.heading.main.content
      }
    })
  }
)

watch(
  () => props.heading.sub?.enabled,
  enabled => {
    if (!enabled) return
    nextTick(() => {
      if (subEditor.value && props.heading.sub?.content) {
        subEditor.value.innerHTML = props.heading.sub.content
      }
    })
  }
)
</script>

<style scoped>
.title-editor {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px 0 12px;
  border-bottom: 1px solid #e2e8f0;
}

.title-segment {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.segment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.segment-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.segment-header button {
  border: 1px solid rgba(37, 99, 235, 0.5);
  background: rgba(37, 99, 235, 0.12);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 13px;
  color: #1d4ed8;
  cursor: pointer;
}

.segment-body {
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
  min-height: 60px;
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 14px;
  background: #fff;
  box-shadow: inset 0 1px 4px rgba(15, 23, 42, 0.08);
  line-height: 1.6;
  overflow-wrap: break-word;
}

.editor.main {
  text-align: center;
  font-size: 36px;
  font-weight: 600;
}

.editor.sub {
  text-align: center;
  font-size: 24px;
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