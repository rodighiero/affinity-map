import { select } from 'd3-selection'

import { init as initData } from '../main/init'
import { initKeywords } from '../elements/keywords'
import Map from '../main/map'
import { zoomInit, zoomToExtent } from '../main/zoom'
import config from '../settings/config'

import sidebarFilter from './filter'
import canvasInteractionTool from './canvasInteractionTool'
import displayConfig from './displayConfig'

import state from '../settings/state'


/******************************************************************************
 * A UI object
 ******************************************************************************/
export default () => {
	const that = {
		filter: undefined,
	}

	/******************************************************************************
	 * Given a labSet, update the node visibility to show those included.
	 * If the labSet is empty, show all the nodes.
	 ******************************************************************************/
	const previewLabSet = (graph, labSet) => {
		if (labSet.size > 0) {
			graph.nodes.forEach(n => n.visibility = labSet.has(n.attr.name))
		} else {
			graph.nodes.forEach(n => n.visibility = true)
		}
		that.map.updateImage()
	}

	const onWindowResize = () => {
		const div = document.getElementById('diagram')
		config.screen.width = div.clientWidth * config.screen.density
		config.screen.height = div.clientHeight * config.screen.density
		that.map.setCanvasSize()
		that.map.updateImage()
	}

	that.init = (data) => {

		initData(data)
		initKeywords(data.graph.nodes)
		state.initGraphs(data.graph)

		const { graph } = data

		that.map = Map()

		zoomInit(that.map)
		displayConfig(that.map).init()

		that.filter = sidebarFilter(previewLabSet).init()
		that.filter.setGraph(graph)

		that.cit = canvasInteractionTool(graph).init()

		select('#logo-corner').style('cursor', 'pointer').on('click', () => zoomToExtent(3000))
		window.addEventListener('resize', onWindowResize)
		select(window).on('keyup', (event) => { if (event.keyCode === 9) { document.getElementById('keyword-filter').focus() } })
		select('#spinnerContainer').remove()

		document.getElementById('container').style.cssText = 'display:visible;'
		return that
	}

	return that
}
