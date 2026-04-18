export default {
	// Node configuration
	node: {
		arc: {
			max: 1.5,
		},
		distance: 130,
		gap: .8,
		min: .2,
		max: 6,
		radius: 55,
		scholarThickness: 2,
	},

	// Satellite configuration
	satellite: {
		width: {
			empty: .2,
			gap: .3,
			min: .2,
			max: 2,
		},
		radius: 4,
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