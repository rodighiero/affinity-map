import { scaleLinear } from 'd3-scale'

import state from '../settings/state'
import { drawLinks } from './graphics'
import a from '../tools/affinities'


const thickness = 5

export default (links, ctx = state.context) => {

	const _s = scaleLinear().domain([0, state.linksMax]).range([0, thickness]) // Linear
	const affinities = a.visibleAcronyms()

	const linksToDraw = links.reduce((object, link) => {

		// sum metrics.std[x] values, if state.distance[x] is enabled
		const value = affinities.reduce((o, aff) => o + (state.activation[aff] ? link.metrics.std[aff] : 0), 0)

		if (value > 0) {
			const thickness = _s(value)
			if (!object[thickness]) object[thickness] = []
			object[thickness].push({
				source: link.source,
				target: link.target,
			})
		}

		return object
	}, {})

	drawLinks(linksToDraw, ctx)

}