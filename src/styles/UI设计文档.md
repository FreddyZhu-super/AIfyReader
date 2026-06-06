# Peter Markdown — 前端 UI 设计

> 目标：1:1 还原 Typora 的极简编辑体验，同时融合文件浏览模式。

---

## 一、布局总览

```
┌──────────────────────────────────────────────────────────┐
│  Title Bar (macOS 风格 traffic light + 标题)              │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ● ● ●   Peter Markdown — readme.md              □ □ │ │
│  └─────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│  ┌────────────┬──────────────────────────────────────┐   │
│  │            │                                      │   │
│  │  🔍 搜索   │                                      │   │
│  │            │                                      │   │
│  │  📁 docs/  │        WYSIWYG 编辑区                  │   │
│  │    ├ readme│                                      │   │
│  │    ├ guide │    # 欢迎使用 Peter Markdown           │   │
│  │    └ api   │                                      │   │
│  │            │    这是一段**加粗**的文字               │   │
│  │  📁 src/   │                                      │   │
│  │    ├ index │    ## 快速开始                        │   │
│  │    └ app   │                                      │   │
│  │            │    > 引用块示例                        │   │
│  │            │                                      │   │
│  │            │    ```python                          │   │
│  │            │    print("Hello World")               │   │
│  │            │    ```                                │   │
│  │            │                                      │   │
│  │            │    - [x] 已完成任务                    │   │
│  │            │    - [ ] 待办任务                      │   │
│  │            │                                      │   │
│  │            │                                      │   │
│  └────────────┴──────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────┤
│  Words: 342  |  Chars: 2104  |  Ln 15, Col 42  |  MD  │
└──────────────────────────────────────────────────────────┘
```

---

## 二、Typora 设计语言分析

### 2.1 极简主义核心

Typora 的设计哲学是 **"内容优先，工具隐藏"**：

| 原则 | 体现 |
|------|------|
| **无模式工具栏** | 没有传统编辑器的格式工具栏，格式通过 Markdown 语法自动转换 |
| **内容即界面** | 编辑区占据几乎全部空间，UI 元素只有在需要时才出现 |
| **克制使用边框** | 用留白和阴影替代线条边框，面板之间用细微背景色区分 |
| **平滑过渡** | 所有交互都有淡入淡出或平滑动画 |

### 2.2 色彩体系

**亮色主题（参考 Typora 默认 GitHub 风格）：**

```
背景色     #ffffff (编辑区) / #f8f8f8 (侧边栏)
文字色     #333333 (正文) / #555555 (次要)
边框色     #e8e8e8 (极浅灰)
选中高亮   #d6e8ff (浅蓝)
滚动条     #c1c1c1
链接色     #4183c4 (GitHub 蓝)
代码背景   #f8f8f8 (浅灰)
表格边框   #dfe2e5
引用块左边  #4183c4 (蓝色竖线)
标题色     #222222 (比正文更黑)
```

**暗色主题（参考 Typora Night / GitHub Dark）：**

```
背景色     #1e1e1e (编辑区) / #252525 (侧边栏)
文字色     #c9d1d9 (正文) / #8b949e (次要)
边框色     #30363d
选中高亮   #264f78 (深蓝)
滚动条     #484848
链接色     #58a6ff
代码背景   #2d2d2d
表格边框   #30363d
引用块左边  #58a6ff
标题色     #e6edf3 (比正文更白)
```

### 2.3 字体体系

```
编辑区字体: 'JetBrains Mono', 'Source Code Pro', 'Consolas', 'Noto Sans SC', monospace
           正文 16px，代码 14px，标题按层级递减

侧边栏字体: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif
           文件树 14px，搜索框 13px

行高:      1.6 (正文) / 1.2 (标题)
```

---

## 三、UI 组件树

