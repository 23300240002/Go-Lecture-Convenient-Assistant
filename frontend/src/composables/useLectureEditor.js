import {computed, reactive} from 'vue'

let pageCounter = 1
let blockCounter = 0

const defaultTextStyle = {
  family: 'Microsoft YaHei',
  size: 18,
  color: '#1f2937'
}

const defaultSideStyle = {
  family: 'Microsoft YaHei',
  size: 16,
  color: '#1f2937'
}

const createHeading = () => ({
  main: {
    enabled: true,
    content: '',
    style: {
      family: 'Microsoft YaHei',
      size: 36,
      color: '#0f172a'
    }
  },
  sub: {
    enabled: false,
    content: '',
    style: {
      family: 'Microsoft YaHei',
      size: 24,
      color: '#334155'
    }
  }
})

const state = reactive({
  pages: [
    {
      id: 'page-1',
      title: '第 1 页',
      heading: createHeading(),
      blocks: []
    }
  ],
  currentPageId: 'page-1'
})

export const currentPage = computed(
  () => state.pages.find(page => page.id === state.currentPageId) ?? null
)

function locatePage(pageId) {
  return state.pages.find(page => page.id === pageId) ?? null
}

function insertBlock(page, index, block) {
  if (!page) return
  if (index == null || index < 0 || index > page.blocks.length) {
    page.blocks.push(block)
  } else {
    page.blocks.splice(index, 0, block)
  }
}

function findBlock(page, blockId) {
  if (!page) return null
  return page.blocks.find(block => block.id === blockId) ?? null
}

function ensureHeading(page) {
  if (!page.heading) {
    page.heading = createHeading()
  }
}

export function useLectureEditor() {
  const addPage = () => {
    pageCounter += 1
    const id = `page-${pageCounter}`

    state.pages.push({
      id,
      title: `第 ${pageCounter} 页`,
      heading: createHeading(),
      blocks: []
    })
    state.currentPageId = id
  }

  const selectPage = id => {
    if (state.pages.some(page => page.id === id)) {
      state.currentPageId = id
    }
  }

  const removePage = id => {
    if (state.pages.length === 1) return

    const index = state.pages.findIndex(page => page.id === id)
    if (index === -1) return

    state.pages.splice(index, 1)

    if (state.currentPageId === id) {
      const next = state.pages[Math.max(0, index - 1)]
      state.currentPageId = next.id
    }
  }

  const insertTextBlock = ({
    pageId = state.currentPageId,
    index = null,
    content = ''
  } = {}) => {
    const page = locatePage(pageId)
    if (!page) return

    insertBlock(page, index, {
      id: `block-${++blockCounter}`,
      type: 'text',
      content,
      style: {...defaultTextStyle}
    })
  }

  const updateTextBlock = ({pageId = state.currentPageId, blockId, content}) => {
    const page = locatePage(pageId)
    if (!page) return

    const block = findBlock(page, blockId)
    if (!block || block.type !== 'text') return

    block.content = content
  }

  const updateTextStyle = ({
    pageId = state.currentPageId,
    blockId,
    style
  }) => {
    const page = locatePage(pageId)
    if (!page) return

    const block = findBlock(page, blockId)
    if (!block || block.type !== 'text') return

    block.style = {
      ...defaultTextStyle,
      ...(block.style ?? {}),
      ...(style ?? {})
    }
  }

  const insertBoardBlock = ({
    pageId = state.currentPageId,
    index = null,
    variant = 'full',
    size = 19,
    viewport = null
  } = {}) => {
    const page = locatePage(pageId)
    if (!page) return

    insertBlock(page, index, {
      id: `block-${++blockCounter}`,
      type: 'board',
      variant,
      size,
      viewport,
      moves: [],
      nextPlayer: 1,
      leftText: null,
      rightText: null,
      leftStyle: null,
      rightStyle: null
    })
  }

  const removeBlock = ({pageId = state.currentPageId, blockId} = {}) => {
    const page = locatePage(pageId)
    if (!page) return

    const idx = page.blocks.findIndex(block => block.id === blockId)
    if (idx !== -1) page.blocks.splice(idx, 1)
  }

  const setBoardState = ({
    pageId = state.currentPageId,
    blockId,
    moves,
    nextPlayer
  }) => {
    const page = locatePage(pageId)
    if (!page) return

    const block = findBlock(page, blockId)
    if (!block || block.type !== 'board') return

    if (Array.isArray(moves)) block.moves = moves
    if (nextPlayer === 1 || nextPlayer === -1) block.nextPlayer = nextPlayer
  }

  const toggleBoardSide = ({pageId = state.currentPageId, blockId, side}) => {
    const page = locatePage(pageId)
    if (!page) return

    const block = findBlock(page, blockId)
    if (!block || block.type !== 'board') return

    const key = side === 'right' ? 'rightText' : 'leftText'
    const styleKey = side === 'right' ? 'rightStyle' : 'leftStyle'
    if (block[key] == null) {
      block[key] = ''
      block[styleKey] = {...defaultSideStyle}
    } else {
      block[key] = null
      block[styleKey] = null
    }
  }

  const updateBoardSideText = ({
    pageId = state.currentPageId,
    blockId,
    side,
    content
  }) => {
    const page = locatePage(pageId)
    if (!page) return

    const block = findBlock(page, blockId)
    if (!block || block.type !== 'board') return

    const key = side === 'right' ? 'rightText' : 'leftText'
    if (block[key] == null) return
    block[key] = content
  }

  const updateBoardSideStyle = ({
    pageId = state.currentPageId,
    blockId,
    side,
    style = {}
  }) => {
    const page = locatePage(pageId)
    if (!page) return

    const block = findBlock(page, blockId)
    if (!block || block.type !== 'board') return

    const styleKey = side === 'right' ? 'rightStyle' : 'leftStyle'
    if (block[styleKey] == null) return
    block[styleKey] = {
      ...defaultSideStyle,
      ...(block[styleKey] ?? {}),
      ...style
    }
  }

  const toggleHeadingSegment = ({
    pageId = state.currentPageId,
    target = 'main'
  } = {}) => {
    const page = locatePage(pageId)
    if (!page) return

    ensureHeading(page)
    const segment = page.heading?.[target]
    if (!segment) return

    segment.enabled = !segment.enabled
  }

  const updateHeadingContent = ({
    pageId = state.currentPageId,
    target = 'main',
    content = ''
  } = {}) => {
    const page = locatePage(pageId)
    if (!page) return

    ensureHeading(page)
    const segment = page.heading?.[target]
    if (!segment) return
    segment.content = content
  }

  const updateHeadingStyle = ({
    pageId = state.currentPageId,
    target = 'main',
    style = {}
  } = {}) => {
    const page = locatePage(pageId)
    if (!page) return

    ensureHeading(page)
    const segment = page.heading?.[target]
    if (!segment) return

    segment.style = {
      ...(segment.style ?? {}),
      ...style
    }
  }

  return {
    state,
    currentPage,
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
  }
}