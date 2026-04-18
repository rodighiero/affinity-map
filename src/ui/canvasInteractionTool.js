import { select, pointer } from 'd3-selection'

import { zoomToLab } from '../main/zoom'
import state from '../settings/state'
import config from '../settings/config'

const getGraph = ()=>
	state.enacOnly ? state.enGraph : state.epGraph


/******************************************************************************
 * This helper object manage relation between the cursor position and
 * data position, allowing clicks on canvas to generate events (zoom to nodes,
 * cursor modification, ...)
 ******************************************************************************/
export default initialGraph => {
	const that = {}
	// let graph = initialGraph

	/******************************************************************************
	 * Is the cursor position (into the data space) inside a circle of radius r
	 * at location x,y.
	 ******************************************************************************/
	const insideCircle = (dataCoords, x, y, r) => {
		const dx = dataCoords[0] - x
		const dy = dataCoords[1] - y

		const clickRadius = Math.sqrt(dx * dx + dy * dy) * state.zoomTransform.k // click radius in display space
		const coRadius = r * state.zoomTransform.k

		return clickRadius < coRadius
	}

	/******************************************************************************
	 * Get the node under the cursor (in data space coordinates), if any.
	 ******************************************************************************/
	const getNode = dataCoords => {
		let underMouseNodeId = -1
		for (let i = 0; i < getGraph().nodes.length && underMouseNodeId === -1; i++) {
			const {
				x,
				y,
			} = getGraph().nodes[i]
			const r = config.node.radius
			if (insideCircle(dataCoords, x, y, r)) {
				return getGraph().nodes[i]
			}
		}

		return null
	}

	/******************************************************************************
	 * Get the satelite under the cursor (in data space coordinates), if any
	 ******************************************************************************/
	const getSatellite = dataCoords => {
		let underMouseLinkId = -1
		for (let i = 0; i < getGraph().links.length && underMouseLinkId === -1; i++) {
			const {
				s1,
				s2,
			} = getGraph().links[i]

			// if s1 or s2 is null (it happens when the graph is not ready)
			if (!s1 || !s2) {
				continue
			}

			// check sat1
			if (insideCircle(dataCoords, s1.abs.x, s1.abs.y, getGraph().links[i].satelliteRadius)) {
				return getGraph().links[i].target
			}

			// check sat2
			if (insideCircle(dataCoords, s2.abs.x, s2.abs.y, getGraph().links[i].satelliteRadius)) {
				return getGraph().links[i].source
			}
		}
		return null
	}

	that.init = () => {
		const canvasSel = select('#diagram > canvas')
		canvasSel
			.on('mousemove', function (event) {
				const screenCoords = pointer(event)
				const dataCoords = state.zoomTransform.invert(screenCoords)
				canvasSel.style('cursor', getNode(dataCoords) || getSatellite(dataCoords) ? 'pointer' : 'default')
			})
			.on('click', function (event) {
				const screenCoords = pointer(event)

				const dataCoords = state.zoomTransform.invert(screenCoords)
				const node = getNode(dataCoords)

				if (node) {
					zoomToLab(getGraph(), node.attr.name)
				} else {
					const satNode = getSatellite(dataCoords)
					if (satNode) {
						zoomToLab(getGraph(), satNode.attr.name)
					}
				}

			})
		return that
	}

	return that
}