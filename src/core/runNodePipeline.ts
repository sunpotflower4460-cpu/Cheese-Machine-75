import { BINDING_RULES, CORE_NODES, PATTERN_RULES } from './nodeData'
import type { Binding, CoreNode, LiftedPattern, NodePipelineResult, StateVector, SuppressedNode } from '../types/nodeStudio'

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

export const retrieveNodes = (text: string) => {
  const nodes: CoreNode[] = []
  const debug: string[] = []

  CORE_NODES.forEach((core) => {
    let matchCount = 0
    const matchedWords: string[] = []

    core.keywords.forEach((keyword) => {
      if (text.includes(keyword)) {
        matchCount += 1
        matchedWords.push(keyword)
      }
    })

    if (matchCount > 0) {
      const score = Math.min(0.5 + matchCount * 0.15, 0.95)
      nodes.push({
        id: core.id,
        label: core.label,
        category: core.category,
        value: score,
        reasons: [`入力内の「${matchedWords.join(', ')}」に反応`],
      })
      debug.push(`Retrieved: ${core.label} (score: ${score.toFixed(2)})`)
    }
  })

  if (nodes.length === 0) {
    nodes.push({
      id: 'processing',
      label: 'processing',
      category: 'system',
      value: 0.5,
      reasons: ['特定の強いキーワードが見当たらないため、受容モードで待機'],
    })
    debug.push("Fallback: retrieved 'processing'")
  }

  const suppressed: SuppressedNode[] = []
  const hasNode = (id: string) => nodes.some((node) => node.id === id)

  if (hasNode('fatigue')) {
    suppressed.push({ id: 'excitement', label: 'excitement', value: 0.1, reason: 'fatigueノードによる強い抑制' })
  }

  if (hasNode('ambiguity')) {
    suppressed.push({ id: 'clarity', label: 'clarity', value: 0.05, reason: 'ambiguityによる完全な抑制' })
    suppressed.push({ id: 'articulation', label: 'articulation', value: 0.1, reason: '明示的な言語化の停止' })
  }

  if (hasNode('self_doubt')) {
    suppressed.push({ id: 'self_efficacy', label: 'self_efficacy', value: 0.05, reason: 'self_doubtによる完全な抑制' })
    suppressed.push({ id: 'decisiveness', label: 'decisiveness', value: 0.2, reason: '葛藤による判断の保留' })
  }

  if (hasNode('faint_hope')) {
    suppressed.push({ id: 'despair', label: 'despair', value: 0.15, reason: '希望の兆しによる押し返し' })
  }

  suppressed.forEach((node) => debug.push(`Suppressed: ${node.label}`))

  return { activatedNodes: nodes, suppressedNodes: suppressed, debugNotes: debug }
}

export const bindNodes = (nodes: CoreNode[]) => {
  const bindings: Binding[] = []
  const debug: string[] = []
  const nodeIds = nodes.map((node) => node.id)

  BINDING_RULES.forEach((rule) => {
    if (nodeIds.includes(rule.source) && nodeIds.includes(rule.target)) {
      const sourceNode = nodes.find((node) => node.id === rule.source)
      const targetNode = nodes.find((node) => node.id === rule.target)

      if (!sourceNode || !targetNode) {
        return
      }

      const weight = (sourceNode.value + targetNode.value) / 2
      bindings.push({
        id: `b_${rule.source}_${rule.target}`,
        source: rule.source,
        target: rule.target,
        type: rule.type,
        weight,
        reasons: [`${rule.source} と ${rule.target} の共起により構造化`],
      })
      debug.push(`Bound: ${rule.source} -> ${rule.target} (${rule.type})`)
    }
  })

  return { bindings, debugNotes: debug }
}

