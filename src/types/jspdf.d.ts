declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: {
      unit?: string
      format?: string | [number, number]
      orientation?: 'p' | 'l' | 'portrait' | 'landscape'
    })
    text(
      text: string,
      x: number,
      y: number,
      options?: { maxWidth?: number }
    ): void
    addPage(format?: string | string[]): void
    setFontSize(size: number): void
    line(x1: number, y1: number, x2: number, y2: number): void
    save(filename: string): void
  }
}