```
<App>
  ├── <TitleBar>                           # 自定义标题栏
  │   ├── <TrafficLights>                  # macOS 红绿灯
  │   ├── <AppTitle>                       # 应用标题 + 当前文件名
  │   └── <WindowControls>                 # 最小化/最大化/关闭
  │
  ├── <AppLayout>                          # 主布局 (flex row)
  │   ├── <Sidebar>                        # 左侧边栏 (可隐藏)
  │   │   ├── <SidebarHeader>             # 当前文件夹名 + 刷新按钮
  │   │   ├── <FileSearch>                # 文件搜索框
  │   │   └── <FileTree>                  # 文件树
  │   │       └── <FileTreeNode>*         # 递归节点
  │   │           ├── folder icon / file icon
  │   │           └── filename
  │   │
  │   ├── <EditorArea>                     # 中央编辑区
  │   │   ├── <EditorToolbar>             # 极简工具栏
  │   │   │   ├── <TocButton>            # 大纲切换按钮
  │   │   │   ├── <SourceModeButton>     # 源码模式切换
  │   │   │   └── <MoreActions>          # 更多操作 (导出等)
  │   │   │
  │   │   └── <ProseMirrorEditor>         # 编辑器核心
  │   │       └── <div.editor-content>    # ProseMirror 挂载点
  │   │
  │   └── <TocPanel>                      # 右侧大纲面板 (可折叠弹出)
  │       ├── <TocHeader>                 # "大纲" 标题 + 关闭按钮
  │       └── <TocTree>                   # 标题层级树
  │           └── <TocItem>*             # 标题节点
  │
  ├── <StatusBar>                          # 底部状态栏
  │   ├── <FileInfo>                      # 文件名
  │   ├── <CursorInfo>                    # 行号/列号
  │   ├── <WordCount>                     # 字数统计
  │   └── <ModeIndicator>                 # 模式指示器
  │
  ├── <ContextMenu>                        # 右键菜单 (portal)
  └── <Modal>                              # 模态框 (portal)
```

---

## 四、组件详细设计

### 4.1 TitleBar — 自定义标题栏

```
┌────────────────────────────────────────────────────────────┐
│  ┌───┐  ┌───┐  ┌───┐                                      │
│  │ ● │  │ ● │  │ ● │   readme.md — Peter Markdown     □ □ │
│  └───┘  └───┘  └───�                                      │
└────────────────────────────────────────────────────────────┘
```

- 无标题栏模式（`titleBarStyle: 'hidden'`）
- 自定义渲染，支持拖拽窗口
- 文件名居中/居左显示
- 未保存时文件名前显示 `● ` 圆点
- 双击标题栏最大化窗口

### 4.2 Sidebar — 左侧文件树

```
┌─────────────────────┐
│  📁 my-project      │  ← SidebarHeader（当前文件夹名）
│  ───────────────── │
│  🔍 搜索文件...     │  ← FileSearch（过滤输入框）
│  ───────────────── │
│                     │
│  📁 src             │  ← FileTreeNode（目录，可展开）
│    ├ 📄 index.md    │  ← FileTreeNode（文件，带图标）
│    ├ 📄 guide.md    │
│    └ 📁 components  │
│        └ 📄 app.md  │
│  📁 docs             │
│    ├ 📄 readme.md   │  ← 当前选中（高亮背景）
│    └ 📄 changelog   │
│                     │
└─────────────────────┘
```

**交互细节：**
- 单击文件 → 文件夹浏览模式（只读渲染）
- 双击文件 → 单文件编辑模式（WYSIWYG）
- 拖拽文件到编辑区打开
- 右键菜单：重命名、删除、在 Finder 中显示
- 目录可展开/折叠（点击三角图标）
- 键盘导航：上下箭头选择，Enter 打开，左右箭头展开/折叠

### 4.3 EditorArea — 编辑区

