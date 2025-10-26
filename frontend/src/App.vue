<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref
} from 'vue'
import {fromDimensions} from '@sabaki/go-board'
import PageCanvas from './components/PageCanvas.vue'
import ExportPage from './components/ExportPage.vue'
import {EXPORT_STYLES} from './exportStyles'
import {
  currentPage,
  useLectureEditor
} from './composables/useLectureEditor'

const {
  state,
  addPage,
  selectPage,
  removePage,
  insertTextBlock,
  updateTextBlock,
  updateTextStyle,
  insertBoardBlock,
  removeBlock,
  setBoardState,
  toggleBoardSide,
  updateBoardSideText,
  updateBoardSideStyle,
  toggleHeadingSegment,
  updateHeadingContent,
  updateHeadingStyle
} = useLectureEditor()

const exportContainerRef = ref(null)
const nowLabel = ref(
  new Date().toLocaleString('zh-CN', {hour12: false})
)

let clockTimer = null

onMounted(() => {
  clockTimer = setInterval(() => {
    nowLabel.value = new Date().toLocaleString('zh-CN', {hour12: false})
  }, 60000)
})

onBeforeUnmount(() => {
  if (clockTimer) clearInterval(clockTimer)
})

const stripHtml = input => {
  if (!input) return ''
  const container = document.createElement('div')
  container.innerHTML = input
  return (container.textContent || container.innerText || '').trim()
}

const handleAddText = () => {
  insertTextBlock({content: ''})
}

const handleAddBoard = variant => {
  const normalized = variant === 'corner' ? 'corner' : 'full'
  const size = 19
  const viewport =
    normalized === 'corner'
      ? {x: 0, y: size - 10, width: 10, height: 10}
      : null

  insertBoardBlock({
    variant: normalized,
    size,
    viewport
  })
}

const activePage = computed(() => currentPage.value)

const handleUndo = ({blockId}) => {
  const page = activePage.value
  if (!page) return

  const block = page.blocks.find(item => item.id === blockId)
  if (!block || block.type !== 'board' || !(block.moves?.length)) return

  const updatedMoves = block.moves.slice(0, -1)
  let nextPlayer = 1

  if (updatedMoves.length > 0) {
    const lastSign = updatedMoves[updatedMoves.length - 1].sign ?? 1
    nextPlayer = -lastSign
  }

  setBoardState({
    pageId: page.id,
    blockId,
    moves: updatedMoves,
    nextPlayer
  })
}

// 修改：落子时支持 sign 参数
const handlePlace = ({blockId, vertex, sign}) => {
  const page = activePage.value
  if (!page) return

  const block = page.blocks.find(item => item.id === blockId)
  if (!block || block.type !== 'board') return

  const size = block.size ?? 19
  let board = fromDimensions(size, size)

  for (const move of block.moves ?? []) {
    const mvVertex = move.vertex ?? move
    const mvSign = move.sign ?? (move.player ?? 1)
    if (Array.isArray(mvVertex) && mvVertex.length === 2) {
      board = board.makeMove(mvSign, mvVertex)
    }
  }

  if (!board.has(vertex)) return

  const occupant = board.get(vertex)

  if (occupant !== 0) {
    const lastMove = block.moves?.slice(-1)[0]
    if (
      lastMove &&
      Array.isArray(lastMove.vertex) &&
      lastMove.vertex[0] === vertex[0] &&
      lastMove.vertex[1] === vertex[1] &&
      window.confirm('删除上一手？')
    ) {
      handleUndo({blockId})
    }
    return
  }

  // 新增：落子方由参数 sign 决定
  const moveSign = typeof sign === 'number' ? sign : block.nextPlayer ?? 1
  const {overwrite} = board.analyzeMove(moveSign, vertex)
  if (overwrite) return

  const updatedMoves = [...(block.moves ?? []), {vertex, sign: moveSign}]
  // nextPlayer 由 BoardBlock.vue 控制，不在这里自动切换

  setBoardState({
    pageId: page.id,
    blockId,
    moves: updatedMoves,
    nextPlayer: -moveSign
  })
}

const handleToggleSide = ({blockId, side}) => {
  const page = activePage.value
  if (!page) return

  toggleBoardSide({pageId: page.id, blockId, side})
}

const handleSideText = ({blockId, side, content}) => {
  const page = activePage.value
  if (!page) return

  updateBoardSideText({pageId: page.id, blockId, side, content})
}

const handleSideStyle = ({blockId, side, style}) => {
  const page = activePage.value
  if (!page) return

  updateBoardSideStyle({pageId: page.id, blockId, side, style})
}

const handleTextContent = ({blockId, content}) => {
  const page = activePage.value
  if (!page) return

  updateTextBlock({pageId: page.id, blockId, content})
}

const handleTextStyle = ({blockId, style}) => {
  const page = activePage.value
  if (!page) return

  updateTextStyle({pageId: page.id, blockId, style})
}

