import state from '../settings/state'
import { staticColor } from '../settings/colors'
import { drawKeywords } from './graphics'
import aff from '../tools/affinities'

import spinner from '../ui/spinner'
import config from '../settings/config'

// check effective and potential keywords

const isActual = (a, b, link) =>
	((link.source.attr.name === a && link.target.attr.name === b) || (link.target.attr.name === a && link.source.attr.name === b))
	&& aff.visibleAcronyms().some(aff => link.metrics.values[aff])

const setColor = (a, b, links) =>
	links.filter(link => isActual(a, b, link)).length > 0 ? staticColor('keywordsOn') : staticColor('keywordsOff')



// DrawKeywords

const d_min = Math.pow(200, 2)
const d_max = Math.pow(300, 2)

const hashCode = str => {
	let hash = 0
	if (str.length === 0) return hash

	for (let i = 0; i < str.length; i++) {
		const chr = str.charCodeAt(i)
		hash = ((hash << 5) - hash) + chr
		hash |= 0 // Convert to 32bit integer
	}
	return hash
}

const labKeywords = new Map()

export const initKeywords = (nodes) => {
	nodes.forEach(node => {
		const keywords = node.attr.keywords || []
		labKeywords.set(node.attr.name, keywords)
	})
}

const sharedKeywords = (nameA, nameB) => {
	const kwA = labKeywords.get(nameA) || []
	const kwB = new Set(labKeywords.get(nameB) || [])
	return kwA.filter(kw => kwB.has(kw))
}

export default (links, isAlmostConverged, clbk) => {
	const ready = []

	state.pairs.forEach(pair => {
		const n1 = pair[0]
		const n2 = pair[1]

		const dx = Math.abs(n1.x - n2.x)
		const dy = Math.abs(n1.y - n2.y)
		const distSq = dx * dx + dy * dy

		if (distSq < d_max) {
			const shared = sharedKeywords(n1.attr.name, n2.attr.name)
			if (shared.length > 0) {
				ready.push({
					keywords: shared.slice(0, 5),
					color: setColor(n1.attr.name, n2.attr.name, links),
					x: Math.min(n1.x, n2.x) + dx / 2,
					y: Math.min(n1.y, n2.y) + dy / 2,
				})
			}
		}
	})

	if (ready.length > 0) drawKeywords(ready)
}