```
┌────────────────────────────────────────────────────────────┐
│  📖 大纲    </> 源码   ⋮ 更多                             │
│  ──────────────────────────────────────────────────────── │
│                                                           │
│                                                           │
│  编辑区（ProseMirror 挂载点）                               │
│                                                           │
│  - 全宽渲染，内容居中（最大宽度 860px）                     │
│  - 滚动时工具栏渐变隐藏                                    │
│  - 滚动时大纲高亮自动更新                                  │
│                                                           │
└────────────────────────────────────────────────────────────┘
```

**工具栏设计（极简）：**

| 图标 | 功能 | 快捷键 |
|------|------|--------|
| 📖 | 切换大纲面板 | Ctrl+Shift+O |
| </> | 切换源码模式 | Ctrl+/ |
| ⋮ | 更多操作（导出、设置） | — |

### 4.4 TocPanel — 大纲面板（弹出式）

```
┌─────────────────────┐
│  大纲            ✕  │  ← TocHeader（标题 + 关闭按钮）
│  ───────────────── │
│                     │
│  ■ 欢迎使用         │  ← h1（加粗，缩进 0）
│    ├ ■ 快速开始     │  ← h2（缩进 1 级）
│    │ ├ □ 安装      │  ← h3（缩进 2 级）
│    │ └ □ 配置      │
│    └ ■ 高级用法     │
│  ■ API 参考         │
│    └ ■ 接口说明     │
│                     │
│  当前：快速开始      │  ← 当前章节（高亮蓝字）
└─────────────────────┘
```

**交互细节：**
- 从右侧滑入，宽度 260px
- 半透明遮罩层（点击遮罩关闭）
- 点击标题 → 编辑器滚动到对应位置 + 标题短暂高亮
- 自动跟踪当前滚动位置，高亮对应的标题
- 标题层级缩进：h1=0, h2=16px, h3=32px, h4=48px...

### 4.5 StatusBar — 底部状态栏

```
┌────────────────────────────────────────────────────────────┐
│  readme.md  ● 未保存    │  342 词  2104 字    │  Ln 15, Col 42  │  源码模式  │
└────────────────────────────────────────────────────────────┘
```

- 左对齐：文件名 + 修改状态
- 右对齐：字数、字符数、光标位置、模式指示器
- 点击字数区域可切换统计模式（词/字/行）
- 模式指示器可点击切换（WYSIWYG ↔ 源码）
- 状态栏高度 24px，字号 12px

---

## 五、CSS 架构

### 5.1 CSS 变量体系

```css
:root {
  /* === 亮色主题变量 === */
  /* 背景 */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f8f8;
  --bg-tertiary: #f0f0f0;
  --bg-hover: #f0f0f0;
  --bg-active: #e8e8e8;
  --bg-selection: #d6e8ff;

  /* 文字 */
  --text-primary: #333333;
  --text-secondary: #555555;
  --text-tertiary: #999999;
  --text-link: #4183c4;
  --text-code: #e96900;

  /* 边框 */
  --border-primary: #e8e8e8;
  --border-secondary: #f0f0f0;

  /* 滚动条 */
  --scrollbar-bg: transparent;
  --scrollbar-thumb: #c1c1c1;
  --scrollbar-thumb-hover: #a1a1a1;

  /* 编辑区 */
  --editor-max-width: 860px;
  --editor-font-size: 16px;
  --editor-line-height: 1.6;
  --editor-padding: 32px 40px;

  /* 侧边栏 */
  --sidebar-width: 260px;
  --sidebar-font-size: 14px;

  /* 状态栏 */
  --statusbar-height: 24px;
  --statusbar-font-size: 12px;

  /* 大纲面板 */
  --toc-width: 260px;

  /* 阴影 */
  --shadow-panel: 0 2px 8px rgba(0,0,0,0.08);
  --shadow-modal: 0 8px 32px rgba(0,0,0,0.12);
}

/* 暗色主题 */
[data-theme="dark"] {
  --bg-primary: #1e1e1e;
  --bg-secondary: #252525;
  --bg-tertiary: #2d2d2d;
  --bg-hover: #333333;
  --bg-active: #3a3a3a;
  --bg-selection: #264f78;

  --text-primary: #c9d1d9;
  --text-secondary: #8b949e;
  --text-tertiary: #6e7681;
  --text-link: #58a6ff;
  --text-code: #ffa657;

  --border-primary: #30363d;
  --border-secondary: #21262d;

  --scrollbar-thumb: #484848;
  --scrollbar-thumb-hover: #585858;

  --shadow-panel: 0 2px 8px rgba(0,0,0,0.3);
  --shadow-modal: 0 8px 32px rgba(0,0,0,0.4);
}
```

