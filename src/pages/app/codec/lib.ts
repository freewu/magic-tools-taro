// 常用编码：Base64 / URL / Unicode 转义 / HTML 实体 / 十六进制 / 二进制 / ROT13
//
// 纯逻辑，不依赖界面。文本统一按 UTF-8 字节处理（emoji 等代理对也能正确往返），
// 解码失败一律给中文提示而不是返回半个结果。

import { readStorage, writeStorage } from '../../../common/storage'

// ---------------------------------------------------------------- UTF-8 字节

/** 文本 → UTF-8 字节序列（含代理对处理） */
export function utf8Bytes(text: string): number[] {
  const out: number[] = []
  let i = 0
  while (i < text.length) {
    let code = text.charCodeAt(i)
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const low = text.charCodeAt(i + 1)
      if (low >= 0xdc00 && low <= 0xdfff) {
        code = 0x10000 + (code - 0xd800) * 0x400 + (low - 0xdc00)
        i++
      }
    }
    if (code < 0x80) {
      out.push(code)
    } else if (code < 0x800) {
      out.push(0xc0 + Math.floor(code / 0x40))
      out.push(0x80 + (code % 0x40))
    } else if (code < 0x10000) {
      out.push(0xe0 + Math.floor(code / 0x1000))
      out.push(0x80 + (Math.floor(code / 0x40) % 0x40))
      out.push(0x80 + (code % 0x40))
    } else {
      out.push(0xf0 + Math.floor(code / 0x40000))
      out.push(0x80 + (Math.floor(code / 0x1000) % 0x40))
      out.push(0x80 + (Math.floor(code / 0x40) % 0x40))
      out.push(0x80 + (code % 0x40))
    }
    i++
  }
  return out
}

/** UTF-8 字节 → 文本，非法字节按跳过处理 */
export function utf8String(bytes: number[]): string {
  let out = ''
  let i = 0
  while (i < bytes.length) {
    const byte = bytes[i]
    let code = 0
    let extra = 0
    if (byte < 0x80) {
      code = byte
      extra = 0
    } else if ((byte & 0xe0) === 0xc0) {
      code = byte & 0x1f
      extra = 1
    } else if ((byte & 0xf0) === 0xe0) {
      code = byte & 0x0f
      extra = 2
    } else if ((byte & 0xf8) === 0xf0) {
      code = byte & 0x07
      extra = 3
    } else {
      i++
      continue
    }
    if (i + extra >= bytes.length) {
      break
    }
    let ok = true
    for (let k = 1; k <= extra; k++) {
      const next = bytes[i + k]
      if ((next & 0xc0) !== 0x80) {
        ok = false
        break
      }
      code = (code << 6) | (next & 0x3f)
    }
    if (!ok) {
      i++
      continue
    }
    i += extra + 1
    out += codePointToString(code)
  }
  return out
}

/** 码点 → 字符串（含代理对拆分） */
function codePointToString(code: number): string {
  if (code < 0x10000) {
    return String.fromCharCode(code)
  }
  const value = code - 0x10000
  return String.fromCharCode(0xd800 + Math.floor(value / 0x400)) + String.fromCharCode(0xdc00 + (value % 0x400))
}

// ---------------------------------------------------------------- Base64

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/** 字符在码表中的位置，-1 表示不在码表 */
function b64IndexOf(char: string): number {
  return B64_ALPHABET.indexOf(char)
}

export function base64EncodeBytes(bytes: number[]): string {
  let out = ''
  let i = 0
  while (i + 2 < bytes.length) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2]
    out += B64_ALPHABET.charAt((n >> 18) & 63)
    out += B64_ALPHABET.charAt((n >> 12) & 63)
    out += B64_ALPHABET.charAt((n >> 6) & 63)
    out += B64_ALPHABET.charAt(n & 63)
    i += 3
  }
  const rest = bytes.length - i
  if (rest === 1) {
    const n = bytes[i] << 16
    out += B64_ALPHABET.charAt((n >> 18) & 63)
    out += B64_ALPHABET.charAt((n >> 12) & 63)
    out += '=='
  } else if (rest === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8)
    out += B64_ALPHABET.charAt((n >> 18) & 63)
    out += B64_ALPHABET.charAt((n >> 12) & 63)
    out += B64_ALPHABET.charAt((n >> 6) & 63)
    out += '='
  }
  return out
}

