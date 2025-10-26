export const EXPORT_STYLES = `
@page {
  size: A4;
  margin: 18mm 20mm 18mm 20mm;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: #fff;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
  color: #0f172a;
}
.export-root {
  padding: 0;
}
.export-page {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0 24px;
}
.export-heading {
  text-align: center;
  margin-bottom: 4px;
}
.export-title {
  font-size: 30px;
  margin: 0;
  line-height: 1.15;
}
.export-subtitle {
  font-size: 20px;
  margin: 8px 0 0;
  line-height: 1.25;
  color: #374151;
}
.export-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  page-break-inside: avoid;
}
.export-text {
  font-size: 16px;
  line-height: 1.6;
}
.export-text p {
  margin: 0 0 6px;
}
.export-board-block {
  width: 100%;
}
.export-board-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.export-board-side {
  flex: 0 0 140px;
  line-height: 1.55;
  font-size: 14px;
}
.export-board-center {
  flex: 1;
  display: flex;
  justify-content: center;
}
.export-board img,
.export-board-image {
  display: block;
  max-width: 400px;
  height: auto;
}
@media print {
  body {
    background: #fff;
  }
  .export-page {
    box-shadow: none;
  }
}
`