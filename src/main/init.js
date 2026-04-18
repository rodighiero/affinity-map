import { scaleLinear } from 'd3-scale'
import { range } from 'd3-array'
import config from '../settings/config'
import state from '../settings/state'
import lab from '../elements/chord'

import affinities from '../tools/affinities'
import { initCaches } from '../elements/cachedElements'

state.debug = new URL(window.location.href).searchParams.get('debug') !== null

export const init = data => {

	if (state.debug) {
		window.state = state
		window.config = config
	}

	state.init(data)
	affinities.init(data.affinities)



	// Chord diagrams and ribbon
	state.chordLayouts = data.graph.nodes.reduce((layouts, node) => {
		if (node.network.matrix.length === 0) {
			const length = node.network.nodes.length
			node.network.matrix = range(0, length).map(() => range(0, length).map(() => 0))
		}
		layouts[node.attr.name] = lab()
			.padding(.02)
			.matrix(node.network.matrix)
		return layouts
	}, {})



	// Object { aff1:0, aff2:0, ...}
	const aObject = affinities.acronyms().reduce((o, v) => ({ ...o, [v]: 0 }), {})

	// Compute the average link.sizes
	const linkAverage = data.graph.links.reduce((o, link) => {
		affinities.acronyms().forEach(k => o[k] += link.metrics.values[k] / data.graph.links.length)
		return o
	}, { ...aObject })

	// Set metrics.values for the links
	data.graph.links.forEach(link => {
		link.metrics.std = affinities.acronyms().reduce((o, aff) => {
			return { ...o, [aff]: link.metrics.values[aff] / linkAverage[aff] }
		}, {})
	})



	// Set link max
	const max = data.graph.links.reduce((o, link) => {
		const sum = affinities.satelliteAcronyms().reduce((o, v) => o + link.metrics.values[v], 0)
		return o > sum ? o : sum
	}, 0)

	// Set Scale
	const scale = scaleLinear().domain([1, max]).range([config.satellite.width.min, config.satellite.width.max])

	// Set link Width
	data.graph.links.forEach(link => {
		link.metrics.widths = affinities.acronyms().reduce((o, affinity) => {
			o[affinity] = scale(link.metrics.values[affinity])
			return o
		}, {})
	})

	// Set satellite radius
	data.graph.links.forEach(link => {
		link.satelliteRadius = config.satellite.radius +
			config.satellite.width.gap +
			affinities.satelliteAcronyms().reduce((o, v) => {
				return o + (link.metrics.values[v] > 0 ? link.metrics.widths[v] : config.satellite.width.empty)
			}, 0)
	})

	config.client = {
		isMobile: /Mobi/i.test(navigator.userAgent),
		isTablet: /Tablet|iPad/i.test(navigator.userAgent),
	}

	initCaches()
}