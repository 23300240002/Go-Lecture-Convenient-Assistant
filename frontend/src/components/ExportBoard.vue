<template>
  <div class="export-board">
    <img
      v-if="boardImage"
      :src="boardImage"
      alt="棋盘示意"
      class="export-board-image"
    />
  </div>
</template>

<script setup>
import {onMounted, ref, watch, computed} from 'vue'

const props = defineProps({
  block: {
    type: Object,
    required: true
  }
})

const boardImage = ref('')

// 关键：用 block 的状态
const showHandNumbers = computed(() => props.block.showHandNumbers ?? true)
const triangleMarks = computed(() => props.block.triangleMarks ?? [])

const drawBoard = () => {
  const block = props.block
  const size = block.size ?? 19
  const moves = Array.isArray(block.moves) ? block.moves : []
  const viewport = normalizeViewport(block.viewport, size)

  const columns = viewport ? viewport.width : size
  const rows = viewport ? viewport.height : size
  const cell = viewport ? 22 : 24
  const padding = viewport ? 26 : 30
  const width = (columns - 1) * cell + padding * 2
  const height = (rows - 1) * cell + padding * 2

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.fillStyle = '#f8d48b'
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = '#5c3b16'
  ctx.lineWidth = 1.35

  const startX = padding
  const startY = padding

  for (let i = 0; i < columns; i++) {
    const x = startX + i * cell
    ctx.beginPath()
    ctx.moveTo(x, startY)
    ctx.lineTo(x, startY + (rows - 1) * cell)
    ctx.stroke()
  }

  for (let j = 0; j < rows; j++) {
    const y = startY + j * cell
    ctx.beginPath()
    ctx.moveTo(startX, y)
    ctx.lineTo(startX + (columns - 1) * cell, y)
    ctx.stroke()
  }

  const starPoints = getStarPoints(size, viewport)
  ctx.fillStyle = '#5c3b16'
  starPoints.forEach(([x, y]) => {
    ctx.beginPath()
    ctx.arc(startX + x * cell, startY + y * cell, 3.2, 0, Math.PI * 2)
    ctx.fill()
  })

  const stones = buildStones(size, moves)
  stones.forEach((stone, index) => {
    const draw = projectVertex(stone.vertex, viewport)
    if (!draw) return
    const [dx, dy] = draw
    const centerX = startX + dx * cell
    const centerY = startY + dy * cell
    const radius = cell * 0.4

    ctx.beginPath()
    ctx.fillStyle = stone.sign > 0 ? '#1f2933' : '#f6f7fb'
    ctx.strokeStyle = '#1f2933'
    ctx.lineWidth = 1.25
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // 判断是否三角
    const isTriangle = triangleMarks.value.some(
      v => v[0] === stone.vertex[0] && v[1] === stone.vertex[1]
    )
    if (isTriangle) {
      ctx.save()
      ctx.beginPath()
      ctx.strokeStyle = stone.sign > 0 ? '#fff' : '#222'
      ctx.lineWidth = 2
      const triR = radius * 0.7
      ctx.moveTo(centerX, centerY - triR)
      ctx.lineTo(centerX - triR * 0.866, centerY + triR * 0.5)
      ctx.lineTo(centerX + triR * 0.866, centerY + triR * 0.5)
      ctx.closePath()
      ctx.stroke()
      ctx.restore()
    } else if (showHandNumbers.value) {
      ctx.fillStyle = stone.sign > 0 ? '#f6f7fb' : '#1f2933'
      ctx.font = `${Math.round(cell * 0.4)}px "Microsoft YaHei", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(index + 1), centerX, centerY)
    }
  })

  boardImage.value = canvas.toDataURL('image/png')
}

const normalizeViewport = (viewport, size) => {
  if (!viewport) return null
  const width = Math.max(2, Math.min(size, viewport.width ?? size))
  const height = Math.max(2, Math.min(size, viewport.height ?? size))
  const x = Math.max(0, Math.min(size - width, viewport.x ?? 0))
  const y = Math.max(0, Math.min(size - height, viewport.y ?? 0))
  return {x, y, width, height}
}

const getStarPoints = (size, viewport) => {
  if (size < 7) return []
  const coords =
    size === 9 ? [2, 4, 6] : size === 13 ? [3, 6, 9] : [3, 9, 15]

  const base = []
  coords.forEach(x => {
    coords.forEach(y => {
      base.push([x, y])
    })
  })

  if (!viewport) return base
  return base
    .filter(
      ([x, y]) =>
        x >= viewport.x &&
        x <= viewport.x + viewport.width - 1 &&
        y >= viewport.y &&
        y <= viewport.y + viewport.height - 1
    )
    .map(([x, y]) => [x - viewport.x, y - viewport.y])
}

const buildStones = (size, moves) => {
  const stones = []

  moves.forEach((move, index) => {
    const vertex = move.vertex ?? move
    const sign = move.sign ?? (move.player ?? (index % 2 === 0 ? 1 : -1))
    if (!Array.isArray(vertex) || vertex.length !== 2) return
    const [x, y] = vertex
    if (x < 0 || y < 0 || x >= size || y >= size) return
    stones.push({vertex: [x, y], sign})
  })

  return stones
}

const projectVertex = (vertex, viewport) => {
  if (!Array.isArray(vertex) || vertex.length !== 2) return null
  if (!viewport) return vertex
  const [x, y] = vertex
  if (
    x < viewport.x ||
    y < viewport.y ||
    x > viewport.x + viewport.width - 1 ||
    y > viewport.y + viewport.height - 1
  ) {
    return null
  }
  return [x - viewport.x, y - viewport.y]
}

onMounted(drawBoard)

watch(
  () => [
    props.block.moves,
    props.block.size,
    props.block.variant,
    props.block.viewport,
    props.block.showHandNumbers,
    props.block.triangleMarks
  ],
  drawBoard,
  {deep: true}
)
</script>

<style scoped>
.export-board {
  display: flex;
  justify-content: center;
  align-items: center;
}

.export-board-image {
  max-width: 400px;
  height: auto;
  display: block;
}
</style>