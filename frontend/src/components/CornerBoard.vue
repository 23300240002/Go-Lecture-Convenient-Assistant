<template>
  <svg
    ref="svgRef"
    :width="boardWidth"
    :height="boardHeight"
    class="corner-board"
    @pointerup="handlePointer"
  >
    <rect
      x="0"
      y="0"
      :width="boardWidth"
      :height="boardHeight"
      fill="#f0c559"
    />

    <line
      v-for="line in verticalLines"
      :key="`v-${line.index}`"
      :x1="line.x"
      :y1="line.y1"
      :x2="line.x"
      :y2="line.y2"
      :stroke="line.stroke"
      :stroke-width="line.width"
      stroke-linecap="square"
    />
    <line
      v-for="line in horizontalLines"
      :key="`h-${line.index}`"
      :x1="line.x1"
      :x2="line.x2"
      :y1="line.y"
      :y2="line.y"
      :stroke="line.stroke"
      :stroke-width="line.width"
      stroke-linecap="square"
    />

    <circle
      v-for="hoshi in starPoints"
      :key="`star-${hoshi.cx}-${hoshi.cy}`"
      :cx="hoshi.cx"
      :cy="hoshi.cy"
      :r="starRadius"
      fill="#4b3411"
    />

    <g v-for="stone in stones" :key="stone.id">
      <circle
        :cx="stone.cx"
        :cy="stone.cy"
        :r="stoneRadius"
        :fill="stone.sign > 0 ? '#111' : '#fdfdfd'"
        stroke="#000"
        stroke-width="0.3"
      />
      <template v-if="isTriangle(stone.vertex)">
        <polygon
          :points="trianglePoints(stone.cx, stone.cy, stoneRadius * 0.7)"
          :fill="stone.sign > 0 ? '#fff' : '#222'"
          opacity="0.85"
        />
      </template>
      <text
        v-else-if="showHandNumbers"
        :x="stone.cx"
        :y="stone.cy"
        :fill="stone.sign > 0 ? '#fdfdfd' : '#111'"
        font-size="16"
        font-weight="600"
        text-anchor="middle"
        dominant-baseline="middle"
        paint-order="normal"
      >
        {{ stone.label }}
      </text>
    </g>
  </svg>
</template>

<script setup>
import {computed, ref} from 'vue'

