import { promises as fs, existsSync } from 'fs'
import { join, extname, basename, dirname, relative } from 'path'

export interface FileNode {
  name: string
  path: string
  type: 'file' | 'directory'
  extension?: string
  size?: number
  modifiedAt?: Date
}

export interface ReadFileResult {
  content: string
  path: string
  size: number
  modifiedAt: Date
}

const SUPPORTED_EXTENSIONS = ['.md', '.mdx', '.markdown', '.mdown', '.mkd']

export function isMarkdownFile(filePath: string): boolean {
  const ext = extname(filePath).toLowerCase()
  return SUPPORTED_EXTENSIONS.includes(ext)
}

export function isSupportedExtension(extension: string): boolean {
  return SUPPORTED_EXTENSIONS.includes(extension.toLowerCase())
}

export function getSupportedExtensions(): string[] {
  return [...SUPPORTED_EXTENSIONS]
}

export class FileService {
  /**
   * Read a file and return its contents
   */
  async readFile(filePath: string): Promise<ReadFileResult> {
    const stats = await fs.stat(filePath)

    if (stats.isDirectory()) {
      throw new Error(`EISDIR: illegal operation on a directory, read '${filePath}'`)
    }

    const content = await fs.readFile(filePath, 'utf-8')

    return {
      content,
      path: filePath,
      size: stats.size,
      modifiedAt: stats.mtime
    }
  }

  /**
   * Write content to a file
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    // Ensure directory exists
    const dir = dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(filePath, content, 'utf-8')
  }

  /**
   * Read a directory and return its contents as FileNode tree
   */
  async readDirectory(dirPath: string, depth: number = 0, maxDepth: number = 5): Promise<FileNode[]> {
    if (depth > maxDepth) return []

    const entries = await fs.readdir(dirPath, { withFileTypes: true })
    const nodes: FileNode[] = []

    for (const entry of entries) {
      // Skip hidden files and directories
      if (entry.name.startsWith('.')) continue

      const fullPath = join(dirPath, entry.name)

      if (entry.isDirectory()) {
        const children = await this.readDirectory(fullPath, depth + 1, maxDepth)
        // Only include directory if it contains markdown files
        if (this.hasMarkdownFiles(children)) {
          nodes.push({
            name: entry.name,
            path: fullPath,
            type: 'directory',
            children
          })
        }
      } else if (entry.isFile() && isMarkdownFile(entry.name)) {
        const stats = await fs.stat(fullPath)
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'file',
          extension: extname(entry.name).toLowerCase(),
          size: stats.size,
          modifiedAt: stats.mtime
        })
      }
    }

    // Sort: directories first, then files alphabetically
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
      return a.name.localeCompare(b.name)
    })

    return nodes
  }

  /**
   * Check if a node tree contains any markdown files
   */
  private hasMarkdownFiles(nodes: FileNode[]): boolean {
    for (const node of nodes) {
      if (node.type === 'file') return true
      if (node.type === 'directory' && node.children && this.hasMarkdownFiles(node.children)) {
        return true
      }
    }
    return false
  }

  /**
   * Get markdown files only (flat list, no directories)
   */
  async getMarkdownFiles(dirPath: string): Promise<string[]> {
    const result: string[] = []

    const walk = async (dir: string) => {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        if (entry.name.startsWith('.')) continue
        const fullPath = join(dir, entry.name)

        if (entry.isDirectory()) {
          await walk(fullPath)
        } else if (entry.isFile() && isMarkdownFile(entry.name)) {
          result.push(fullPath)
        }
      }
    }

    await walk(dirPath)
    return result
  }

  /**
   * Get file info without reading content
   */
  async getFileInfo(filePath: string): Promise<Omit<FileNode, 'name' | 'type'>> {
    const stats = await fs.stat(filePath)
    return {
      path: filePath,
      extension: extname(filePath),
      size: stats.size,
      modifiedAt: stats.mtime
    }
  }

  /**
   * Check if file or directory exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Create a new file
   */
  async createFile(filePath: string): Promise<void> {
    if (await this.exists(filePath)) {
      throw new Error(`EEXIST: file already exists: ${filePath}`)
    }
    await fs.writeFile(filePath, '', 'utf-8')
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(filePath)
  }

  /**
   * Rename a file
   */
  async renameFile(oldPath: string, newPath: string): Promise<void> {
    await fs.rename(oldPath, newPath)
  }

  /**
   * Create a new directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true })
  }
}

// Singleton instance
export const fileService = new FileService()
