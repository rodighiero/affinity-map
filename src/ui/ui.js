import { select } from 'd3-selection'

import { init as initData } from '../main/init'
import Map from '../main/map'
import { zoomInit, zoomToExtent } from '../main/zoom'
import config from '../settings/config'

// import choicesFilterTool from './filter'
import canvasInteractionTool from './canvasInteractionTool'
import displayConfig from './displayConfig'
import yearSlider from './yearSlider'

import a from '../tools/affinities'
import state from '../settings/state'


/******************************************************************************
 * A UI object
 ******************************************************************************/
export default () => {
	const that = {
		cft: undefined,
	}

	/******************************************************************************
	 * Construct the checkboxes to enable/disable the affinities in the map.
	 ******************************************************************************/
	const checkboxes = map => {
		let sel = select('div#toggle-btn').selectAll('label').data(a.orderedAcronyms())

		const newLabel = sel.enter().append('div')

		const inputs = newLabel.append('input')
			.attr('type', 'checkbox')
			.attr('class', 'tgl tgl-ios')
			.attr('id', d => a.name(d) + '-btn')
			.property('checked', d => a.defaultStatus(d))

		newLabel.append('label')
			.attr('class', 'tgl-btn')
			.attr('for', d => a.name(d) + '-btn')

		newLabel.append('text')
			.text(d => ' ' + a.name(d).slice(0, 1).toUpperCase() + a.name(d).slice(1))

		inputs.on('change', function (event, d) {
			const inputValue = select(this).property('checked')
			state.activation[d] = inputValue
			map.restart()
		})

	}

	/******************************************************************************
	 * Apply filter to the network
	 ******************************************************************************/
	const filterLabs = (graph, labSet) => {
		state.epGraph.links = state.epGraph.links.filter(l => {
			const sourceNode = typeof l.source === 'string' ? graph.nodes.find(o => o.attr.name === l.source) : l.source
			const targetNode = typeof l.target === 'string' ? graph.nodes.find(o => o.attr.name === l.target) : l.target

			return labSet.has(targetNode.attr.name) && labSet.has(sourceNode.attr.name)
		})
		state.epGraph.nodes = state.epGraph.nodes.filter(n => labSet.has(n.attr.name))

		state.enGraph.links = state.epGraph.links.filter(l => l.target.attr.faculty === 'ENAC' && l.source.attr.faculty === 'ENAC')
		state.enGraph.nodes = state.epGraph.nodes.filter(n => n.attr.faculty === 'ENAC')

		that.map.restart()
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

	/******************************************************************************
	 * Get an eventListener to handle window.onResize events
	 ******************************************************************************/
	const onWindowResize = () => {
		const div = document.getElementById('diagram')

		config.screen.width = div.clientWidth * config.screen.density
		config.screen.height = div.clientHeight * config.screen.density

		// TODO : re-activate
		that.map.setCanvasSize()
		that.map.updateImage()
	}

	/******************************************************************************
	 * Modal button for credits
	 ******************************************************************************/

	const modal = document.getElementById('credits')
	// const btn = document.getElementById('readMore')
	const close = document.getElementById('credits-close-btn')

	const aboutBtn = document.getElementById('about')
	const usrGd = document.getElementById('usrGd')
	const readM = document.getElementById('readM')
	const feedb = document.getElementById('feedb')

	close.onclick = () => modal.style.display = 'none'


	const modalClick = dp => {

		// about is now a button
		select('#about').on('click', () => {
			modal.style.display = 'block'
			dp.closePanel()

			document.getElementById('credits-close-btn').scrollIntoView()
		})

		window.onclick = event => {
			if (event.target === modal) {
				modal.style.display = 'none'
			} else {

				switch (event.target) {
					case aboutBtn: {
						modal.style.display = 'block'
						dp.closePanel()

						document.getElementById('credits-close-btn').scrollIntoView()
						break
					}
					case usrGd: {
						modal.style.display = 'block'
						dp.closePanel()

						document.getElementById('2userguide').scrollIntoView()
						break
					}
					case readM: {
						modal.style.display = 'block'
						dp.closePanel()

						document.getElementById('3readingthemap').scrollIntoView()
						break
					}
					case feedb: {
						modal.style.display = 'block'
						dp.closePanel()
						document.getElementById('4feedbacksuggestedonlyforenacresearchers').scrollIntoView()
						break
					}
				}
			}
		}

	}

	/******************************************************************************
	 * Finish the UI initialization, once the data are arrived
	 ******************************************************************************/
	// const resetFilter = () => {
	// 	state.initGraphs(state.initialGraph)

	// 	that.map.restart()
	// 	that.cft.reset()
	// }

	that.reInit = data => {
		state.initGraphs(data.graph)
		state.init(data)

		that.map.hardStopAnimation()
		that.map.init().start()

		if (that.cft) { 
			that.cft.reinit(that.privateAccess)
			that.cft.setGraph(data.graph) 
		}

		document.getElementById('container').style.cssText = 'display:visible;'
	}

	that.init = (data, privateAccess) => {

		console.log(privateAccess)

		initData(data)
		
		state.initGraphs(data.graph)

		const { graph } = data

		that.privateAccess = privateAccess

		if (config.visibility.filter && !config.client.isMobile) {
			// that.cft = choicesFilterTool(previewLabSet, filterLabs).init(privateAccess)
		} else { document.getElementById('input_bar').style = 'display:none' }

		// yearSlider(data.description.availableYears).init(that)
		
		that.map = Map()

		checkboxes(that.map)
		zoomInit(that.map)

		const dp = displayConfig(that.map, privateAccess).init()
		modalClick(dp)

		if (that.cft) { that.cft.setGraph(graph) }
		that.cit = canvasInteractionTool(graph).init()

		// set the reset button onClick callback
		select('#fullextent').on('click', () => zoomToExtent(3000))
		select('#reset').on('click', () => resetFilter(graph))
		// show all div hidden until ui is intitialized
		window.addEventListener('resize', onWindowResize)
		select(window).on('keyup', (event) => { if (event.keyCode === 9) { select('input[type=text]').node().focus() } })
		select('#spinnerContainer').remove()

		document.getElementById('container').style.cssText = 'display:visible;'
		return that
	}

	return that
}