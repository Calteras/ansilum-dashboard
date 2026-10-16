// Receipt layout contract v1, shared with the POS app
// (ansilum-flutter: lib/src/domain/receipt/receipt_lines.dart).

/** How a line of receipt text is printed. Large is double width and height. */
export type ReceiptTextStyle = 'normal' | 'bold' | 'large' | 'small'

/**
 * A printed line. Text is already wrapped to fit and padded with spaces for
 * alignment, so renderers draw it as given.
 */
export type ReceiptLine =
  | { kind: 'text'; text: string; style: ReceiptTextStyle }
  | { kind: 'blank' }
  | { kind: 'qr'; data: string }
  | { kind: 'logo' }

const stylePrefix: Record<ReceiptTextStyle, string> = {
  normal: '  ',
  bold: 'B ',
  large: 'L ',
  small: 'S ',
}

/**
 * The fixture form: one line per printed line with a two-character style
 * prefix, trailing spaces removed, and a final newline.
 */
export function receiptLinesToText(lines: ReceiptLine[]): string {
  return lines
    .map((line) => {
      switch (line.kind) {
        case 'text':
          return `${stylePrefix[line.style]}${line.text}`.trimEnd()
        case 'blank':
          return ''
        case 'qr':
          return `Q ${line.data}`.trimEnd()
        case 'logo':
          return 'I logo'
      }
    })
    .map((line) => `${line}\n`)
    .join('')
}