### 5.2 Markdown 渲染样式

```css
/* 编辑区 Markdown 排版 */
.markdown-body {
  max-width: var(--editor-max-width);
  margin: 0 auto;
  padding: var(--editor-padding);
  font-size: var(--editor-font-size);
  line-height: var(--editor-line-height);
  color: var(--text-primary);
}

/* 标题 */
.markdown-body h1 {
  font-size: 2em;
  font-weight: 700;
  margin: 0.8em 0 0.3em;
  padding-bottom: 0.2em;
  border-bottom: 1px solid var(--border-primary);
  color: var(--text-primary);
}

.markdown-body h2 {
  font-size: 1.6em;
  font-weight: 600;
  margin: 0.7em 0 0.2em;
  border-bottom: 1px solid var(--border-primary);
}

.markdown-body h3 { font-size: 1.35em; font-weight: 600; margin: 0.6em 0 0.2em; }
.markdown-body h4 { font-size: 1.15em; font-weight: 600; margin: 0.5em 0 0.2em; }
.markdown-body h5 { font-size: 1em; font-weight: 600; margin: 0.4em 0 0.2em; }
.markdown-body h6 { font-size: 0.9em; font-weight: 600; margin: 0.4em 0 0.2em; color: var(--text-tertiary); }

/* 段落 */
.markdown-body p {
  margin: 0.5em 0;
  line-height: 1.6;
}

/* 代码 */
.markdown-body code {
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 0.88em;
  padding: 0.15em 0.4em;
  background: var(--bg-tertiary);
  border-radius: 3px;
  color: var(--text-code);
}

.markdown-body pre {
  background: var(--bg-secondary);
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  font-size: 0.88em;
  line-height: 1.5;
}

/* 引用块 */
.markdown-body blockquote {
  margin: 0.5em 0;
  padding: 0.5em 1em;
  border-left: 4px solid var(--text-link);
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

/* 列表 */
.markdown-body ul, .markdown-body ol {
  padding-left: 2em;
  margin: 0.5em 0;
}

.markdown-body li {
  margin: 0.2em 0;
}

/* 任务列表 */
.markdown-body input[type="checkbox"] {
  margin-right: 0.5em;
  transform: scale(1.1);
}

/* 表格 */
.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5em 0;
}

.markdown-body th, .markdown-body td {
  border: 1px solid var(--border-primary);
  padding: 8px 12px;
  text-align: left;
}

.markdown-body th {
  background: var(--bg-secondary);
  font-weight: 600;
}

/* 链接 */
.markdown-body a {
  color: var(--text-link);
  text-decoration: none;
}

.markdown-body a:hover {
  text-decoration: underline;
}

/* 图片 */
.markdown-body img {
  max-width: 100%;
  border-radius: 4px;
}

/* 水平分割线 */
.markdown-body hr {
  border: none;
  border-top: 1px solid var(--border-primary);
  margin: 2em 0;
}

/* 表格中对齐 */
.markdown-body td[align="left"] { text-align: left; }
.markdown-body td[align="center"] { text-align: center; }
.markdown-body td[align="right"] { text-align: right; }
```

---

## 六、交互细节规范

### 6.1 文件浏览模式（只读）

