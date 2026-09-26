/**
 * 更新检查/下载错误 → 用户可读文案 的公共映射函数
 *
 * 设计约束（49 号 v2 定稿 §5）：
 * - 零新增依赖、纯函数、无副作用
 * - 未知错误一律回落到「未知原因」兜底，绝不直暴原始串
 * - 关键词映射覆盖签名失败 / 网络 / 404 / 校验失败 / 超时 五类
 */

const KEYWORD_MAP: Array<{ pattern: RegExp; text: string }> = [
  { pattern: /signature|签名|minisign|verify/i, text: '安装包签名校验未通过，请稍后重试' },
  { pattern: /network|ENOTFOUND|ECONNREFUSED|fetch failed|网络/i, text: '网络连接异常，请检查网络后重试' },
  { pattern: /404|not found/i, text: '更新服务暂时不可用，请稍后重试' },
  { pattern: /checksum|hash|校验|digest/i, text: '安装包校验失败，请稍后重试' },
  { pattern: /timeout|ETIMEDOUT|timed out|超时/i, text: '请求超时，请稍后重试' },
]

/**
 * 把原始错误信息映射为可读文案。
 * @param raw 原始错误串（可为空/undefined）
 * @returns 可读中文文案；无法识别时回落「未知原因」
 */
export function toReadableError(raw?: string | null): string {
  if (!raw) return '未知原因'
  for (const { pattern, text } of KEYWORD_MAP) {
    if (pattern.test(raw)) return text
  }
  return '未知原因'
}
