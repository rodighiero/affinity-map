import { forceManyBody, forceSimulation, forceCollide, forceLink, forceCenter } from 'd3-force'
import { scaleLinear } from 'd3-scale'
import { max } from 'd3-array'

import s from '../settings/config'
import state from '../settings/state'
import { zoomToExtent } from './zoom'
import { initPairs } from '../tools/generalTools'


const Simulation = map => {

	const that = {
		simulation: undefined,
	}

	const affinities = Object.keys(state.activation)
	const getValue = link => affinities.reduce((value, affinity) =>
		value + (state.activation[affinity] ? link.metrics.std[affinity] : 0), 0)

	let setLinksMax = links => max(links, getValue)

	const init = () => {
		that.scale = scaleLinear().range([0, 1])
		that.simulation = forceSimulation()
	}


	//
	// Restart simulation
	//

	that.restart = graph => {

		state.linksMax = setLinksMax(graph.links)
		that.scale.domain([0, state.linksMax])
		initPairs(graph.nodes)
		map.isConverged = false
		if (graph.links.length === 0) {
			that.simulation.force('link', null)
		} else {
			if (!that.simulation.force('link')) {
				that.simulation.force('link', that.fl)
			}
			that.fl.links(graph.links)
			that.fl.strength(link => that.scale(getValue(link)))
		}

		const a = 1. / (graph.links.length + 0.1) + 1.3

		that.simulation.iTicks = 0
				that.simulation
			.nodes(graph.nodes)
			.alpha(a).restart()

		return that

	}

	//
	// Start simulation
	//

	that.start = graph => {
				state.linksMax = setLinksMax(graph.links)
		that.scale.domain([0, state.linksMax])
		initPairs(graph.nodes)

		that.fl = forceLink()
			.id(d => d.attr.name)
			.links(graph.links)
			.strength(link => that.scale(getValue(link)))
			.distance(s.node.distance)

		that.simulation.nodes(graph.nodes)
			.force('link', that.fl)
			.force('collide', forceCollide().radius(s.node.distance).strength(.5).iterations(20))
			.force('charge', forceManyBody().strength(500))
			.force('center', forceCenter(0, 0))

		map.isConverged = false
		const alphaDecay = that.simulation.alphaDecay()
		const alphaMin = that.simulation.alphaMin()

		that.simulation.iTicks = 0
		const numberOfTicks = Math.ceil(Math.log(alphaMin) / Math.log(1 - alphaDecay))

		that.simulation
			.on('tick', function () {
				if (this.iTicks === numberOfTicks / 3) {
					map.isConverged = true
					zoomToExtent(3000)

					state.zoom.on('end', () => {
						map.stopNamedAnimation('zoom')

						state.zoom.on('end', () => {
							map.stopNamedAnimation('zoom')
						})
					})
				}
				this.iTicks++
			})
			.on('end', () => {
				map.isConverged = true
				map.stopNamedAnimation('init')
				if (state.debug) { console.warn('done') }
			})

		return that
	}

	init()
	return that
}

export default Simulation