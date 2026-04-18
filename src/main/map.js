import { select } from 'd3-selection'

import Simulation from './simulation'
import config from '../settings/config'
import state from '../settings/state'

import { drawSatellites, drawNodes } from '../elements/cachedElements'
import drawLinks from '../elements/links'
import computeKeywords from '../elements/keywords'

/**
 * A map is responsible to draw and maintain the simulation on the canvas.
 * It handles the engine that display the network whenever it's needed.
 */

 export default () => {
	const that = {}

	let rendering = false
	let _animate = false
	let _isConverged = false
	let simulation = undefined
	let requestId = undefined
	let inProgress = false
	let animationSet = new Set()

	/**
	 * Draw a complete image
	 * @param {boolean} forceScale : force drawing to display real scale (not rounded scale)
	 */
	const drawImage = forceScale => {
		const graph = getCurrentGraph()
		if (state.zoomTransform) {
			// if (meter) meter.tickStart()
			state.context.setTransform(state.zoomTransform.k * config.screen.density, 0, 0,
				state.zoomTransform.k * config.screen.density,
				state.zoomTransform.x * config.screen.density,
				state.zoomTransform.y * config.screen.density)

			// Cleaning
			const k = 1 / state.zoomTransform.k
			state.context.clearRect(-state.zoomTransform.x * k, -state.zoomTransform.y * k, config.screen.width * k, config.screen.height * k)

			// Drawing
			if (config.visibility.links) drawLinks(graph.links)
			if (config.visibility.nodes) drawNodes(graph.nodes, forceScale)
			if (config.visibility.satellites) drawSatellites(graph.links, forceScale)
			if (config.visibility.keywords) computeKeywords(graph.links, _isConverged, () => { drawImage() })

			// if (meter) meter.tick()

		}
	}

	const setCanvasSize = () => {

		const div = document.getElementById('diagram')
	
		config.screen.width = div.clientWidth * config.screen.density
		config.screen.height = div.clientHeight * config.screen.density
	
		state.canvas
			.style('width', `${div.clientWidth}px`)
			.style('height', `${div.clientHeight}px`)
			.attr('width', config.screen.width)
			.attr('height', config.screen.height)
	}

	/**
	 * Rendering loop
	 */
	const engine = () => {
		if (_animate) { drawImage() }

		rendering = _animate

		if (rendering) {
			rendering = false
			requestId = window.requestAnimationFrame(engine)
		} else {
			inProgress = false
		}


		return that
	}

	/** 
	 * Control the rendering engine
	 * 	- start / stop
	 * or return the animate status if no parameters are provided.
	 */
	const animate = status => {
		if (status !== undefined) {

			if (_animate === false && status === true && inProgress !== true) {
				inProgress = true
				_animate = status
				engine()
			} else {
				if (_animate === true && status === false) {
					drawImage(true)
				}
				_animate = status
			}
			return that
		} else { return _animate }
	}

	const updateImage = () => {
		if (!inProgress) { drawImage() }
	}

	/**
	 * Create the canvas and the simulation, initialize "local" variables.
	 */
	const init = () => {
		inProgress = false
		_isConverged = false
		simulation = Simulation(that)
		// Set density
		if ('devicePixelRatio' in window && window.devicePixelRatio > 1)
			config.screen.density = window.devicePixelRatio

		// Set state.canvas
		// const test = select('#diagram').append('canvas')
		const canvasSel = select('#diagram').selectAll('canvas').data([0])
		const canvasNew = canvasSel.enter().append('canvas')

		const canvasNode = select(canvasSel.merge(canvasNew).nodes()[0])
		state.canvas = canvasNode


		// Set canvas size
		setCanvasSize()

		// Set context and its resolution
		state.context = state.canvas.node().getContext('2d')
		state.context.scale(config.screen.density, config.screen.density)

		return that
	}

	/**
	 * Start the animation and the simulation with a new graph
	 */
	const start = () => {
		startNamedAnimation('init')
		simulation.start(getCurrentGraph())
		return that
	}

	/**
	 * Update the graph and restart the simulation and rendering
	 */
	const restart = () => {
		that.startNamedAnimation('init')
		simulation.restart(getCurrentGraph())

		return that
	}

	/**
	 * Choose between enac or epfl graph, wrt to state.enacOnly properties.
	 */
	const getCurrentGraph = () => {
		return state.enacOnly ? state.enGraph : state.epGraph
	}

	/**
	 * Start the animation from a context (name). Several context can start the animation,
	 * if the animation is already started, the name is added to the list, but nothing happen.
	 * @param {string} name : name of the event starting the animation
	 */
	const startNamedAnimation = name => {
		if (!animationSet.has(name)) {
			if (state.debug) { console.log(`get animation start from ${name}`) }
			animationSet.add(name)

			if (!inProgress) {
				if (state.debug) { console.warn(`starting animation from ${name}`) }
				animate(true)
			}
		}
	}

	/**
	 * Stop the animation from a context (name). The animation is actually stopped, 
	 * when is has been stopped from all the context which have started it.
	 * @param {string} name 
	 */
	const stopNamedAnimation = name => {
		if (state.debug) { console.log(`get animation stop from ${name}`) }
		animationSet.delete(name)

		if (!animationSet.size) {
			if (state.debug) { console.warn(`stopping animation from ${name}`) }
			animate(false)
		}

	}

	const hardStopAnimation = () => {
		animationSet = new Set()
		stopNamedAnimation()
		window.cancelAnimationFrame(requestId)
	}

	Object.defineProperties(that, {
		setCanvasSize: { value: setCanvasSize },
		updateImage: { value: updateImage },
		startNamedAnimation: { value: startNamedAnimation },
		stopNamedAnimation: { value: stopNamedAnimation },
		hardStopAnimation: { value: hardStopAnimation },
		init: { value: init },
		start: { value: start },
		restart: { value: restart },

		isConverged: { set: x => _isConverged = x },
	})



	return that.init().start()
}