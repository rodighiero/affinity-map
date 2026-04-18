import { zoom, zoomIdentity } from 'd3-zoom'
import { select } from 'd3-selection'

import s from '../settings/config'
import state from '../settings/state'



/**
 * Here defined functions manage zoom for the graph and the canvas,
 * they handle events (refresh during zoom,...), and compute scale,
 * translate to maximize the size of the graph on screen, or to zoom
 * on a given lab.
 */

/**
 * Path the map to initialize event handling and attach zoom to canvas.
 * @param {map} map 
 */
export const zoomInit = map => {

	state.zoom = zoom()
		.scaleExtent([s.zoom.min, s.client.isMobile || s.client.isTablet ? 16 / s.screen.density : 16])
		.on('start', () => map.startNamedAnimation('zoom'))
		.on('zoom', (event) => state.zoomTransform = event.transform)
		.on('end', () => map.stopNamedAnimation('zoom'))


	state.zoomTransform = zoomIdentity
		.scale(s.zoom.init)
		.translate(
			s.screen.width / 2 / s.screen.density / s.zoom.init,
			s.screen.height / 2 / s.screen.density / s.zoom.init)

	state.canvas
		.call(state.zoom)
		.call(state.zoom.transform, state.zoomTransform)
}


export const zoomToLab = (graph, lab) => {

	let node = graph.nodes.find(node => node.attr.name === lab)

	const k = Math.min(s.screen.width, s.screen.height) / ((s.client.isMobile && !s.client.isTablet ? 150 : 200) * s.screen.density)
	const transformation = zoomIdentity
		.translate(s.screen.width / 2 / s.screen.density, s.screen.height / 2 / s.screen.density)
		.scale(k)
		.translate(-node.x, -node.y)

	state.canvas.transition().duration(2000).call(state.zoom.transform, transformation)

}


/**
 * Compute scale and translate, to show the graph on the entire display.
 * @param {graph} graph 
 */
const getFullExtentTransformationValues = graph => {
	const realGraph = graph ? graph : state.enacOnly ? state.enGraph : state.epGraph

	// compute min and max node coordinates, the double radius compensate half node, and margin
	const ext = realGraph.nodes.filter(n => n.visibility).reduce((o, v) => ({
		xMin: Math.min(o.xMin, v.x - s.node.radius * 2),
		xMax: Math.max(o.xMax, v.x + s.node.radius * 2),
		yMin: Math.min(o.yMin, v.y - s.node.radius * 2),
		yMax: Math.max(o.yMax, v.y + s.node.radius * 2),
	}), { xMin: Number.MAX_VALUE, xMax: Number.MIN_VALUE, yMin: Number.MAX_VALUE, yMax: Number.MIN_VALUE }
	)

	// the class of each element of the interface from which to compute the margin (ex: top : .interface.bottom)
	const margin = {
		top: select('.interface.top').node().getBoundingClientRect().bottom,
		bottom: 40,
	}

	// add node radius to every min/max coordinates
	const view = {
		width: s.screen.width,
		height: s.screen.height - margin.top - margin.bottom,
	}

	// compute scale
	const scale = 1 / Math.max(
		(ext.xMax - ext.xMin) * s.screen.density / view.width,
		(ext.yMax - ext.yMin) * s.screen.density / view.height
	)

	// compute position
	const t = [
		(((view.width - scale * (ext.xMax + ext.xMin)) / 2)) / s.screen.density,
		(((view.height - scale * (ext.yMax + ext.yMin)) / 2) + margin.top) / s.screen.density,
	]

	return { t, scale }
}


/**
 * Get scale and translate from getFullExtent and use it as current transform.
 * @param {graph} duration 
 */
export const zoomToExtent = duration => {
	const { t, scale } = getFullExtentTransformationValues()
	state.canvas.transition().duration(duration).call(state.zoom.transform, zoomIdentity.translate(...t).scale(scale))
}