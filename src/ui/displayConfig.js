import { select } from 'd3-selection'

import a from '../tools/affinities'
import state from '../settings/state'
import { capitalize } from '../tools/generalTools'
import { CE } from '../elements/cachedElements'

export default (map) => {
	const that = {}

	that.init = () => {
		const affinities = a.orderedAcronyms().map(d => ({
			name: capitalize(a.name(d)),
			clbk(checked) {
				state.activation[d] = checked
				map.restart()
				CE.flushNodes()
			},
			dft: a.defaultStatus(d),
		}))

		const root = select('#affinity-controls')
		root.append('h3').text('Arrange by Affinities')

		const items = root.selectAll('div.tglBtnContainer').data(affinities)
		const item = items.enter().append('div').attr('class', 'tglBtnContainer')

		const inputs = item.append('input')
			.attr('type', 'checkbox')
			.attr('class', 'tgl tgl-ios')
			.attr('id', d => `${d.name}-btn`)
			.property('checked', d => d.dft)

		inputs.each(function(d) {
			select(this).on('change', () => {
				d.clbk(select(this).property('checked'))
			})
		})

		item.append('label').attr('class', 'tgl-btn').attr('for', d => `${d.name}-btn`)
		item.append('text').text(d => d.name)

		return that
	}

	return that
}
