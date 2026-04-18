import { select } from 'd3-selection'

import a from '../tools/affinities'
import state from '../settings/state'
import { capitalize } from '../tools/generalTools'
import { CE } from '../elements/cachedElements'

const SIZE = 20
const R = 7

export default (map) => {
	const that = {}

	that.init = () => {
		const affinities = a.orderedAcronyms().map(d => ({
			acronym: d,
			name: capitalize(a.name(d)),
			isSatellite: a.isSatellite(d),
			active: a.defaultStatus(d),
			clbk(checked) {
				state.activation[d] = checked
				map.restart()
				CE.flushNodes()
			},
		}))

		const root = select('#affinity-controls')
		root.append('h3').text('Arrange by Affinities')

		const item = root.selectAll('div.ring-toggle').data(affinities)
			.enter().append('div')
			.attr('class', d => d.isSatellite ? 'ring-toggle' : 'ring-toggle ring-keyword')
			.style('cursor', 'pointer')
			.on('click', function(event, d) {
				d.active = !d.active
				select(this).select('circle')
					.attr('stroke', d.active ? '#EB5D00' : 'rgba(255,255,255,0.5)')
				d.clbk(d.active)
			})

		item.filter(d => !d.isSatellite).append('div').attr('class', 'kw-divider')

		const svg = item.append('svg')
			.attr('width', SIZE)
			.attr('height', SIZE)

		svg.append('circle')
			.attr('cx', SIZE / 2)
			.attr('cy', SIZE / 2)
			.attr('r', R)
			.attr('fill', 'none')
			.attr('stroke-width', d => d.isSatellite ? 3 : 2)
			.attr('stroke-dasharray', d => d.isSatellite ? null : '3,2')
			.attr('stroke', d => d.active ? '#EB5D00' : 'rgba(255,255,255,0.5)')

		item.append('span').text(d => d.isSatellite ? d.name : `# ${d.name}`)

		return that
	}

	return that
}