const props = defineProps({
  block: {
    type: Object,
    required: true
  },
  showHandNumbers: {
    type: Boolean,
    default: true
  },
  triangleMarks: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['place', 'mark-triangle'])

const svgRef = ref(null)

const BOARD_COLOR = '#f0c559'
const LINE_COLOR = '#4b3411'
const CELL_SIZE = 32
const EDGE_STROKE = 3.2
const LINE_STROKE = 1.7
const LEFT_MARGIN = 42
const BOTTOM_MARGIN = 42
const TOP_CUT = CELL_SIZE / 2
const RIGHT_CUT = CELL_SIZE / 2
const STAR_RADIUS = 3.4
const STONE_RADIUS = CELL_SIZE * 0.46

const size = computed(() => Math.max(9, props.block.size ?? 19))

const viewport = computed(() => {
  const base = props.block.viewport ?? {
    x: 0,
    y: size.value - 10,
    width: 10,
    height: 10
  }

  let x = Math.max(0, Math.min(base.x ?? 0, size.value - 1))
  let y = Math.max(0, Math.min(base.y ?? 0, size.value - 1))
  let width = Math.max(1, Math.min(base.width ?? size.value, size.value - x))
  let height = Math.max(1, Math.min(base.height ?? size.value, size.value - y))

  return {x, y, width, height}
})

const boardWidth = computed(
  () => LEFT_MARGIN + RIGHT_CUT + CELL_SIZE * (viewport.value.width - 1)
)
const boardHeight = computed(
  () => TOP_CUT + BOTTOM_MARGIN + CELL_SIZE * (viewport.value.height - 1)
)

const originX = computed(() => LEFT_MARGIN)
const originY = computed(() => boardHeight.value - BOTTOM_MARGIN)

const verticalLines = computed(() => {
  const lines = []
  for (let col = 0; col < viewport.value.width; col++) {
    const x = originX.value + CELL_SIZE * col
    lines.push({
      index: col,
      x,
      y1: originY.value,
      y2: TOP_CUT,
      stroke: LINE_COLOR,
      width: col === 0 ? EDGE_STROKE : LINE_STROKE
    })
  }
  return lines
})

const horizontalLines = computed(() => {
  const lines = []
  const rightLimit =
    originX.value + CELL_SIZE * (viewport.value.width - 1) + RIGHT_CUT
  for (let row = 0; row < viewport.value.height; row++) {
    const y = originY.value - CELL_SIZE * row
    lines.push({
      index: row,
      x1: originX.value,
      x2: rightLimit,
      y,
      stroke: LINE_COLOR,
      width: row === 0 ? EDGE_STROKE : LINE_STROKE
    })
  }
  return lines
})

const STAR_POSITIONS = [
  [3, 3],
  [3, 9],
  [3, 15],
  [9, 3],
  [9, 9],
  [9, 15],
  [15, 3],
  [15, 9],
  [15, 15]
]

const starPoints = computed(() =>
  STAR_POSITIONS.filter(([x, y]) => {
    const view = viewport.value
    return (
      x >= view.x &&
      x < view.x + view.width &&
      y >= view.y &&
      y < view.y + view.height
    )
  }).map(([x, y]) => {
    const view = viewport.value
    const localCol = x - view.x
    const localRow = view.height - 1 - (y - view.y)

    return {
      cx: originX.value + CELL_SIZE * localCol,
      cy: originY.value - CELL_SIZE * localRow
    }
  })
)

const stones = computed(() => {
  const moves = Array.isArray(props.block.moves) ? props.block.moves : []
  const view = viewport.value
  const list = []

  moves.forEach((move, index) => {
    const vertex = move.vertex ?? move
    const sign = move.sign ?? (move.player ?? (index % 2 === 0 ? 1 : -1))

    if (
      !Array.isArray(vertex) ||
      vertex.length !== 2 ||
      vertex[0] < view.x ||
      vertex[0] >= view.x + view.width ||
      vertex[1] < view.y ||
      vertex[1] >= view.y + view.height
    ) {
      return
    }

    const localCol = vertex[0] - view.x
    const localRow = view.height - 1 - (vertex[1] - view.y)

    list.push({
      id: `${vertex[0]}-${vertex[1]}`,
      cx: originX.value + CELL_SIZE * localCol,
      cy: originY.value - CELL_SIZE * localRow,
      sign,
      label: (index + 1).toString(),
      vertex
    })
  })

  return list
})

const starRadius = computed(() => STAR_RADIUS)
const stoneRadius = computed(() => STONE_RADIUS)

const isTriangle = vertex => {
  return props.triangleMarks?.some(
    v => v[0] === vertex[0] && v[1] === vertex[1]
  )
}

const trianglePoints = (cx, cy, r) => {
  const p1 = `${cx},${cy - r}`
  const p2 = `${cx - r * 0.866},${cy + r * 0.5}`
  const p3 = `${cx + r * 0.866},${cy + r * 0.5}`
  return `${p1} ${p2} ${p3}`
}

// 只用 pointerup 事件处理右键和左键
const handlePointer = evt => {
  if (!svgRef.value) return
  const rect = svgRef.value.getBoundingClientRect()
  const x = evt.clientX - rect.left
  const y = evt.clientY - rect.top
  const view = viewport.value

  const minX = originX.value - CELL_SIZE / 2
  const maxX =
    originX.value + CELL_SIZE * (view.width - 1) + CELL_SIZE / 2
  const minY = TOP_CUT - CELL_SIZE / 2
  const maxY = originY.value + CELL_SIZE / 2

  if (x < minX || x > maxX || y < minY || y > maxY) return

  const approxCol = Math.round((x - originX.value) / CELL_SIZE)
  const approxRowFromBottom = Math.round(
    (originY.value - y) / CELL_SIZE
  )

  if (
    approxCol < 0 ||
    approxCol >= view.width ||
    approxRowFromBottom < 0 ||
    approxRowFromBottom >= view.height
  ) {
    return
  }

  const boardX = view.x + approxCol
  const boardY =
    view.y + (view.height - 1 - approxRowFromBottom)

  if (evt.button === 2) {
    // 右键标三角
    emit('mark-triangle', [boardX, boardY])
    evt.preventDefault()
  } else if (evt.button === 0) {
    // 左键落子
    emit('place', {blockId: props.block.id, vertex: [boardX, boardY]})
  }
}
</script>

<style scoped>
.corner-board {
  display: block;
  cursor: pointer;
  user-select: none;
  background: radial-gradient(circle at 35% 65%, #f6d87a, #f0c559 60%);
  border-radius: 10px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.corner-board text {
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
}
</style>