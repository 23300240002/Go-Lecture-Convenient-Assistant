<template>
  <article class="export-page">
    <header class="export-heading" v-if="hasHeading">
      <h1
        v-if="heading.main?.enabled && heading.main?.content"
        class="export-title"
        :style="fontStyle(heading.main.style)"
        v-html="heading.main.content"
      ></h1>
      <h2
        v-if="heading.sub?.enabled && heading.sub?.content"
        class="export-subtitle"
        :style="fontStyle(heading.sub.style)"
        v-html="heading.sub.content"
      ></h2>
    </header>

    <section
      v-for="block in blocks"
      :key="block.id"
      class="export-block"
    >
      <div
        v-if="block.type === 'text'"
        class="export-text"
        :style="textStyle(block)"
        v-html="block.content || ''"
      ></div>

      <div v-else class="export-board-block">
        <div class="export-board-row">
          <div
            v-if="block.leftText != null"
            class="export-board-side"
            :style="fontStyle(block.leftStyle)"
            v-html="formatPlain(block.leftText)"
          ></div>

          <div class="export-board-center">
            <ExportBoard :block="block" />
          </div>

          <div
            v-if="block.rightText != null"
            class="export-board-side"
            :style="fontStyle(block.rightStyle)"
            v-html="formatPlain(block.rightText)"
          ></div>
        </div>
      </div>
    </section>
  </article>
</template>

<script setup>
import {computed} from 'vue'
import ExportBoard from './ExportBoard.vue'

const props = defineProps({
  page: {
    type: Object,
    required: true
  }
})

const heading = computed(() => props.page.heading ?? null)
const blocks = computed(() => props.page.blocks ?? [])
const hasHeading = computed(() => {
  if (!heading.value) return false
  const {main, sub} = heading.value
  return (
    (main?.enabled && !!main?.content) ||
    (sub?.enabled && !!sub?.content)
  )
})

const fontStyle = style => {
  return {
    fontFamily:
      style?.family ?? '"Microsoft YaHei", "PingFang SC", sans-serif',
    fontSize: style?.size ? `${style.size}px` : undefined,
    color: style?.color ?? '#0f172a',
    lineHeight: 1.5
  }
}

const textStyle = block => fontStyle(block.style)

const escapeHtml = text =>
  (text ?? '').replace(
    /[&<>"']/g,
    m =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[m])
  )

const formatPlain = text =>
  escapeHtml(text ?? '').replace(/\n/g, '<br />')
</script>