/** Base64 解码；返回字节，错误时返回 null（调用方给提示） */
function base64DecodeBytes(raw: string): number[] | null {
  let text = ''
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charAt(i)
    if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
      continue
    }
    // URL 安全变体：- 与 _ 分别等价于 + 与 /
    if (char === '-') {
      text += '+'
    } else if (char === '_') {
      text += '/'
    } else {
      text += char
    }
  }
  if (text.length === 0) {
    return []
  }
  // 去掉结尾的 = 并按 4 的倍数校验
  let padding = 0
  while (text.length > 0 && text.charAt(text.length - 1) === '=') {
    text = text.substring(0, text.length - 1)
    padding += 1
  }
  if (padding > 2) {
    return null
  }
  if (text.length % 4 === 1) {
    return null
  }
  for (let i = 0; i < text.length; i++) {
    if (b64IndexOf(text.charAt(i)) < 0) {
      return null
    }
  }
  const out: number[] = []
  let buffer = 0
  let bits = 0
  for (let i = 0; i < text.length; i++) {
    buffer = (buffer << 6) | b64IndexOf(text.charAt(i))
    bits += 6
    if (bits >= 8) {
      bits -= 8
      out.push((buffer >> bits) & 0xff)
    }
  }
  return out
}

// ---------------------------------------------------------------- URL 百分号编码

/** RFC 3986 非保留字符，与 encodeURIComponent 保持一致 */
function isUrlUnreserved(char: string): boolean {
  if (char >= 'A' && char <= 'Z') {
    return true
  }
  if (char >= 'a' && char <= 'z') {
    return true
  }
  if (char >= '0' && char <= '9') {
    return true
  }
  return "-_.!~*'()".indexOf(char) >= 0
}

function percentEncode(bytes: number[]): string {
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]
    if (byte < 0x80 && isUrlUnreserved(String.fromCharCode(byte))) {
      out += String.fromCharCode(byte)
    } else {
      out += '%' + hex2(byte)
    }
  }
  return out
}

function percentDecode(text: string): number[] | null {
  const bytes: number[] = []
  let i = 0
  while (i < text.length) {
    const char = text.charAt(i)
    if (char === '%') {
      if (i + 2 >= text.length) {
        return null
      }
      const high = hexValue(text.charAt(i + 1))
      const low = hexValue(text.charAt(i + 2))
      if (high < 0 || low < 0) {
        return null
      }
      bytes.push(high * 16 + low)
      i += 3
    } else {
      // 没有百分号的字符原样透传（中文按 UTF-8 展开，避免被截成半个字节）
      const raw = utf8Bytes(char)
      for (let k = 0; k < raw.length; k++) {
        bytes.push(raw[k])
      }
      i++
    }
  }
  return bytes
}

// ---------------------------------------------------------------- 十六进制 / 二进制

const HEX_DIGITS = '0123456789ABCDEF'

export function hex2(value: number): string {
  const v = value < 0 ? 0 : value > 255 ? 255 : value
  return HEX_DIGITS.charAt(Math.floor(v / 16)) + HEX_DIGITS.charAt(v % 16)
}

export function hex4(value: number): string {
  const v = value < 0 ? 0 : value
  return hex2(Math.floor(v / 256) % 256) + hex2(v % 256)
}

function hexValue(char: string): number {
  if (char >= '0' && char <= '9') {
    return char.charCodeAt(0) - 48
  }
  if (char >= 'a' && char <= 'f') {
    return char.charCodeAt(0) - 87
  }
  if (char >= 'A' && char <= 'F') {
    return char.charCodeAt(0) - 55
  }
  return -1
}

function bytesToHex(bytes: number[]): string {
  return bytes.map((byte) => hex2(byte)).join(' ')
}

function hexToBytes(text: string): number[] | null {
  let digits = ''
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i)
    if (char === ' ' || char === '\n' || char === '\r' || char === '\t' || char === ',') {
      continue
    }
    if (hexValue(char) < 0) {
      return null
    }
    digits += char
  }
  if (digits.length % 2 !== 0) {
    return null
  }
  const out: number[] = []
  for (let i = 0; i < digits.length; i += 2) {
    out.push(hexValue(digits.charAt(i)) * 16 + hexValue(digits.charAt(i + 1)))
  }
  return out
}

function bytesToBinary(bytes: number[]): string {
  const parts: string[] = []
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i]
    let bits = ''
    for (let k = 7; k >= 0; k--) {
      bits += (byte >> k) & 1 ? '1' : '0'
    }
    parts.push(bits)
  }
  return parts.join(' ')
}

