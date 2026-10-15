declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: {
      unit?: string
      format?: string | [number, number]
      orientation?: 'p' | 'l' | 'portrait' | 'landscape'
    })
    text(
      text: string | string[],
      x: number,
      y: number,
      options?: { maxWidth?: number; align?: 'left' | 'center' | 'right' }
    ): void
    setFont(fontName: string, fontStyle?: 'normal' | 'bold'): void
    setTextColor(r: number, g?: number, b?: number): void
    setDrawColor(r: number, g?: number, b?: number): void
    setFillColor(r: number, g?: number, b?: number): void
    setLineWidth(width: number): void
    rect(
      x: number,
      y: number,
      w: number,
      h: number,
      style?: 'S' | 'F' | 'FD'
    ): void
    roundedRect(
      x: number,
      y: number,
      w: number,
      h: number,
      rx: number,
      ry: number,
      style?: 'S' | 'F' | 'FD'
    ): void
    splitTextToSize(text: string, maxWidth: number): string[]
    getTextWidth(text: string): number
    addPage(format?: string | string[]): void
    setFontSize(size: number): void
    line(x1: number, y1: number, x2: number, y2: number): void
    save(filename: string): void
  }
}
