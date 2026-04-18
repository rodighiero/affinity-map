import { staticColor } from '../settings/colors'
import state from '../settings/state'
import { drawNode, drawSatellite, drawInnerCircle, drawOrbit } from './graphics'
import canvasContextCache from '../tools/CanvasContextCache'
import aff from '../tools/affinities'
import config from '../settings/config'



/**
 * Draw a pre-computed canvas into the diagram canvas, at a position given by node x and y, w.r.t. current scales (diagram and pre-computed canvases).
 * 
 * @param {Element} canvas the canvas element to draw
 * @param {Node} node the lab node to draw
 * @param {Number} cachedK the scale of canvas element (might be different from the state.zoomTransform.k)
 */
const drawSubCanvas = (canvas, node, cachedK) => {
	const { x, y, k } = state.zoomTransform
	const { density } = config.screen

	// use integer value to position the subCanvas should reduce blurriness
	// but we will do it only when zoom factor is high enough
	const shouldRound = cachedK >= 4
	const posX = shouldRound ? Math.round(cachedK * node.x - canvas.width / 2) : cachedK * node.x - canvas.width / 2
	const posY = shouldRound ? Math.round(cachedK * node.y - canvas.height / 2) : cachedK * node.y - canvas.height / 2
	const transX = shouldRound ? Math.round(x * density) : x * density
	const transY = shouldRound ? Math.round(y * density) : y * density

	state.context.setTransform((k * density) / cachedK, 0, 0, (k * density) / cachedK, transX, transY)
	if (state.debug) { state.context.strokeRect(posX, posY, canvas.width, canvas.height) }
	state.context.drawImage(canvas, posX, posY)

	state.context.setTransform(k * density, 0, 0, k * density, transX, transY)
}

const isNodeShown = (node, canvasSize) => {
	const { x, y } = node
	const { x: zx, y: zy, k } = state.zoomTransform
	const { density } = config.screen

	const width = canvasSize * k
	const height = width

	const ox = x * k + zx - width / 2
	const oy = y * k + zy - height / 2

	return ox + width > 0 && ox < config.screen.width / density && oy + height > 0 && oy < config.screen.height / density
}




const computeSatPosition = (source, target) => {
	const s1 = {
		diff: {},
		pos: { rel: {}, abs: {} },
		name: target.attr.displayName ? target.attr.displayName : target.attr.name,
		visibility: target.visibility,
		faculty: target.attr.faculty,
		institute: target.attr.institute,
	}

	s1.diff.x = target.x - source.x
	s1.diff.y = target.y - source.y

	s1.degree = Math.atan2(s1.diff.y, s1.diff.x)

	s1.pos.rel.x = Math.cos(s1.degree) * config.node.radius + s1.diff.x * .04
	s1.pos.rel.y = Math.sin(s1.degree) * config.node.radius + s1.diff.y * .04

	s1.pos.abs.x = source.x + s1.pos.rel.x
	s1.pos.abs.y = source.y + s1.pos.rel.y
	s1.distance = Math.sqrt(Math.pow(s1.pos.rel.x, 2) + Math.pow(s1.pos.rel.y, 2))

	return s1
}

const satRendering = (cache, canvasSize, source, target, cachedK, link, populateOnly, nodes, realSource) => {
	const { k, x, y } = state.zoomTransform
	const currentDate = new Date()
	const density = config.screen
	if (nodes && typeof source === 'string') {
		source = nodes.find(o => o.attr.name === source)
	}

	if (nodes && typeof target === 'string') {
		target = nodes.find(o => o.attr.name === target)
	}

	const sat1Key = `${source.attr.name}-${target.attr.name}`
	const s = computeSatPosition(source, target)

	if (realSource) {
		link.s1 = s.pos
	} else {
		link.s2 = s.pos
	}



	const shoudShowOrbit = isNodeShown(source, config.node.radius + config.node.max + s.distance)
	if (!populateOnly && shoudShowOrbit) {
		state.context.setTransform((k * density) / cachedK, 0, 0, (k * density) / cachedK, x * density, y * density)
		drawOrbit(s.distance, source.x, source.y, state.context)
	}
	if (!isNodeShown(s.pos.abs, canvasSize) && !populateOnly) {
		return 0
	}

	const newSat = cache.render(currentDate, cachedK, sat1Key,
		(canvas, context) => {
			context.setTransform(cachedK, 0, 0, cachedK, canvas.width / 2, canvas.height / 2)
			drawSatellite(s, link, context)
		},
		canvas => {
			drawSubCanvas(canvas, s.pos.abs, cachedK)
		})

	if (!target.visibility) {
		state.context.translate(s.pos.abs.x, s.pos.abs.y)
		drawInnerCircle(link.satelliteRadius, staticColor('filteredBackground'), state.context)
		state.context.translate(-s.pos.abs.x, -s.pos.abs.y)
	}

	return newSat
}

