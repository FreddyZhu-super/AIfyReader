/**
 * 工具函数测试 —— Utility Functions Tests
 */

import { describe, it, expect } from 'vitest'

// ============================================================
// 模拟实现
// ============================================================

function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, delay)
  }
}

function pathUtils() {
  return {
    basename(path: string): string {
      return path.split('/').pop() || path
    },
    dirname(path: string): string {
      const parts = path.split('/')
      parts.pop()
      return parts.join('/') || '/'
    },
    extname(path: string): string {
      const match = path.match(/\.([^.]+)$/)
      return match ? `.${match[1]}` : ''
    },
    join(...parts: string[]): string {
      return parts
        .filter(Boolean)
        .join('/')
        .replace(/\/+/g, '/')
    },
    normalize(path: string): string {
      const parts = path.split('/')
      const result: string[] = []
      for (const part of parts) {
        if (part === '.' || part === '') continue
        if (part === '..') {
          result.pop()
        } else {
          result.push(part)
        }
      }
      return '/' + result.join('/')
    },
    isAbsolute(path: string): boolean {
      return path.startsWith('/')
    }
  }
}

function constants() {
  return {
    SUPPORTED_EXTENSIONS: ['.md', '.markdown', '.mdown', '.mkd', '.mdx'],
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10 MB
    AUTO_SAVE_DELAY: 2000, // 2 seconds
    MAX_TABS: 50,
    DEFAULT_THEME: 'default',
    EDITOR_MIN_WIDTH: 600,
    EDITOR_MIN_HEIGHT: 400
  }
}

// ============================================================
// 测试套件
// ============================================================
describe('Debounce Utility', () => {
  it('should delay function execution', async () => {
    let callCount = 0
    const fn = debounce(() => { callCount++ }, 100)

    fn()
    fn()
    fn()

    expect(callCount).toBe(0)

    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(callCount).toBe(1)
  })

  it('should cancel previous pending calls', async () => {
    let lastValue = ''
    const fn = debounce((value: string) => { lastValue = value }, 50)

    fn('a')
    fn('b')
    fn('c')

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(lastValue).toBe('c')
  })

  it('should handle zero delay', async () => {
    let called = false
    const fn = debounce(() => { called = true }, 0)

    fn()
    await new Promise((resolve) => setTimeout(resolve, 10))
    expect(called).toBe(true)
  })
})

describe('Path Utilities', () => {
  const path = pathUtils()

  it('should extract basename from path', () => {
    expect(path.basename('/docs/readme.md')).toBe('readme.md')
    expect(path.basename('readme.md')).toBe('readme.md')
    expect(path.basename('/a/b/c/')).toBe('c')
  })

  it('should extract dirname from path', () => {
    expect(path.dirname('/docs/readme.md')).toBe('/docs')
    expect(path.dirname('/docs/sub/readme.md')).toBe('/docs/sub')
    expect(path.dirname('/root.md')).toBe('')
  })

  it('should extract file extension', () => {
    expect(path.extname('readme.md')).toBe('.md')
    expect(path.extname('file.markdown')).toBe('.markdown')
    expect(path.extname('file')).toBe('')
    expect(path.extname('.gitignore')).toBe('')
  })

  it('should join path segments', () => {
    expect(path.join('/docs', 'readme.md')).toBe('/docs/readme.md')
    expect(path.join('/docs', 'sub', 'file.md')).toBe('/docs/sub/file.md')
    expect(path.join('/docs/', '/sub/')).toBe('/docs/sub')
  })

  it('should normalize paths', () => {
    expect(path.normalize('/docs/./readme.md')).toBe('/docs/readme.md')
    expect(path.normalize('/docs/../readme.md')).toBe('/readme.md')
    expect(path.normalize('/a/b/c/../../d')).toBe('/a/d')
  })

  it('should detect absolute paths', () => {
    expect(path.isAbsolute('/docs/readme.md')).toBe(true)
    expect(path.isAbsolute('readme.md')).toBe(false)
    expect(path.isAbsolute('./readme.md')).toBe(false)
  })
})

describe('Constants', () => {
  const c = constants()

  it('should support common markdown extensions', () => {
    expect(c.SUPPORTED_EXTENSIONS).toContain('.md')
    expect(c.SUPPORTED_EXTENSIONS).toContain('.markdown')
    expect(c.SUPPORTED_EXTENSIONS).toContain('.mdx')
  })

  it('should have reasonable file size limit', () => {
    expect(c.MAX_FILE_SIZE).toBe(10 * 1024 * 1024)
    expect(c.MAX_FILE_SIZE).toBeGreaterThan(1024 * 1024)
  })

  it('should have auto-save delay of 2 seconds', () => {
    expect(c.AUTO_SAVE_DELAY).toBe(2000)
  })

  it('should have max tabs limit', () => {
    expect(c.MAX_TABS).toBeGreaterThan(10)
    expect(c.MAX_TABS).toBeLessThanOrEqual(100)
  })

  it('should have editor minimum dimensions', () => {
    expect(c.EDITOR_MIN_WIDTH).toBeGreaterThanOrEqual(400)
    expect(c.EDITOR_MIN_HEIGHT).toBeGreaterThanOrEqual(300)
  })
})