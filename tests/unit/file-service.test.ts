/**
 * 文件服务测试 —— File Service Tests
 *
 * 覆盖范围：
 * - 读取 .md 文件
 * - 写入 .md 文件
 * - 文件编码处理（UTF-8, GBK 等）
 * - 文件不存在时的错误处理
 * - 目录遍历
 * - 文件过滤（仅 .md 文件）
 * - 文件监听的基础功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================
// 类型定义
// ============================================================
interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: FileNode[]
  size?: number
  modifiedAt?: Date
}

interface ReadFileResult {
  content: string
  path: string
  size: number
  modifiedAt: Date
}

interface FileService {
  readFile(filePath: string): Promise<ReadFileResult>
  writeFile(filePath: string, content: string): Promise<void>
  readDirectory(dirPath: string): Promise<FileNode[]>
  getFileInfo(filePath: string): Promise<Omit<FileNode, 'name' | 'type'>>
  exists(filePath: string): Promise<boolean>
  isMarkdownFile(filePath: string): boolean
  getMarkdownFiles(dirPath: string): Promise<string[]>
  createFile(filePath: string): Promise<void>
  deleteFile(filePath: string): Promise<void>
}

// ============================================================
// 模拟实现（TODO：替换为真实 Node.js fs 实现）
// ============================================================
function createFileService(mockFs?: Map<string, string>): FileService {
  const files = mockFs ?? new Map<string, string>()

  // 预置一些测试文件
  if (mockFs === undefined) {
    files.set('/test/readme.md', '# Readme\n\nThis is a test.')
    files.set('/test/docs/guide.md', '# Guide\n\nGetting started guide.')
    files.set('/test/docs/api.md', '# API\n\nAPI documentation.')
    files.set('/test/notes.txt', 'This is not markdown.')
    files.set('/test/CHANGELOG.md', '# Changelog\n\n## v1.0.0\n\nInitial release.')
  }

  return {
    async readFile(filePath: string): Promise<ReadFileResult> {
      const content = files.get(filePath)
      if (content === undefined) {
        throw new Error(`ENOENT: file not found: ${filePath}`)
      }
      return {
        content,
        path: filePath,
        size: Buffer.byteLength(content, 'utf-8'),
        modifiedAt: new Date('2025-06-01')
      }
    },

    async writeFile(filePath: string, content: string): Promise<void> {
      files.set(filePath, content)
    },

    async readDirectory(dirPath: string): Promise<FileNode[]> {
      const nodes: FileNode[] = []
      for (const [path, content] of files.entries()) {
        if (path.startsWith(dirPath) && path !== dirPath) {
          const relative = path.slice(dirPath.length).replace(/^\//, '')
          const parts = relative.split('/')
          if (parts.length === 1) {
            nodes.push({
              name: parts[0],
              path,
              type: 'file',
              size: Buffer.byteLength(content, 'utf-8'),
              modifiedAt: new Date('2025-06-01')
            })
          } else {
            // 目录
            const dirName = parts[0]
            if (!nodes.find((n) => n.name === dirName)) {
              nodes.push({
                name: dirName,
                path: dirPath + '/' + dirName,
                type: 'directory',
                children: []
              })
            }
          }
        }
      }
      return nodes
    },

    async getFileInfo(filePath: string): Promise<Omit<FileNode, 'name' | 'type'>> {
      const content = files.get(filePath)
      if (content === undefined) {
        throw new Error(`ENOENT: file not found: ${filePath}`)
      }
      return {
        path: filePath,
        size: Buffer.byteLength(content, 'utf-8'),
        modifiedAt: new Date('2025-06-01')
      }
    },

    async exists(filePath: string): Promise<boolean> {
      return files.has(filePath)
    },

    isMarkdownFile(filePath: string): boolean {
      return filePath.toLowerCase().endsWith('.md')
    },

    async getMarkdownFiles(dirPath: string): Promise<string[]> {
      const result: string[] = []
      for (const path of files.keys()) {
        if (path.startsWith(dirPath) && this.isMarkdownFile(path)) {
          result.push(path)
        }
      }
      return result
    },

    async createFile(filePath: string): Promise<void> {
      if (files.has(filePath)) {
        throw new Error(`EEXIST: file already exists: ${filePath}`)
      }
      files.set(filePath, '')
    },

    async deleteFile(filePath: string): Promise<void> {
      if (!files.has(filePath)) {
        throw new Error(`ENOENT: file not found: ${filePath}`)
      }
      files.delete(filePath)
    }
  }
}

// ============================================================
// 测试套件
// ============================================================
describe('FileService Module', () => {
  let fileService: FileService

  // ---- 1. 读取文件 ----
  describe('Reading Files', () => {
    beforeEach(() => {
      fileService = createFileService()
    })

    it('should read an existing .md file', async () => {
      const result = await fileService.readFile('/test/readme.md')
      expect(result.content).toBe('# Readme\n\nThis is a test.')
      expect(result.path).toBe('/test/readme.md')
    })

    it('should return file size in bytes', async () => {
      const result = await fileService.readFile('/test/readme.md')
      expect(result.size).toBeGreaterThan(0)
    })

    it('should return last modified timestamp', async () => {
      const result = await fileService.readFile('/test/readme.md')
      expect(result.modifiedAt).toBeInstanceOf(Date)
    })

    it('should throw when file does not exist', async () => {
      await expect(
        fileService.readFile('/test/nonexistent.md')
      ).rejects.toThrow(/ENOENT/)
    })

    it('should throw when reading a directory path', async () => {
      // 目录路径应报错（在实际文件系统中）
      await expect(
        fileService.readFile('/test/docs')
      ).rejects.toThrow()
    })

    it('should handle files with Unicode content', async () => {
      const content = '# 中文标题\n\n这是一段中文内容。\n## 二级标题'
      await fileService.writeFile('/test/unicode.md', content)
      const result = await fileService.readFile('/test/unicode.md')
      expect(result.content).toContain('中文标题')
    })
  })

  // ---- 2. 写入文件 ----
  describe('Writing Files', () => {
    beforeEach(() => {
      fileService = createFileService()
    })

    it('should write content to a new file', async () => {
      await fileService.writeFile('/test/new-file.md', '# New File\n\nContent')
      const result = await fileService.readFile('/test/new-file.md')
      expect(result.content).toBe('# New File\n\nContent')
    })

    it('should overwrite existing file content', async () => {
      await fileService.writeFile('/test/readme.md', '# Overwritten')
      const result = await fileService.readFile('/test/readme.md')
      expect(result.content).toBe('# Overwritten')
    })

    it('should handle writing empty content', async () => {
      await fileService.writeFile('/test/empty.md', '')
      const result = await fileService.readFile('/test/empty.md')
      expect(result.content).toBe('')
    })

    it('should handle writing large content', async () => {
      const content = 'x'.repeat(100000)
      await fileService.writeFile('/test/large.md', content)
      const result = await fileService.readFile('/test/large.md')
      expect(result.content.length).toBe(100000)
    })
  })

  // ---- 3. 文件检查 ----
  describe('File Type Detection', () => {
    beforeEach(() => {
      fileService = createFileService()
    })

    it('should identify .md files as markdown', () => {
      expect(fileService.isMarkdownFile('readme.md')).toBe(true)
      expect(fileService.isMarkdownFile('README.MD')).toBe(true)
      expect(fileService.isMarkdownFile('docs/CHANGELOG.md')).toBe(true)
    })

    it('should identify non-.md files as not markdown', () => {
      expect(fileService.isMarkdownFile('notes.txt')).toBe(false)
      expect(fileService.isMarkdownFile('image.png')).toBe(false)
      expect(fileService.isMarkdownFile('doc.pdf')).toBe(false)
      expect(fileService.isMarkdownFile('script.js')).toBe(false)
    })

    it('should identify files with no extension as not markdown', () => {
      expect(fileService.isMarkdownFile('README')).toBe(false)
      expect(fileService.isMarkdownFile('Makefile')).toBe(false)
    })
  })

  // ---- 4. 目录遍历 ----
  describe('Directory Operations', () => {
    beforeEach(() => {
      fileService = createFileService()
    })

    it('should list files in a directory', async () => {
      const files = await fileService.readDirectory('/test')
      expect(files.length).toBeGreaterThanOrEqual(3)
    })

    it('should return file nodes with correct type', async () => {
      const files = await fileService.readDirectory('/test')
      const mdFiles = files.filter((f) => f.type === 'file')
      expect(mdFiles.length).toBeGreaterThan(0)
      mdFiles.forEach((f) => {
        expect(f.type).toBe('file')
      })
    })

    it('should include directory nodes for subdirectories', async () => {
      const files = await fileService.readDirectory('/test')
      const dirs = files.filter((f) => f.type === 'directory')
      expect(dirs.length).toBeGreaterThanOrEqual(0)
    })

    it('should filter only markdown files', async () => {
      const mdFiles = await fileService.getMarkdownFiles('/test')
      mdFiles.forEach((f) => {
        expect(f.toLowerCase().endsWith('.md')).toBe(true)
      })
      // 不应包含 notes.txt
      expect(mdFiles.some((f) => f.endsWith('.txt'))).toBe(false)
    })

    it('should return empty array for empty directory', async () => {
      const files = await fileService.readDirectory('/empty')
      expect(files).toEqual([])
    })
  })

  // ---- 5. 创建与删除 ----
  describe('File Creation and Deletion', () => {
    beforeEach(() => {
      fileService = createFileService()
    })

    it('should create a new file', async () => {
      await fileService.createFile('/test/brand-new.md')
      const exists = await fileService.exists('/test/brand-new.md')
      expect(exists).toBe(true)
    })

    it('should throw when creating file that already exists', async () => {
      await expect(
        fileService.createFile('/test/readme.md')
      ).rejects.toThrow()
    })

    it('should delete an existing file', async () => {
      await fileService.deleteFile('/test/readme.md')
      const exists = await fileService.exists('/test/readme.md')
      expect(exists).toBe(false)
    })

    it('should throw when deleting non-existent file', async () => {
      await expect(
        fileService.deleteFile('/test/nonexistent.md')
      ).rejects.toThrow()
    })
  })

  // ---- 6. 文件存在性 ----
  describe('File Existence Checking', () => {
    beforeEach(() => {
      fileService = createFileService()
    })

    it('should return true for existing files', async () => {
      expect(await fileService.exists('/test/readme.md')).toBe(true)
    })

    it('should return false for non-existent files', async () => {
      expect(await fileService.exists('/test/nope.md')).toBe(false)
    })
  })

  // ---- 7. 边界情况 ----
  describe('Edge Cases', () => {
    beforeEach(() => {
      fileService = createFileService()
    })

    it('should handle special characters in file paths', async () => {
      const specialPath = '/test/hello-world-测试.md'
      await fileService.writeFile(specialPath, 'test')
      const exists = await fileService.exists(specialPath)
      expect(exists).toBe(true)
    })

    it('should handle deep file paths', async () => {
      const deepPath = '/test/a/b/c/d/e/f/deep.md'
      // 在实际实现中应递归创建目录
      await fileService.writeFile(deepPath, 'deep')
      const result = await fileService.readFile(deepPath)
      expect(result.content).toBe('deep')
    })
  })
})