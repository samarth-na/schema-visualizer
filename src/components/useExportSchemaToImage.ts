'use client'

import { toPng, toSvg } from 'html-to-image'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'

export function useExportSchemaToImage() {
  const [isDownloading, setIsDownloading] = useState(false)
  const allPropertyNames = useMemo(() => getAllPropertyNames(), [])

  const exportSchemaToImage = useCallback(
    async ({
      element,
      fileName,
      x,
      y,
      zoom,
      format,
    }: {
      element: HTMLElement
      fileName: string
      x: number
      y: number
      zoom: number
      format: 'svg' | 'png'
    }) => {
      setIsDownloading(true)
      const width = element.clientWidth
      const height = element.clientHeight

      const options = {
        includeStyleProperties: allPropertyNames,
        backgroundColor: '#ffffff',
        width,
        height,
        style: {
          width: `${width}px`,
          height: `${height}px`,
          transform: `translate(${x}px, ${y}px) scale(${zoom})`,
        },
        skipFonts: true,
      }

      try {
        const data = format === 'svg' ? await toSvg(element, options) : await toPng(element, options)
        const a = document.createElement('a')
        a.setAttribute('download', fileName)
        a.setAttribute('href', data)
        a.click()
        toast.success(`Downloaded as ${format.toUpperCase()}`)
      } catch (error) {
        console.error('Failed to download:', error)
        toast.error(`Failed to download: ${(error as Error).message}`)
      } finally {
        setIsDownloading(false)
      }
    },
    [allPropertyNames]
  )

  return { isDownloading, exportSchemaToImage }
}

function getAllPropertyNames(): string[] {
  if (typeof document === 'undefined' || typeof getComputedStyle === 'undefined') {
    return []
  }

  const names: string[] = []
  const style = getComputedStyle(document.documentElement)
  for (let i = 0; i < style.length; i++) {
    const name = style[i]
    if (!name.startsWith('--')) {
      names.push(name)
    }
  }
  return names
}
