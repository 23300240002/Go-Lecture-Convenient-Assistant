<template>
  <div
    class="board-block"
    :class="blockClass"
    @pointerenter="hovering = true"
    @pointerleave="hovering = false"
  >
    <div v-if="hasLeft" class="side-text left">
      <div class="side-toolbar" data-export-ignore="true">
        <label>
          字体
          <select v-model="leftFont.family" @change="emitSideStyle('left')">
            <option value="Microsoft YaHei">微软雅黑</option>
            <option value="SimSun">宋体</option>
            <option value="KaiTi">楷体</option>
            <option value="Arial">Arial</option>
          </select>
        </label>
        <label>
          大小
          <select v-model.number="leftFont.size" @change="emitSideStyle('left')">
            <option :value="14">14</option>
            <option :value="16">16</option>
            <option :value="18">18</option>
            <option :value="20">20</option>
            <option :value="22">22</option>
          </select>
        </label>
        <label>
          颜色
          <input
            type="color"
            v-model="leftFont.color"
            @change="emitSideStyle('left')"
          />
        </label>
      </div>
      <textarea
        class="side-area"
        :style="sideStyle('left')"
        :value="block.leftText"
        placeholder="请输入左侧讲解…"
        @input="handleSideInput('left', $event)"
      ></textarea>
    </div>

    <div class="board-wrapper">
      <button
        type="button"
        class="side-handle left"
        data-export-ignore="true"
        :class="{visible: hovering || hasLeft}"
        @click.stop="emit('toggle-side', {blockId: block.id, side: 'left'})"
      >
        ◀ 添加讲解
      </button>

      <div class="board-area">
        <div class="board-toolbar" data-export-ignore="true">
          <button type="button" class="toolbar-btn" @click="toggleHandNumbers">
            {{ showHandNumbers ? '不显示手数' : '显示手数' }}
          </button>
          <button type="button" class="toolbar-btn" @click="handlePass">
            停一手（{{ nextPlayerLabel }}）
          </button>
        </div>
        <CornerBoard
          v-if="isCorner"
          :block="block"
          :showHandNumbers="showHandNumbers"
          :triangleMarks="triangleMarks"
          :nextPlayer="nextPlayer"
          @place="handlePlace"
          @mark-triangle="handleMarkTriangle"
        />
        <div
          v-else
          ref="host"
          class="full-board-host"
          @contextmenu.prevent="handleBoardRightClick"
        ></div>
      </div>

      <button
        type="button"
        class="side-handle right"
        data-export-ignore="true"
        :class="{visible: hovering || hasRight}"
        @click.stop="emit('toggle-side', {blockId: block.id, side: 'right'})"
      >
        添加讲解 ▶
      </button>
    </div>

    <div v-if="hasRight" class="side-text right">
      <div class="side-toolbar" data-export-ignore="true">
        <label>
          字体
          <select v-model="rightFont.family" @change="emitSideStyle('right')">
            <option value="Microsoft YaHei">微软雅黑</option>
            <option value="SimSun">宋体</option>
            <option value="KaiTi">楷体</option>
            <option value="Arial">Arial</option>
          </select>
        </label>
        <label>
          大小
          <select
            v-model.number="rightFont.size"
            @change="emitSideStyle('right')"
          >
            <option :value="14">14</option>
            <option :value="16">16</option>
            <option :value="18">18</option>
            <option :value="20">20</option>
            <option :value="22">22</option>
          </select>
        </label>
        <label>
          颜色
          <input
            type="color"
            v-model="rightFont.color"
            @change="emitSideStyle('right')"
          />
        </label>
      </div>
      <textarea
        class="side-area"
        :style="sideStyle('right')"
        :value="block.rightText"
        placeholder="请输入右侧讲解…"
        @input="handleSideInput('right', $event)"
      ></textarea>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch
} from 'vue'
import {h} from 'preact'
import {render} from 'preact'
import {BoundedGoban} from '@sabaki/shudan'
import {fromDimensions} from '@sabaki/go-board'
import CornerBoard from './CornerBoard.vue'

