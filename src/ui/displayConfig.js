import { select } from 'd3-selection'

import a from '../tools/affinities'
import state from '../settings/state'
import { capitalize } from '../tools/generalTools'
import { CE } from '../elements/cachedElements'

const configCats = [
	{
		name: 'Arrange by Affinities',
		children: undefined,
	},
]

export default (map) => {
	const that = {
		panelId: 'displayConfigPanel',
		openButtonId: 'dcpOpenBtn',
		status: false,
	}

	const setAffinityCat = () => {
		configCats[0].children = a.orderedAcronyms().map(d => ({
			name: capitalize(a.name(d)),
			clbk(checked) {
				state.activation[d] = checked
				map.restart()
				CE.flushNodes()
			},
			dft: a.defaultStatus(d),
		}))
	}

	that.closePanel = () => {
		that.status = false
		document.getElementById(that.panelId).classList.add('closed')
		document.getElementById(that.openButtonId).classList.add('closed')
		return that
	}

	that.init = () => {
		setAffinityCat()

		document.getElementById(that.openButtonId).addEventListener('click', () => {
			that.status = !that.status
			if (!that.status) {
				document.getElementById(that.panelId).classList.add('closed')
				document.getElementById(that.openButtonId).classList.add('closed')
			} else {
				document.getElementById(that.panelId).classList.remove('closed')
				document.getElementById(that.openButtonId).classList.remove('closed')
			}
		})

		const divsSel = select(`#${that.panelId} #controls`).selectAll('div.contained').data(configCats)
		const divs = divsSel.enter().append('div').merge(divsSel)

		divs.selectAll('h3').data(d => [d]).enter().append('h3').text(d => d.name)

		const intDivsSel = divs.selectAll('div').data(d => d.children)
		const intDivs = intDivsSel.enter().append('div').attr('class', 'tglBtnContainer').merge(intDivsSel)

		const inputs = intDivs.selectAll('input').data(d => [d]).enter()
			.append('input').attr('type', 'checkbox').attr('class', 'tgl tgl-ios').attr('id', d => `${d.name}-btn`)

		inputs
			.property('checked', d => d.dft)
			.each(function (d) {
				select(this).on('change', () => {
					d.clbk(select(this).property('checked'), map)
				})
			})

		intDivs.selectAll('label').data(d => [d]).enter()
			.append('label').attr('class', 'tgl-btn').attr('for', d => `${d.name}-btn`)

		intDivs.selectAll('text').data(d => [d]).enter()
			.append('text').text(d => d.name)

		return that
	}

	return that
}
