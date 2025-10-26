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

    <div class="board-toolbar" data-export-ignore="true">
      <button type="button" @click="toggleHandNumbers">
        {{ showHandNumbers ? '不显示手数' : '显示手数' }}
      </button>
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

      <CornerBoard
        v-if="isCorner"
        :block="block"
        :showHandNumbers="showHandNumbers"
        :triangleMarks="triangleMarks"
        @place="emit('place', $event)"
        @mark-triangle="handleMarkTriangle"
      />
      <div
        v-else
        ref="host"
        class="full-board-host"
        @contextmenu.prevent="handleBoardRightClick"
      ></div>

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

const showHandNumbers = ref(true)
// triangleMarks 必须是 ref([])，且只由 BoardBlock.vue 维护
const triangleMarks = ref([])

const toggleHandNumbers = () => {
  showHandNumbers.value = !showHandNumbers.value
  mountBoard()
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
    // 三角优先
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

// 右键标三角，triangleMarks 持久化
const handleMarkTriangle = vertex => {
  const idx = triangleMarks.value.findIndex(
    v => v[0] === vertex[0] && v[1] === vertex[1]
  )
  if (idx === -1) {
    triangleMarks.value.push(vertex)
  } else {
    triangleMarks.value.splice(idx, 1)
  }
  // 这里不需要 mountBoard，CornerBoard.vue 会自动响应 triangleMarks 的变化
}

const handleVertexMouseUp = (evt, vertex) => {
  const v = Array.isArray(vertex) ? vertex : evt?.vertex
  if (!Array.isArray(v) || v.length !== 2) return
  if (evt.button === 2) {
    handleMarkTriangle(v)
    return
  }
  emit('place', {blockId: props.block.id, vertex: v})
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
.board-toolbar {
  margin-bottom: 8px;
}
.board-toolbar button {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #2563eb;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.board-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  padding: 16px 48px;
  margin: 0 auto;
  flex: 0 1 auto;
}

.full-board-host {
  display: flex;
  justify-content: center;
  align-items: center;
}

.side-text {
  flex: 0 0 240px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.side-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
}

.side-toolbar label {
  display: flex;
  align-items: center;
  gap: 4px;
}

.side-toolbar select,
.side-toolbar input[type='color'] {
  border: 1px solid #cbd5f5;
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 12px;
  background: #fff;
}

.side-area {
  width: 100%;
  min-height: 240px;
  resize: vertical;
  border: 1px solid #cbd5f5;
  border-radius: 16px;
  padding: 14px;
  line-height: 1.6;
  background: #fff;
  box-shadow: inset 0 1px 4px rgba(15, 23, 42, 0.08);
}

.side-area:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.18);
}

.side-handle {
  position: absolute;
  top: 50%;
  padding: 6px 12px;
  font-size: 13px;
  color: #fff;
  background: rgba(37, 99, 235, 0.88);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.side-handle.visible {
  opacity: 1;
  pointer-events: auto;
}

.side-handle.left {
  left: 12px;
  transform: translate(-100%, -50%);
}

.side-handle.right {
  right: 12px;
  transform: translate(100%, -50%);
}
</style>