function binaryToBytes(text: string): number[] | null {
  let bits = ''
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i)
    if (char === '0' || char === '1') {
      bits += char
    } else if (char === ' ' || char === '\n' || char === '\r' || char === '\t' || char === ',') {
      continue
    } else {
      return null
    }
  }
  if (bits.length % 8 !== 0) {
    return null
  }
  const out: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let value = 0
    for (let k = 0; k < 8; k++) {
      value = value * 2 + (bits.charAt(i + k) === '1' ? 1 : 0)
    }
    out.push(value)
  }
  return out
}

// ---------------------------------------------------------------- Unicode 转义

function unicodeEscape(text: string): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    out += '\\u' + hex4(text.charCodeAt(i))
  }
  return out
}

function unicodeUnescape(text: string): string {
  let out = ''
  let i = 0
  while (i < text.length) {
    const char = text.charAt(i)
    if (char === '\\' && i + 1 < text.length && text.charAt(i + 1) === 'u') {
      // \uXXXX，也接受 \u{XXXXXX}
      if (text.charAt(i + 2) === '{') {
        let end = i + 3
        while (end < text.length && text.charAt(end) !== '}') {
          end++
        }
        const hexText = text.substring(i + 3, end)
        if (end < text.length && hexText.length > 0) {
          let value = 0
          let ok = true
          for (let k = 0; k < hexText.length; k++) {
            const digit = hexValue(hexText.charAt(k))
            if (digit < 0) {
              ok = false
              break
            }
            value = value * 16 + digit
          }
          if (ok && value <= 0x10ffff) {
            out += codePointToString(value)
            i = end + 1
            continue
          }
        }
      } else if (i + 5 < text.length) {
        const hexText = text.substring(i + 2, i + 6)
        let value = 0
        let ok = true
        for (let k = 0; k < 4; k++) {
          const digit = hexValue(hexText.charAt(k))
          if (digit < 0) {
            ok = false
            break
          }
          value = value * 16 + digit
        }
        if (ok) {
          out += codePointToString(value)
          i += 6
          continue
        }
      }
    }
    out += char
    i++
  }
  return out
}

// ---------------------------------------------------------------- HTML 实体

const HTML_ENTITIES: { name: string; code: number }[] = [
  { name: 'amp', code: 38 },
  { name: 'lt', code: 60 },
  { name: 'gt', code: 62 },
  { name: 'quot', code: 34 },
  { name: 'apos', code: 39 },
  { name: 'nbsp', code: 160 },
  { name: 'copy', code: 169 },
  { name: 'reg', code: 174 },
  { name: 'trade', code: 8482 },
  { name: 'hellip', code: 8230 },
  { name: 'mdash', code: 8212 },
  { name: 'ndash', code: 8211 },
  { name: 'laquo', code: 171 },
  { name: 'raquo', code: 187 },
  { name: 'times', code: 215 },
  { name: 'divide', code: 247 },
  { name: 'deg', code: 176 },
  { name: 'plusmn', code: 177 },
  { name: 'permil', code: 8240 },
  { name: 'ldquo', code: 8220 },
  { name: 'rdquo', code: 8221 },
  { name: 'lsquo', code: 8216 },
  { name: 'rsquo', code: 8217 },
  { name: 'bull', code: 8226 },
  { name: 'middot', code: 183 }
]

function htmlEntityCode(name: string): number {
  for (let i = 0; i < HTML_ENTITIES.length; i++) {
    if (HTML_ENTITIES[i].name === name) {
      return HTML_ENTITIES[i].code
    }
  }
  return -1
}

function htmlEscape(text: string): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i)
    if (char === '&') {
      out += '&amp;'
    } else if (char === '<') {
      out += '&lt;'
    } else if (char === '>') {
      out += '&gt;'
    } else if (char === '"') {
      out += '&quot;'
    } else if (char === "'") {
      out += '&#39;'
    } else {
      out += char
    }
  }
  return out
}