```
用户操作                →  界面反馈
─────────────────────────────────────────────
打开文件夹              →  左侧文件树出现，右侧显示空白欢迎页
单击文件树中的文件       →  右侧渲染 Markdown 内容（只读，ProseMirror 禁用编辑）
双击文件树中的文件       →  切换到编辑模式（ProseMirror 启用编辑）
点击另一个文件           →  右侧内容切换
```

### 6.2 单文件编辑模式（WYSIWYG）

```
用户操作                →  界面反馈
─────────────────────────────────────────────
输入 `# 标题`           →  自动转换为 h1 标题（光标仍在标题上）
输入 `**粗体**`         →  立即变为粗体样式
输入 `- 列表`           →  自动生成列表
按 Enter 在列表末尾     →  退出列表回到普通段落
按 Ctrl+B               →  插入 ** 标记并等待输入
按 Ctrl+S               →  保存文件，状态栏显示 "已保存"
选中文字输入 ` 或 *     →  自动包裹为行内代码或斜体
按 Ctrl+/               →  切换到源码模式（显示原始 Markdown）
```

### 6.3 大纲面板交互

```
用户操作                →  界面反馈
─────────────────────────────────────────────
点击工具栏 📖 按钮      →  大纲面板从右侧滑入，带遮罩层
点击大纲中的标题        →  编辑器平滑滚动到标题位置，标题短暂高亮
滚动编辑器内容          →  大纲面板高亮当前章节
点击遮罩层 / 按 Esc    →  大纲面板关闭
按 Ctrl+Shift+O        →  切换大纲面板
大纲打开时编辑文档      →  大纲实时更新标题列表
```

### 6.4 源码模式

```
用户操作                →  界面反馈
─────────────────────────────────────────────
点击 </> 或按 Ctrl+/   →  编辑区切换为纯文本 Markdown（CodeMirror）
再次点击 </> 或 Ctrl+/ →  切回 WYSIWYG 模式
源码模式下输入          →  纯文本编辑，不触发渲染
保存（Ctrl+S）          →  保存源码内容
```

### 6.5 过渡动画

```
侧边栏显示/隐藏：     width 0 ↔ 260px, 200ms ease
大纲面板滑入/滑出：    translateX, 250ms ease-out
遮罩层淡入/淡出：     opacity, 200ms ease
标题高亮闪烁：         background-color, 500ms ease（闪烁后恢复）
主题切换：             所有颜色属性 300ms ease
文件内容切换：         opacity 0 → 1, 150ms ease
```

---

## 七、源码模式实现

虽然主体采用 ProseMirror WYSIWYG，但源码模式需要一个纯文本编辑器。推荐：

```
WYSIWYG 模式：ProseMirror ←→ ProseMirror ↔ Markdown 双向转换
                                        ↓
源码模式：   CodeMirror 6（只编辑原始 Markdown 文本）
                                        ↓
             切换回 WYSIWYG 时重新解析 Markdown → 重建 ProseMirror Document
```

**为什么用 CodeMirror 6：**
- 专为代码/纯文本编辑优化
- 原生语法高亮（搭配 markdown 语言包）
- 行号显示
- 大文件性能优于 contenteditable
- 括号匹配、缩进辅助

---

## 八、字体回退策略

```css
/* 标题字体 */
--font-heading: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* 正文字体 */
--font-body: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* 代码字体 */
--font-mono: 'JetBrains Mono', 'Source Code Pro', 'Fira Code', 'Consolas', 'Noto Sans Mono', monospace;

/* 侧边栏字体 */
--font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
```

**中文字体优先级：**
- macOS: `PingFang SC` → `Noto Sans SC`
- Windows: `Microsoft YaHei` → `Noto Sans SC`
- Linux: `Noto Sans SC` → `WenQuanYi Micro Hei`

---

## 九、页面状态矩阵

