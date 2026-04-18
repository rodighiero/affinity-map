import { select } from 'd3-selection'

import a from '../tools/affinities'
import state from '../settings/state'
import { CE } from '../elements/cachedElements'

const W = 180
// Arc centered at bottom-right corner of SVG
const arcD = r => `M ${W - r},${W} A ${r},${r} 0 0,1 ${W},${W - r}`

// Satellite arcs + gaps for text between them; keyword arc + text outside it
const ARC_RADII  = [35,  70,  105, 140]
const TEXT_RADII = [45,  80,  115, 151]

export default (map) => {
	const that = {}

	that.init = () => {
		const satellite = a.orderedAcronyms().filter(d => a.isSatellite(d))
		const keyword   = a.orderedAcronyms().filter(d => !a.isSatellite(d))

		const affinityData = [
			...satellite.map((d, i) => ({
				acronym: d,
				label: a.name(d).toUpperCase(),
				isSatellite: true,
				active: a.defaultStatus(d),
				arcR: ARC_RADII[i],
				txtR: TEXT_RADII[i],
				clbk: v => { state.activation[d] = v; map.restart(); CE.flushNodes() },
			})),
			...keyword.map((d, i) => ({
				acronym: d,
				label: `# ${a.name(d).toUpperCase()}`,
				isSatellite: false,
				active: a.defaultStatus(d),
				arcR: ARC_RADII[satellite.length + i],
				txtR: TEXT_RADII[satellite.length + i],
				clbk: v => { state.activation[d] = v; map.restart(); CE.flushNodes() },
			})),
		]

		const svg = select('#legenda')
			.append('svg')
			.attr('width', W)
			.attr('height', W)

		// Text paths in defs (invisible, just for textPath reference)
		const defs = svg.append('defs')
		affinityData.forEach(d => {
			defs.append('path').attr('id', `tp-${d.acronym}`).attr('d', arcD(d.txtR))
		})

		affinityData.forEach(d => {
			const color = () => d.active ? '#EB5D00' : 'rgba(255,255,255,0.4)'

			const g = svg.append('g').style('cursor', 'pointer')

			// Wide transparent hit area
			g.append('path')
				.attr('d', arcD(d.arcR))
				.attr('fill', 'none')
				.attr('stroke', 'transparent')
				.attr('stroke-width', 28)

			// Visible arc
			const arc = g.append('path')
				.attr('d', arcD(d.arcR))
				.attr('fill', 'none')
				.attr('stroke', color())
				.attr('stroke-width', d.isSatellite ? 3 : 2)
				.attr('stroke-dasharray', d.isSatellite ? null : '5,4')

			// Label in the gap between arcs
			const txt = g.append('text')
				.attr('fill', color())
				.attr('font-size', 8)
				.attr('letter-spacing', 1)
				.attr('font-family', 'Arial')
				.style('pointer-events', 'none')

			txt.append('textPath')
				.attr('href', `#tp-${d.acronym}`)
				.attr('startOffset', '50%')
				.attr('text-anchor', 'middle')
				.text(d.label)

			g.on('click', () => {
				d.active = !d.active
				arc.attr('stroke', color())
				txt.attr('fill', color())
				d.clbk(d.active)
			})
		})

		return that
	}

	return that
}
