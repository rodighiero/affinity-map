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

	const renderList = (filterText = '') => {
		const list = document.getElementById('keyword-list')
		list.innerHTML = ''
		const lower = filterText.toLowerCase()
		allKeywords()
			.filter(k => k.toLowerCase().includes(lower))
			.forEach(k => {
				const li = document.createElement('li')

				const cb = document.createElement('input')
				cb.type = 'checkbox'
				cb.id = `kw-${k}`
				cb.checked = active.has(k)
				cb.addEventListener('change', () => {
					cb.checked ? active.add(k) : active.delete(k)
					previewLabSet(_graph, matchingLabs())
				})

				const label = document.createElement('label')
				label.htmlFor = `kw-${k}`
				label.textContent = k

				li.appendChild(cb)
				li.appendChild(label)
				list.appendChild(li)
			})
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
		const toggle = document.getElementById('sidebar-toggle')
		const sidebar = document.getElementById('sidebar')

		toggle.addEventListener('click', () => {
			sidebar.classList.toggle('open')
			toggle.textContent = sidebar.classList.contains('open') ? '‹' : '›'
		})

		document.getElementById('keyword-filter').addEventListener('input', e => {
			renderList(e.target.value)
		})

		return that
	}

	return that
}
