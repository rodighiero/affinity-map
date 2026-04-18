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
		radius: 70,
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

	// Feature flags
	visibility: {
		filter: true,
		keywords: true,
	},

	// Zoom settings
	zoom: {
		min: .1,
		init: .3,
		visibility: 2,
		finder: 5,
	},

}