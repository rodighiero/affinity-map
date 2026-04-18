export default (previewLabSet) => {
	const that = {}
	let _graph = null
	const active = new Set()

	const allKeywords = () => {
		const all = new Set()
		_graph.nodes.forEach(n => (n.attr.keywords || []).forEach(k => all.add(k)))
		return [...all].sort()
	}

	const matchingLabs = () => {
		if (active.size === 0) return new Set()
		const labSet = new Set()
		_graph.nodes.forEach(n => {
			if ((n.attr.keywords || []).some(k => active.has(k)))
				labSet.add(n.attr.name)
		})
		return labSet
	}

	const makeClearBtn = () => {
		const btn = document.getElementById('kw-clear')
		if (active.size > 0) {
			btn.style.display = 'inline'
		} else {
			btn.style.display = 'none'
		}
	}

	const makeItem = (k) => {
		const li = document.createElement('li')
		if (active.has(k)) li.classList.add('active')

		const cb = document.createElement('input')
		cb.type = 'checkbox'
		cb.id = `kw-${k}`
		cb.checked = active.has(k)
		cb.addEventListener('change', () => {
			cb.checked ? active.add(k) : active.delete(k)
			previewLabSet(_graph, matchingLabs())
			renderList(document.getElementById('keyword-filter')?.value || '')
		})

		const label = document.createElement('label')
		label.htmlFor = `kw-${k}`
		label.textContent = k

		li.appendChild(cb)
		li.appendChild(label)
		return li
	}

	const renderList = (filterText = '') => {
		const list = document.getElementById('keyword-list')
		list.innerHTML = ''
		const lower = filterText.toLowerCase()
		const keywords = allKeywords()

		const activeKws = keywords.filter(k => active.has(k))
		const inactiveKws = keywords.filter(k => !active.has(k) && k.toLowerCase().includes(lower))

		activeKws.forEach(k => list.appendChild(makeItem(k)))

		if (activeKws.length > 0 && inactiveKws.length > 0) {
			const sep = document.createElement('li')
			sep.className = 'kw-separator'
			list.appendChild(sep)
		}

		inactiveKws.forEach(k => list.appendChild(makeItem(k)))

		makeClearBtn()
	}

	that.setGraph = graph => {
		_graph = graph
		if (document.getElementById('keyword-list')) renderList()
	}

	that.reset = () => {
		active.clear()
		previewLabSet(_graph, new Set())
		renderList(document.getElementById('keyword-filter')?.value || '')
	}

	that.init = () => {
		document.getElementById('keyword-filter').addEventListener('input', e => {
			renderList(e.target.value)
		})

		document.getElementById('kw-clear').addEventListener('click', () => {
			that.reset()
		})

		return that
	}

	return that
}