const handleRemoveBlock = blockId => {
  const page = activePage.value
  if (!page) return

  if (window.confirm('确定要删除该内容块吗？删除后无法恢复。')) {
    removeBlock({pageId: page.id, blockId})
  }
}

const handleHeadingToggle = ({target}) => {
  const page = activePage.value
  if (!page) return

  toggleHeadingSegment({pageId: page.id, target})
}

const handleHeadingContent = ({target, content}) => {
  const page = activePage.value
  if (!page) return

  updateHeadingContent({pageId: page.id, target, content})
}

const handleHeadingStyle = ({target, style}) => {
  const page = activePage.value
  if (!page) return

  updateHeadingStyle({pageId: page.id, target, style})
}

const handleExportPdf = async () => {
  if (!activePage.value || !exportContainerRef.value) return
  await nextTick()
  // 获取当前时间
  const now = new Date().toLocaleString('zh-CN', {hour12: false})
  // 页眉：左时间，右协会信息
  const headerHtml = `
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#555;margin-bottom:8px;">
      <span>${now}</span>
      <span>浦东新区围棋协会 郭诣丰制作</span>
    </div>
  `
  const html = exportContainerRef.value.innerHTML
  const printWindow = window.open('', '_blank', 'width=900,height=1200')
  if (!printWindow) {
    window.alert('请允许浏览器弹出窗口以导出 PDF。')
    return
  }

  printWindow.document.write(`<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<title>围棋讲义</title>
<style>${EXPORT_STYLES}</style>
</head>
<body class="export-root">
${headerHtml}
${html}
</body>
</html>`)
  printWindow.document.close()
  printWindow.focus()
  setTimeout(() => {
    printWindow.print()
    printWindow.close()
  }, 200)
}
</script>

<template>
  <div class="app">
    <header class="toolbar" data-export-ignore="true">
      <div class="brand">
        <h1>围棋讲义编辑一点通-Developed by gyf</h1>
      </div>
      <div class="toolbar-actions">
        <button type="button" @click="handleExportPdf" :disabled="!activePage">
          导出 PDF
        </button>
        <button type="button" @click="addPage">新增页面</button>
      </div>
    </header>

    <main class="workspace">
      <aside class="page-list" data-export-ignore="true">
        <div
          v-for="page in state.pages"
          :key="page.id"
          class="page-item"
          :class="{selected: page.id === state.currentPageId}"
        >
          <button type="button" class="page-button" @click="selectPage(page.id)">
            {{ page.title }}
          </button>
          <button
            type="button"
            class="delete-button"
            @click="removePage(page.id)"
            :disabled="state.pages.length === 1"
            title="删除该页"
          >
            ✕
          </button>
        </div>
      </aside>

      <section class="page-canvas">
        <div v-if="activePage" class="page-export-wrapper">
          <PageCanvas
            :page="activePage"
            @add-text="handleAddText"
            @add-board="handleAddBoard"
            @place="handlePlace"
            @toggle-side="handleToggleSide"
            @side-text="handleSideText"
            @side-style="handleSideStyle"
            @text-content="handleTextContent"
            @text-style="handleTextStyle"
            @remove-block="handleRemoveBlock"
            @heading-toggle="handleHeadingToggle"
            @heading-content="handleHeadingContent"
            @heading-style="handleHeadingStyle"
          />
        </div>
        <p v-else class="placeholder">请选择内容进行编辑</p>
      </section>
    </main>

    <div class="export-hidden" aria-hidden="true" ref="exportContainerRef">
      <ExportPage v-if="activePage" :page="activePage" />
    </div>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  background: #f1f5f9;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #1f2937;
  color: #fff;
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.2);
  gap: 16px;
}

.brand {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.brand h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.brand time {
  font-size: 12px;
  color: #cbd5f5;
}

.toolbar-actions {
  display: flex;
  gap: 10px;
}

.toolbar-actions button {
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.toolbar-actions button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.workspace {
  flex: 1;
  display: grid;
  grid-template-columns: minmax(120px, 12vw) 1fr;
  gap: 16px;
  padding: 20px;
  box-sizing: border-box;
}

.page-list {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
}

.page-item {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  border-radius: 8px;
  padding: 6px 10px;
  transition: background 0.2s ease;
}

.page-item.selected {
  background: #2563eb;
  color: #fff;
}

.page-item.selected .delete-button {
  color: #fff;
}

.page-button {
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
  font-weight: 600;
}

.delete-button {
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
}

.delete-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.delete-button:hover:not(:disabled) {
  color: #ef4444;
}

.page-canvas {
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.page-export-wrapper {
  background: #fff;
  padding: 28px 40px;
  overflow-y: auto;
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.12);
  width: 100%;
  height: 100%;
}

.placeholder {
  color: #94a3b8;
  text-align: center;
  margin-top: 120px;
}

.export-hidden {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
</style>