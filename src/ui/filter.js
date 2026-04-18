import Choices from 'choices.js'
import 'choices.js/public/assets/styles/choices.min.css'
import 'choices.js/public/assets/styles/base.min.css'

import { zoomToLab } from '../main/zoom'

export default (previewLabSet, filterLabs) => {
	const that = { highlighted: [], items: [], previousFilters: [] }

	const cats = {
		inst: 'inst',
		lab: 'lab',
	}
	const invCats = Object.keys(cats).reduce((o, k) => ({ ...o, [cats[k]]: k }), {})
	const catNames = {
		inst: ['Institute', 'Institutes'],
		lab: ['Zoom to Laboratory', 'Laboratories'],
	}

	const buildChoices = () => {
		if (!that.graph) return

		const nodes = that.graph.nodes

		// Group nodes by institute
		const institutes = nodes.reduce((o, node) => {
			const inst = node.attr.institute || 'Other'
			if (!o[inst]) o[inst] = []
			o[inst].push(node.attr.name)
			return o
		}, {})

		that.choices = [
			{
				label: catNames.inst[1],
				id: 0,
				disabled: false,
				choices: Object.entries(institutes)
					.sort((a, b) => a[0].localeCompare(b[0]))
					.map(([inst, labs]) => ({
						value: inst,
						label: inst,
						customProperties: { cat: 'inst', labs },
					})),
			},
			{
				label: catNames.lab[1],
				id: 1,
				disabled: false,
				choices: [...nodes]
					.sort((a, b) => a.attr.name.localeCompare(b.attr.name))
					.map(node => ({
						value: node.attr.name,
						label: node.attr.enName || node.attr.name,
						customProperties: { notItemize: true, cat: 'lab', labs: [node.attr.name], acronym: node.attr.name },
					})),
			},
		]

		that.multipleDefault.setChoices(that.choices, 'value', 'label', true)
	}

	const validateFilters = () => {
		if (that.graph && that.choices) {
			const set = that.graph.nodes.reduce((o, v) => o.add(v.attr.name), new Set())
			that.choices = that.choices.map(v => ({
				...v,
				choices: v.choices.filter(o => o.customProperties.labs.some(l => set.has(l))),
			}))
			that.multipleDefault.setChoices(that.choices, 'value', 'label', true)
		}
	}

	const callbackOnCreateTemplates = function (template) {
		return {
			// v11: template functions receive (config, data, ...) not just (data)
			item: (config, data) => {
				const { classNames } = config
				return template(`
					<div class="${classNames.item} ${data.highlighted ? classNames.highlightedState : classNames.itemSelectable}" data-item data-id="${data.id}" data-value="${data.value}" ${data.active ? 'aria-selected="true"' : ''} ${data.disabled ? 'aria-disabled="true"' : ''}>
						${data.customProperties ? invCats[data.customProperties.cat] + ': ' : ''}${data.label}
						<span class="choices__button" data-button aria-label="Remove item: '${data.value}'">x</span>
					</div>
				`)
			},
			choice: (config, data) => {
				const { classNames } = config
				return template(`
					<div class="${classNames.item} ${classNames.itemChoice} ${data.disabled ? classNames.itemDisabled : classNames.itemSelectable}" data-choice ${data.disabled ? 'data-choice-disabled aria-disabled="true"' : 'data-choice-selectable'} data-id="${data.id}" data-value="${data.value}" ${data.groupId > 0 ? 'role="treeitem"' : 'role="option"'}>
						${data.label}${data.customProperties && data.customProperties.acronym ? ` <span class="labacronym">${data.customProperties.acronym}</span>` : ''}
					</div>
				`)
			},
		}
	}

	const previewCPArray = cpa => {
		const labSet = cpa.reduce((o, v) => v.customProperties.labs.reduce((o, v) => o.add(v), o), new Set())
		previewLabSet(that.graph, labSet)
	}

	const previewHighlighted = () => previewCPArray(that.highlighted)
	const previewItems = () => previewCPArray(that.items)

	const createFormula = () =>
		that.previousFilters.map(pf => {
			if (pf.length === 1) return `${invCats[pf[0].customProperties.cat]}:${pf[0].label}`
			return `(${pf.map(v => `${invCats[v.customProperties.cat]}:${v.label}`).join(' ∪ ')})`
		}).join(' ∩ ')

	const refreshButtons = () => {
		document.getElementById('validate').disabled = that.items.length === 0
		document.getElementById('reset').disabled = that.previousFilters.length === 0
	}

	const onHighlightItem = ({ detail }) => {
		that.highlighted.push(detail)
		previewHighlighted()
	}

	const onUnhighlightItem = ({ detail }) => {
		const i = that.highlighted.findIndex(e => e.value === detail.value && e.groupValue === detail.groupValue)
		that.highlighted.splice(i, 1)
		if (that.highlighted.length) previewHighlighted()
		else previewItems()
	}

	const onHighlightChoice = () => {
		// v11: highlightChoice event no longer includes choice data, skip preview on hover
	}

	const onAddItem = e => {
		if (e.detail.customProperties.notItemize) {
			zoomToLab(that.graph, e.detail.customProperties.labs[0])
			that.multipleDefault.hideDropdown()
		} else {
			that.items.push(e.detail)
		}
		refreshButtons()
	}

	const onRemoveItem = ({ detail }) => {
		that.items.splice(that.items.findIndex(e => e.value === detail.value && e.groupValue === detail.groupValue), 1)
		refreshButtons()
		previewItems()
	}

	const onHideDropdown = () => previewItems()

	const onValidate = () => {
		if (!that.items.length) return

		const labSet = that.items.reduce((o, v) => v.customProperties.labs.reduce((o, v) => o.add(v), o), new Set())
		filterLabs(that.graph, labSet)
		that.previousFilters.push(that.items)
		that.items = []

		const unionLabs = filters => filters.reduce((o, v) => v.customProperties.labs.reduce((o, v) => o.add(v), o), new Set())
		const gLabSet = that.previousFilters.slice(1).reduce((o, v) =>
			[...unionLabs(v)].reduce((ret, v) => { if (o.has(v)) ret.add(v); return ret }, new Set()),
			unionLabs(that.previousFilters[0]))

		that.choices.forEach(cat => {
			cat.choices.forEach(choice => {
				choice.disabled = !choice.customProperties.labs.some(lab => gLabSet.has(lab))
			})
		})

		that.multipleDefault.removeActiveItems()
		that.multipleDefault.setChoices(that.choices, 'value', 'label', true)
		document.getElementById('formula').innerText = `Current filter(s): ${createFormula()}`
		refreshButtons()
		that.multipleDefault.clearInput()
	}

	const attachEventListeners = () => {
		const el = that.multipleDefault.passedElement.element
		el.addEventListener('highlightItem', onHighlightItem, false)
		el.addEventListener('unhighlightItem', onUnhighlightItem, false)
		el.addEventListener('highlightChoice', onHighlightChoice, false)
		el.addEventListener('addItem', onAddItem, false)
		el.addEventListener('removeItem', onRemoveItem, false)
		el.addEventListener('hideDropdown', onHideDropdown, false)
		document.getElementById('validate').addEventListener('click', onValidate, false)
	}

	that.init = () => {
		that.multipleDefault = new Choices(
			document.getElementById('choices-multiple-groups'),
			{
				placeholder: true,
				placeholderValue: 'Search labs or filter by institute…',
				removeItemButton: true,
				callbackOnCreateTemplates,
				searchResultLimit: 1000,
				shouldSort: false,
			})
		attachEventListeners()
		return that
	}

	that.reinit = () => {
		buildChoices()
	}

	that.setGraph = graph => {
		that.graph = graph
		buildChoices()
		return that
	}

	that.reset = () => {
		that.choices.forEach(cat => cat.choices.forEach(choice => { choice.disabled = false }))
		that.multipleDefault.setChoices(that.choices, 'value', 'label', true)
		that.previousFilters = []
		document.getElementById('formula').innerText = ''
		refreshButtons()
		that.multipleDefault.removeActiveItems()
		return that
	}

	return that
}