const props = defineProps({
  block: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['place', 'toggle-side', 'side-text', 'side-style'])

const host = ref(null)
const hovering = ref(false)

const isCorner = computed(() => (props.block.variant ?? 'full') === 'corner')
const hasLeft = computed(() => props.block.leftText != null)
const hasRight = computed(() => props.block.rightText != null)

const blockClass = computed(() => ({
  'with-left': hasLeft.value,
  'with-right': hasRight.value
}))

const leftFont = reactive({
  family: 'Microsoft YaHei',
  size: 16,
  color: '#1f2937'
})

const rightFont = reactive({
  family: 'Microsoft YaHei',
  size: 16,
  color: '#1f2937'
})

// 关键：直接用 block 的 showHandNumbers 和 triangleMarks
const showHandNumbers = ref(props.block.showHandNumbers ?? true)
const triangleMarks = ref(props.block.triangleMarks ?? [])

const nextPlayer = ref(props.block.nextPlayer ?? 1)
const nextPlayerLabel = computed(() => (nextPlayer.value === 1 ? '黑' : '白'))

const syncBlockState = () => {
  props.block.showHandNumbers = showHandNumbers.value
  props.block.triangleMarks = triangleMarks.value.slice()
}

const toggleHandNumbers = () => {
  showHandNumbers.value = !showHandNumbers.value
  syncBlockState()
  mountBoard()
}

const handlePass = () => {
  nextPlayer.value = -nextPlayer.value
}

const emitSideStyle = side => {
  const payload =
    side === 'left'
      ? {family: leftFont.family, size: leftFont.size, color: leftFont.color}
      : {family: rightFont.family, size: rightFont.size, color: rightFont.color}

  emit('side-style', {
    blockId: props.block.id,
    side,
    style: payload
  })
}

const sideStyle = side => {
  const style = side === 'left' ? leftFont : rightFont
  return {
    fontFamily: style.family,
    fontSize: `${style.size}px`,
    color: style.color
  }
}

const boardProps = computed(() => {
  const size = props.block.size ?? 19
  const moves = Array.isArray(props.block.moves) ? props.block.moves : []
  let board = fromDimensions(size, size)

  const markerMap = Array.from({length: size}, () =>
    Array.from({length: size}, () => null)
  )

  moves.forEach((move, index) => {
    const vertex = move.vertex ?? move
    const sign = move.sign ?? (move.player ?? (index % 2 === 0 ? 1 : -1))
    if (!Array.isArray(vertex) || vertex.length !== 2) return
    if (!board.has(vertex)) return

    board = board.makeMove(sign, vertex)
    const [x, y] = vertex
    const isTriangle = triangleMarks.value.some(
      v => v[0] === x && v[1] === y
    )
    markerMap[y][x] = isTriangle
      ? {type: 'triangle'}
      : showHandNumbers.value
      ? {type: 'label', label: (index + 1).toString()}
      : null
  })

  const boardSize = size <= 9 ? 220 : size <= 13 ? 320 : 460

  return {
    signMap: board.signMap,
    markerMap,
    coordX: index => index + 1,
    coordY: index => size - index,
    boardSize
  }
})

const handleMarkTriangle = vertex => {
  const idx = triangleMarks.value.findIndex(
    v => v[0] === vertex[0] && v[1] === vertex[1]
  )
  if (idx === -1) {
    triangleMarks.value.push(vertex)
  } else {
    triangleMarks.value.splice(idx, 1)
  }
  syncBlockState()
}

const handlePlace = ({blockId, vertex}) => {
  emit('place', {blockId, vertex, sign: nextPlayer.value})
  nextPlayer.value = -nextPlayer.value
}

const handleVertexMouseUp = (evt, vertex) => {
  const v = Array.isArray(vertex) ? vertex : evt?.vertex
  if (!Array.isArray(v) || v.length !== 2) return
  if (evt.button === 2) {
    handleMarkTriangle(v)
    return
  }
  handlePlace({blockId: props.block.id, vertex: v})
}

const handleBoardRightClick = evt => {
  evt.preventDefault()
}

const mountBoard = () => {
  if (!host.value || isCorner.value) return
  const {signMap, markerMap, coordX, coordY, boardSize} = boardProps.value

  render(
    h(BoundedGoban, {
      signMap,
      markerMap,
      coordX,
      coordY,
      showCoordinates: true,
      maxWidth: boardSize,
      maxHeight: boardSize,
      animateStonePlacement: false,
      onVertexMouseUp: handleVertexMouseUp
    }),
    host.value
  )
}

const handleSideInput = (side, event) => {
  emit('side-text', {
    blockId: props.block.id,
    side,
    content: event.target.value
  })
}

onMounted(() => {
  if (!isCorner.value) mountBoard()
})

watch(
  () => [props.block.moves, props.block.size, props.block.variant, showHandNumbers.value, triangleMarks.value],
  () => {
    syncBlockState()
    if (isCorner.value) {
      // 角部棋盘不需要 mountBoard，CornerBoard.vue 响应 props
    } else {
      mountBoard()
    }
  },
  {deep: true}
)

onBeforeUnmount(() => {
  if (host.value) render(null, host.value)
})
</script>

<style scoped>
.board-block {
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 16px;
  position: relative;
  padding: 12px 0;
  width: 100%;
}

.board-wrapper {
  display: flex;
  align-items: center;
  gap: 0;
  position: relative;
}

.board-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.board-toolbar {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  padding: 2px 8px;
  border-radius: 5px;
  border: 1px solid #2563eb;
  background: #f3f6fd;
  color: #2563eb;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 1px 2px rgba(37,99,235,0.06);
  transition: background 0.15s;
}

.toolbar-btn:hover {
  background: #e0e7ff;
}

.full-board-host,
.corner-board {
  margin-top: 24px;
}

.side-handle {
  position: relative;
  top: 0;
  background: #f3f6fd;
  color: #2563eb;
  border: 1px solid #2563eb;
  border-radius: 6px;
  padding: 2px 10px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  z-index: 2;
  transition: background 0.15s;
}

.side-handle.left {
  margin-right: 8px;
  align-self: flex-start;
}

.side-handle.right {
  margin-left: 8px;
  align-self: flex-end;
}

.side-handle:hover {
  background: #e0e7ff;
}

.side-text {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
  max-width: 180px;
}

.side-area {
  width: 100%;
  min-height: 80px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 8px;
  font-size: 15px;
  font-family: inherit;
  background: #fff;
  resize: vertical;
}
</style>