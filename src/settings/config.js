export default {
	years:[2017],
	// Node configuration
	node: {
		arc: {
			max: 2,
		},
		distance: 110,
		gap: 2,
		min: .1,
		max: 8,
		radius: 55,
		scholarThickness: 4,
	},

	// Satellite configuration
	satellite: {
		width: {
			empty: .2,
			gap: .2,
			min: .2,
			max: 3,
		},
		radius: 3,
	},

	// Screen information
	screen: {
		width: null,
		height: null,
		density: 1,
	},

	// Graphical elements visibility
	visibility: {
		acronym: true,
		chords: true,
		filter: true,
		individuals: true,
		keywords: true,
		links: true,
		nodes: true,
		satellites: true,
		headNames: true,
		labNames: true,
		orbits: true,
	},

	// Zoom settings
	zoom: {
		min: .1,
		init: .3,
		visibility: 2,
		finder: 5,
	},

}