const cachedElements = () => {
	const that = {
		nodeCanvasSize: -1,
		satCanvasSize: -1,
		nodeCache: undefined,
		satCache: undefined,
	}

	that.flushNodes = () => {
		that.nodeCache.emptyCache()
		that.satCache.emptyCache()
	}

	that.init = () => {
		that.nodeCanvasSize = config.client.isMobile || config.client.isTablet || !config.private ? 110 : 200
		that.satCanvasSize = 14
		that.nodeCache = canvasContextCache(that.nodeCanvasSize).init()
		that.satCache = canvasContextCache(that.satCanvasSize).init()

		that.nodeCache.setCompanionCaches([that.satCache])
		that.satCache.setCompanionCaches([that.nodeCache])

		window.ec = that.nodeCache.emptyCache

	}



	that.drawSatellites = (links, forceScale, populateOnly, nodes) => {
		const { density } = config.screen
		const { k } = state.zoomTransform
		const cachedK = density * (forceScale && k >= 4 ? k : Math.ceil(k))

		const counter = links.reduce((o, link) => {
			if (typeof link.source === 'string' || typeof link.target === 'string') { return o }
			if (!aff.satelliteAcronyms().some(aff => link.metrics.values[aff])) { return o }
			return o + satRendering(that.satCache, that.satCanvasSize, link.source, link.target, cachedK, link, populateOnly, nodes, true) +
				satRendering(that.satCache, that.satCanvasSize, link.target, link.source, cachedK, link, populateOnly, nodes, false)

		}, 0)

		if (state.debug && counter > 0) {
			console.log(`stats: ${cachedK} - ${counter}`)
		}
	}

	that.drawNodes = (nodes, forceScale) => {
		const { density } = config.screen
		const { k } = state.zoomTransform
		const cachedK = density * (forceScale && k >= 3 ? k : Math.ceil(k))
		const currentDate = new Date()

		const counter = nodes.filter(n => isNodeShown(n, that.nodeCanvasSize)).reduce((o, node) => { // Nodes
			const newNode = that.nodeCache.render(currentDate, cachedK, node.attr.name,
				(canvas, context) => {
					context.setTransform(cachedK, 0, 0, cachedK, canvas.width / 2, canvas.height / 2)
					drawNode(node, context)
				}, canvas => {
					drawSubCanvas(canvas, node, cachedK)
				})

			if (!node.visibility) {
				state.context.translate(node.x, node.y)
				drawInnerCircle(config.node.radius, staticColor('filteredBackground'), state.context)
				state.context.translate(-node.x, -node.y)
			}
			return o + newNode
		}, 0)

		if (state.debug && counter > 0) {
			console.log(`nodes: ${cachedK} - ${counter}`)
		}
	}

	that.showCurrentMemSize = () => {
		const nodeCacheMemSize = that.nodeCache.getCurrentMemSize()
		const satCacheMemSize = that.satCache.getCurrentMemSize()

		console.log((nodeCacheMemSize + satCacheMemSize) / (1024 ** 2), 'MB')
		that.nodeCache.showCurrentMemSize()
		that.satCache.showCurrentMemSize()
	}

	return that
}

export const CE = cachedElements()
export const initCaches = CE.init
export const drawNodes = CE.drawNodes
export const drawSatellites = CE.drawSatellites
export const flushNodes = CE.flushNodes

// TODO: remove that
window.CE = CE