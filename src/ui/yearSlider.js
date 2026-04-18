/**
 * Generate and manage the slider which allow to select the shown years.
 * 
 * TODO: is should have a different behaviour on mobile.
 */
import { min, max, range } from 'd3-array'
import noUiSlider from 'nouislider'
import 'nouislider/dist/nouislider.min.css'

import { CE } from '../elements/cachedElements'
import config from '../settings/config'
import { init } from '../main/init'

import '../../assets/css/slider.css'
import spinner from './spinner'

export default availableYears => {
	const that = {}

	const startYear = min(availableYears)
	const endYear = max(availableYears)

	const range_all_sliders = {
		'min': startYear,
		'max': endYear + 1,
	}
	let ui = undefined

	const onChangeListener = function () {
		const origVals = this.get().map(parseFloat)
		const vals = origVals.map(v => Math.round(v))
		const sYear = min(config.years)
		const eYear = max(config.years)

		// wet smooth the position to an integer values
		if (!origVals.every((v, i) => v === vals[i])) { this.set(vals) }

		// new values need to update the map
		if (vals[0] !== sYear || vals[1] !== eYear + 1) {
			config.years = range(vals[0], vals[1])

			spinner.start('fetching')
			fetch(`/api/${ui.privateAccess ? 'private' : 'public'}/network?years=${config.years}`, { credentials: 'include' }).then(d => d.json())
				.then(resp => {
					spinner.stop('fetching')
					const data = resp.result
					init(data)

					CE.flushNodes()

					ui.reInit(data)
				})
		}

	}

	const constructStandardSlider = () => {
		const behaviourSlider = document.getElementById('behaviour')

		noUiSlider
			.create(behaviourSlider, {
				start: [endYear, endYear + 1],
				animate: true,
				margin: 1,
				behaviour: 'drag-snap',
				orientation: 'vertical',
				connect: true,
				pips: {
					mode: 'positions',
					values: [0, 33, 66, 100],
					density: 50,
				},
				range: range_all_sliders,
			})
			.on('change.one', onChangeListener)

	}

	that.init = pUi => {
		ui = pUi
		constructStandardSlider()
	}

	return that
}