| 状态 | 文件树 | 编辑区 | 大纲 | 状态栏 |
|------|--------|--------|------|--------|
| **启动（无文件）** | 空 | 欢迎页面（快捷键提示） | 隐藏 | 显示 "No file open" |
| **文件夹已打开** | 显示文件列表 | 欢迎页/上次打开的文件 | 隐藏 | 显示文件数 |
| **浏览文件（只读）** | 高亮选中 | 只读渲染 | 可打开 | 显示文件名 + 只读标记 |
| **编辑文件** | 高亮选中 | WYSIWYG 可编辑 | 可打开 | 显示词数/光标/修改状态 |
| **源码模式** | 高亮选中 | CodeMirror 纯文本 | 可打开 | 显示 "Source Mode" |
| **大纲打开** | 正常 | 正常（右侧遮罩） | 可见 | 正常 |
| **搜索中** | 过滤列表 | 正常 | 关闭 | 正常 |
| **导出中** | 正常 | 正常 | 关闭 | 进度指示 |
| **错误** | 正常 | 错误提示 | 关闭 | 错误信息 |

---

## 十、实现优先级

### P0 — 必须（MVP 体验）

| 组件 | 工作量 | 说明 |
|------|--------|------|
| AppLayout（flex 三栏布局） | 2h | 侧边栏 + 编辑区 + 大纲位 |
| Sidebar + FileTree | 6h | 文件树递归渲染 + 点击事件 |
| StatusBar | 2h | 信息展示 |
| EditorArea + ProseMirror | 8h | 编辑器核心挂载 |
| Markdown CSS 样式 | 4h | 所有排版样式 |
| 亮色/暗色 CSS 变量 | 2h | 主题变量定义 |

### P1 — 重要（完整体验）

| 组件 | 工作量 | 说明 |
|------|--------|------|
| TocPanel | 4h | 弹出式面板 + 标题解析 + 点击跳转 |
| TitleBar | 3h | 自定义标题栏 + 拖拽 |
| 工具栏（大纲/源码按钮） | 2h | 按钮 + 快捷键 |
| 动画过渡 | 3h | 面板滑入/主题切换等 |
| 文件搜索 | 3h | 文件树过滤搜索 |
| 源码模式（CodeMirror） | 4h | 模式切换 + 同步 |

### P2 — 锦上添花

| 组件 | 工作量 | 说明 |
|------|--------|------|
| ContextMenu | 2h | 右键菜单 |
| 拖拽支持 | 3h | 文件拖入打开 |
| 文件操作（重命名/删除） | 3h | 文件树右键操作 |
| 焦点模式/打字机模式 | 2h | Typora 特色功能 |
| 欢迎页 | 1h | 启动时的快捷键提示页 |

---

## 十一、启动页面设计

当应用启动且没有打开任何文件时：

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│                                                          │
│              ✏️  Peter Markdown                          │
│                                                          │
│              欢迎使用                                     │
│                                                          │
│              ┌─────────────────────┐                     │
│              │  📂 打开文件夹       │                     │
│              └─────────────────────┘                     │
│                                                          │
│              或拖拽文件到此处                               │
│                                                          │
│              ── 快捷键 ──                                 │
│              Ctrl+O    打开文件                           │
│              Ctrl+N    新建文件                           │
│              Ctrl+Shift+O  打开文件夹                      │
│                                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 十二、最终效果预期

完成后的 Peter Markdown 应呈现：

1. **启动时** — 干净的欢迎页，中心有图标和快捷键提示
2. **打开文件夹后** — 左侧 260px 文件树，右侧全宽编辑区
3. **单击文件** — 右侧渲染显示（只读浏览）
4. **双击文件** — 进入 WYSIWYG 编辑模式
5. **正在编辑** — 所见即所得，输入 Markdown 语法自动转换
6. **按 Ctrl+Shift+O** — 大纲面板从右侧滑出
7. **按 Ctrl+/** — 切换源码模式，编辑区变为 CodeMirror
8. **底部状态栏** — 始终显示文件状态、词数、光标位置
9. **暗色模式** — 一键切换，所有元素颜色平滑过渡

整体视觉风格：**干净、留白充足、内容优先**，与 Typora 保持一致的极简美学。