export const liftPatterns = (nodes: CoreNode[], bindings: Binding[]) => {
  const patterns: LiftedPattern[] = []
  const debug: string[] = []
  const nodeIds = nodes.map((node) => node.id)

  PATTERN_RULES.forEach((rule) => {
    if (rule.reqNodes.every((id) => nodeIds.includes(id))) {
      const matchedNodes = rule.reqNodes
        .map((id) => nodes.find((node) => node.id === id))
        .filter((node): node is CoreNode => Boolean(node))
      const score = matchedNodes.reduce((total, node) => total + node.value, 0) / matchedNodes.length

      patterns.push({
        id: rule.id,
        label: rule.id,
        score,
        matchedNodes: rule.reqNodes,
        matchedRelations: bindings
          .filter((binding) => rule.reqNodes.includes(binding.source) && rule.reqNodes.includes(binding.target))
          .map((binding) => `${binding.source}->${binding.target}`),
      })
      debug.push(`Lifted Pattern: ${rule.id}`)
    }
  })

  return { liftedPatterns: patterns, debugNotes: debug }
}

export const analyzeNodeField = (nodes: CoreNode[], bindings: Binding[]) => {
  const stateVector: StateVector = {
    fragility: 0.3,
    urgency: 0.3,
    depth: 0.3,
    care: 0.3,
    agency: 0.5,
    ambiguity: 0.3,
    change: 0.3,
    stability: 0.5,
    self: 0.5,
    relation: 0.5,
    light: 0.5,
    heaviness: 0.3,
  }
  const hasNode = (id: string) => nodes.some((node) => node.id === id)

  if (hasNode('self_doubt')) {
    stateVector.fragility += 0.4
    stateVector.agency -= 0.3
    stateVector.depth += 0.2
  }
  if (hasNode('fatigue')) {
    stateVector.heaviness += 0.4
    stateVector.light -= 0.3
    stateVector.agency -= 0.2
  }
  if (hasNode('wanting_change')) {
    stateVector.change += 0.4
    stateVector.urgency += 0.3
    stateVector.stability -= 0.2
  }
  if (hasNode('ambiguity')) {
    stateVector.ambiguity += 0.5
    stateVector.depth += 0.2
  }
  if (hasNode('loneliness')) {
    stateVector.relation += 0.4
    stateVector.fragility += 0.3
    stateVector.care += 0.3
  }
  if (hasNode('faint_hope')) {
    stateVector.light += 0.4
    stateVector.heaviness -= 0.2
    stateVector.agency += 0.2
  }
  if (bindings.some((binding) => ['conflicts_with', 'tension'].includes(binding.type))) {
    stateVector.heaviness += 0.2
    stateVector.depth += 0.2
    stateVector.urgency += 0.2
  }

  const normalize = (value: number) => Math.max(0, Math.min(1, value))
  ;(Object.keys(stateVector) as Array<keyof StateVector>).forEach((key) => {
    stateVector[key] = normalize(stateVector[key])
  })

  return { stateVector, debugNotes: ['Analyzed field to state vector.'] }
}

export const runNodePipeline = (text: string): NodePipelineResult => {
  const startedAt = now()
  const retrieved = retrieveNodes(text)
  const bound = bindNodes(retrieved.activatedNodes)
  const lifted = liftPatterns(retrieved.activatedNodes, bound.bindings)
  const analyzed = analyzeNodeField(retrieved.activatedNodes, bound.bindings)
  const elapsedMs = now() - startedAt

  return {
    inputText: text,
    activatedNodes: retrieved.activatedNodes.sort((left, right) => right.value - left.value),
    suppressedNodes: retrieved.suppressedNodes.sort((left, right) => left.value - right.value),
    bindings: bound.bindings.sort((left, right) => right.weight - left.weight),
    liftedPatterns: lifted.liftedPatterns.sort((left, right) => right.score - left.score),
    stateVector: analyzed.stateVector,
    debugNotes: [
      'Pipeline started',
      ...retrieved.debugNotes,
      ...bound.debugNotes,
      ...lifted.debugNotes,
      ...analyzed.debugNotes,
      `Pipeline completed in ${elapsedMs.toFixed(2)} ms`,
    ],
    meta: {
      retrievalCount: retrieved.activatedNodes.length,
      bindingCount: bound.bindings.length,
      patternCount: lifted.liftedPatterns.length,
      elapsedMs,
    },
  }
}