function htmlUnescape(text: string): string {
  let out = ''
  let i = 0
  while (i < text.length) {
    const char = text.charAt(i)
    if (char === '&') {
      const end = text.indexOf(';', i)
      if (end > i + 1 && end - i <= 10) {
        const body = text.substring(i + 1, end)
        if (body.charAt(0) === '#') {
          let value = -1
          const hexPart = body.charAt(1)
          if (hexPart === 'x' || hexPart === 'X') {
            value = 0
            const hexText = body.substring(2)
            for (let k = 0; k < hexText.length; k++) {
              const digit = hexValue(hexText.charAt(k))
              if (digit < 0) {
                value = -1
                break
              }
              value = value * 16 + digit
            }
          } else {
            value = parseInt(body.substring(1), 10)
          }
          if (value >= 0 && value <= 0x10ffff) {
            out += codePointToString(value)
            i = end + 1
            continue
          }
        } else {
          const code = htmlEntityCode(body)
          if (code >= 0) {
            out += codePointToString(code)
            i = end + 1
            continue
          }
        }
      }
    }
    out += char
    i++
  }
  return out
}

// ---------------------------------------------------------------- ROT13

function rot13(text: string): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i)
    const code = text.charCodeAt(i)
    if (char >= 'a' && char <= 'z') {
      out += String.fromCharCode(97 + ((code - 97 + 13) % 26))
    } else if (char >= 'A' && char <= 'Z') {
      out += String.fromCharCode(65 + ((code - 65 + 13) % 26))
    } else {
      out += char
    }
  }
  return out
}

// ---------------------------------------------------------------- 统一的编码方式

export const CODEC_BASE64 = 'base64'
export const CODEC_URL = 'url'
export const CODEC_UNICODE = 'unicode'
export const CODEC_HTML = 'html'
export const CODEC_HEX = 'hex'
export const CODEC_BINARY = 'binary'
export const CODEC_ROT13 = 'rot13'

export type CodecOption = {
  code: string
  label: string
  /** 结果示例，用于说明 */
  sample: string
}

export const CODEC_OPTIONS: CodecOption[] = [
  { code: CODEC_BASE64, label: 'Base64', sample: 'aGVsbG8=' },
  { code: CODEC_URL, label: 'URL', sample: '%E4%BD%A0%E5%A5%BD' },
  { code: CODEC_UNICODE, label: 'Unicode', sample: '\\u4F60\\u597D' },
  { code: CODEC_HTML, label: 'HTML 实体', sample: '&lt;b&gt;' },
  { code: CODEC_HEX, label: '十六进制', sample: '68 65 6C 6C 6F' },
  { code: CODEC_BINARY, label: '二进制', sample: '01101000 01101001' },
  { code: CODEC_ROT13, label: 'ROT13', sample: 'Uryyb' }
]

export function codecByCode(code: string): CodecOption {
  for (let i = 0; i < CODEC_OPTIONS.length; i++) {
    if (CODEC_OPTIONS[i].code === code) {
      return CODEC_OPTIONS[i]
    }
  }
  return CODEC_OPTIONS[0]
}

/** 结果：text 为空说明失败，error 里是原因 */
export type CodecResult = {
  text: string
  error: string
}

/** 解码失败时给统一的中文提示 */
function decodeFailure(codec: string, label: string): CodecResult {
  if (codec === CODEC_BASE64) {
    return { text: '', error: '这段内容不是有效的 Base64（只允许 A–Z a–z 0–9 + / = 与 URL 安全变体 - _）' }
  }
  if (codec === CODEC_HEX) {
    return { text: '', error: '不是有效的十六进制：只能包含 0–9 a–f，且位数必须是偶数' }
  }
  if (codec === CODEC_BINARY) {
    return { text: '', error: '不是有效的二进制：只能包含 0 和 1，且位数必须是 8 的倍数' }
  }
  if (codec === CODEC_URL) {
    return { text: '', error: '不是有效的 URL 编码：% 后面必须跟两位十六进制' }
  }
  return { text: '', error: `${label} 解码失败` }
}

