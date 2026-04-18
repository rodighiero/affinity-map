import { select } from 'd3-selection'

import a from '../tools/affinities'
import state from '../settings/state'
import { CE } from '../elements/cachedElements'

const W = 180
const arcD = r => `M ${W - r},0 A ${r},${r} 0 0,1 ${W},${r}`

export default (map) => {
	const that = {}

	that.init = () => {
		const satelliteRadii = [50, 90, 130]
		const keyRadius = 165

		const affinityData = [
			...a.orderedAcronyms()
				.filter(d => a.isSatellite(d))
				.map((d, i) => ({
					acronym: d,
					label: a.name(d).toUpperCase(),
					isSatellite: true,
					active: a.defaultStatus(d),
					radius: satelliteRadii[i],
					clbk: checked => { state.activation[d] = checked; map.restart(); CE.flushNodes() },
				})),
			...a.orderedAcronyms()
				.filter(d => !a.isSatellite(d))
				.map(d => ({
					acronym: d,
					label: `# ${a.name(d).toUpperCase()}`,
					isSatellite: false,
					active: a.defaultStatus(d),
					radius: keyRadius,
					clbk: checked => { state.activation[d] = checked; map.restart(); CE.flushNodes() },
				})),
		]

		const svg = select('#legenda')
			.append('svg')
			.attr('width', W)
			.attr('height', W)

		const defs = svg.append('defs')
		affinityData.forEach(d => {
			defs.append('path')
				.attr('id', `arcpath-${d.acronym}`)
				.attr('d', arcD(d.radius))
		})

		affinityData.forEach(d => {
			const color = () => d.active ? '#EB5D00' : 'rgba(255,255,255,0.5)'

			const g = svg.append('g').style('cursor', 'pointer')

			g.append('path')
				.attr('d', arcD(d.radius))
				.attr('fill', 'none')
				.attr('stroke', 'transparent')
				.attr('stroke-width', 24)

			const arc = g.append('path')
				.attr('d', arcD(d.radius))
				.attr('fill', 'none')
				.attr('stroke', color())
				.attr('stroke-width', d.isSatellite ? 10 : 6)
				.attr('stroke-dasharray', d.isSatellite ? null : '6,4')

			const txt = g.append('text')
				.attr('fill', color())
				.attr('font-size', 9)
				.attr('letter-spacing', 1.5)
				.attr('font-family', 'Arial')
				.style('pointer-events', 'none')

			txt.append('textPath')
				.attr('href', `#arcpath-${d.acronym}`)
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
