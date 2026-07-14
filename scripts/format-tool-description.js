const TOP_SECTIONS = [
  'CAPABILITIES',
  'WHEN TO USE THIS TOOL',
  'PREFER THIS TOOL WHEN USER SAYS',
  'USAGE FLOW',
  'RETURNS',
  'SUPPORTED LANGUAGES',
  'ADDITIONAL SECTIONS',
  'SOURCE TARGETING GUIDANCE',
  'USE WHEN',
  'POLLING GUIDANCE (bounded - never block the chat)',
  'SLOW-EXECUTION SNAPSHOTS',
  'STATES',
  'SPECIAL CASE',
  'TIMESTAMPS',
  'PAGINATION',
  'CALL ONLY WHEN',
]

const NESTED_SECTIONS = [
  'SOURCE SELECTION (Canonical Guidelines)',
  'PAGINATION (Canonical Rules and Guarantees)',
  "LIGHTRUN'S ADVANTAGE (Why use Lightrun tools)",
  'ATTRIBUTION (Canonical Requirement)',
  'ACTION TYPE TARGET RUNTIME VALIDATION (Canonical Rules)',
  'LIGHTRUN ACTION TIMING (Canonical Definition)',
  'LINE SELECTION (Canonical Guidelines)',
  'RULES',
  'RETURNED FIELDS (per response)',
  'GUARANTEES',
]

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseSections(text, headers) {
  const re = new RegExp(`(${headers.map(escapeRe).join('|')}):`, 'g')
  const matches = [...text.matchAll(re)]
  if (!matches.length) return { intro: text.trim(), sections: [] }

  const intro = text.slice(0, matches[0].index).trim()
  const sections = matches.map((match, i) => ({
    header: match[1],
    body: text.slice(match.index + match[0].length, matches[i + 1]?.index ?? text.length).trim(),
  }))

  return { intro, sections }
}

function formatBullets(text, indent = '') {
  const lines = []
  let rest = text.trim()

  while (rest) {
    const step = rest.match(/^(\d+\.\s.+?)(?=\s+\d+\.\s|$)/s)
    if (step) {
      const stepText = step[1].trim()
      const colonSplit = stepText.match(/^(\d+\.\s.+?:)\s*(.*)$/s)
      if (colonSplit?.[2]?.trim()) {
        lines.push(`${indent}${colonSplit[1]}`)
        lines.push(...formatBullets(colonSplit[2], `${indent}   `))
      } else {
        lines.push(`${indent}${stepText}`)
      }
      rest = rest.slice(step[0].length).trim()
      continue
    }

    const bulletSplit = rest.split(/(?<=[.!?])\s+-\s+|\s+-\s+(?=[A-Z"0-9])/)
    if (bulletSplit.length > 1) {
      const lead = bulletSplit[0].trim()
      if (lead) {
        const sub = lead.match(/^(.+?:)\s*(.+)$/s)
        if (sub?.[2]?.trim()) {
          lines.push(`${indent}${sub[1]}`)
          lines.push(...formatBullets(sub[2], `${indent}  `))
        } else {
          lines.push(`${indent}${lead}`)
        }
      }
      for (const item of bulletSplit.slice(1)) {
        const trimmed = item.trim()
        if (trimmed) lines.push(`${indent}- ${trimmed}`)
      }
      break
    }

    if (rest) lines.push(`${indent}${rest}`)
    break
  }

  return lines
}

function renderSections(sections, depth = 3) {
  const lines = []
  const heading = (n) => '#'.repeat(Math.min(n, 6))

  for (const section of sections) {
    if (section.header === 'ADDITIONAL SECTIONS') {
      const nested = parseSections(section.body, NESTED_SECTIONS)
      if (nested.sections.length) {
        lines.push(...renderSections(nested.sections, depth))
      } else if (section.body) {
        lines.push(...formatBullets(section.body), '')
      }
      continue
    }

    if (!section.body) continue

    if (section.header === 'PREFER THIS TOOL WHEN USER SAYS') {
      lines.push(`${heading(depth)} ${section.header}`, '', `> ${section.body}`, '')
      continue
    }

    const nested = parseSections(section.body, NESTED_SECTIONS)
    lines.push(`${heading(depth)} ${section.header}`, '')

    if (nested.sections.length) {
      if (nested.intro) lines.push(...formatBullets(nested.intro), '')
      lines.push(...renderSections(nested.sections, depth + 1))
    } else {
      lines.push(...formatBullets(section.body), '')
    }
  }

  return lines
}

export function formatToolMarkdown(name, description) {
  const { intro, sections } = parseSections(description.trim(), TOP_SECTIONS)
  const lines = [`## \`${name}\``, '']

  if (intro) {
    const callOnly = intro.match(/^(.*?)(CALL ONLY WHEN .+)$/s)
    if (callOnly) {
      lines.push(callOnly[1].trim(), '')
      lines.push('**Call only when:**', callOnly[2].replace(/^CALL ONLY WHEN /, ''), '')
    } else {
      lines.push(intro, '')
    }
  }

  lines.push(...renderSections(sections))
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()
}

export function formatToolsDocument({ serverName, uri, tools, generatedAt = new Date() }) {
  const header = [
    '# Lightrun MCP Tool Descriptions',
    '',
    '| | |',
    '|---|---|',
    `| **Server** | \`${serverName}\` |`,
    `| **URL** | ${uri} |`,
    `| **Tools** | ${tools.length} |`,
    `| **Generated** | ${generatedAt.toISOString()} |`,
    '',
    '---',
    '',
  ].join('\n')

  const body = tools
    .map((t) => formatToolMarkdown(t.name || t.tool, t.description || ''))
    .join('\n\n---\n\n')

  return header + body + '\n'
}