/** 执行编码 / 解码 */
export function runCodec(codec: string, raw: string, encode: boolean): CodecResult {
  const option = codecByCode(codec)
  if (raw.length === 0) {
    return { text: '', error: '' }
  }
  if (codec === CODEC_BASE64) {
    if (encode) {
      return { text: base64EncodeBytes(utf8Bytes(raw)), error: '' }
    }
    const bytes = base64DecodeBytes(raw)
    if (bytes == null) {
      return decodeFailure(codec, option.label)
    }
    return { text: utf8String(bytes), error: '' }
  }
  if (codec === CODEC_URL) {
    if (encode) {
      return { text: percentEncode(utf8Bytes(raw)), error: '' }
    }
    const bytes = percentDecode(raw)
    if (bytes == null) {
      return decodeFailure(codec, option.label)
    }
    return { text: utf8String(bytes), error: '' }
  }
  if (codec === CODEC_UNICODE) {
    return { text: encode ? unicodeEscape(raw) : unicodeUnescape(raw), error: '' }
  }
  if (codec === CODEC_HTML) {
    return { text: encode ? htmlEscape(raw) : htmlUnescape(raw), error: '' }
  }
  if (codec === CODEC_HEX) {
    if (encode) {
      return { text: bytesToHex(utf8Bytes(raw)), error: '' }
    }
    const bytes = hexToBytes(raw)
    if (bytes == null) {
      return decodeFailure(codec, option.label)
    }
    return { text: utf8String(bytes), error: '' }
  }
  if (codec === CODEC_BINARY) {
    if (encode) {
      return { text: bytesToBinary(utf8Bytes(raw)), error: '' }
    }
    const bytes = binaryToBytes(raw)
    if (bytes == null) {
      return decodeFailure(codec, option.label)
    }
    return { text: utf8String(bytes), error: '' }
  }
  // ROT13 加解密同一个操作
  return { text: rot13(raw), error: '' }
}

/** 结果说明：字节数 / 字符数 */
export function codecNote(codec: string, raw: string, encode: boolean, result: CodecResult): string {
  if (result.error !== '') {
    return ''
  }
  const bytes = utf8Bytes(raw).length
  if (encode) {
    if (codec === CODEC_BASE64) {
      return `UTF-8 ${bytes} 字节 → Base64 ${result.text.length} 个字符`
    }
    if (codec === CODEC_HEX || codec === CODEC_BINARY) {
      return `UTF-8 ${bytes} 字节`
    }
    return `UTF-8 ${bytes} 字节，${raw.length} 个字符`
  }
  return `解出 ${result.text.length} 个字符，UTF-8 ${utf8Bytes(result.text).length} 字节`
}

/** 「全部编码」的一行 */
export type CodecRow = {
  label: string
  value: string
  /** 展示用（过长截断） */
  short: string
}

/** 过长的结果只显示开头一段 */
export function shorten(text: string, max: number): string {
  if (text.length <= max) {
    return text
  }
  return text.substring(0, max) + '…'
}

/** 按所有方式编码一遍（默认全部编码，供「全部结果」卡使用） */
export function encodeAll(raw: string): CodecRow[] {
  const rows: CodecRow[] = []
  if (raw.length === 0) {
    return rows
  }
  for (let i = 0; i < CODEC_OPTIONS.length; i++) {
    const option = CODEC_OPTIONS[i]
    const result = runCodec(option.code, raw, true)
    const value = result.error !== '' ? '' : result.text
    rows.push({ label: option.label, value, short: shorten(value, 64) })
  }
  return rows
}

// ---------------------------------------------------------------- 记住上次选择

const CODEC_CODE_KEY = 'codec-code'
const CODEC_DIR_KEY = 'codec-dir'
const CODEC_TEXT_KEY = 'codec-text'

export type CodecDraft = {
  codec: string
  encode: boolean
  text: string
}

export function defaultCodecDraft(): CodecDraft {
  return { codec: CODEC_BASE64, encode: true, text: 'Hello 你好' }
}

export function loadCodecDraft(): CodecDraft {
  const draft = defaultCodecDraft()
  const codeText = readStorage(CODEC_CODE_KEY)
  // 没存过：保持默认，首次进入就给一段示例
  if (codeText === '') {
    return draft
  }
  for (let i = 0; i < CODEC_OPTIONS.length; i++) {
    if (CODEC_OPTIONS[i].code === codeText) {
      draft.codec = codeText
      break
    }
  }
  const dirText = readStorage(CODEC_DIR_KEY)
  if (dirText === 'encode' || dirText === 'decode') {
    draft.encode = dirText === 'encode'
  }
  const text = readStorage(CODEC_TEXT_KEY)
  if (text !== '') {
    draft.text = text
  }
  return draft
}

export function saveCodecDraft(draft: CodecDraft): void {
  writeStorage(CODEC_CODE_KEY, draft.codec)
  writeStorage(CODEC_DIR_KEY, draft.encode ? 'encode' : 'decode')
  writeStorage(CODEC_TEXT_KEY, draft.text)
}
