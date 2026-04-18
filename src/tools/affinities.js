const state = {
	acronyms: [],
	affinities: [],
	names: [],
	keyDescription: {},
}

export default {
	init(affinities) {
		state.acronyms = affinities.map(desc => desc.acronym).sort()
		state.names = affinities.map(desc => desc.name)
		state.keyDescription = affinities.reduce((o, desc) => {
			return { ...o, [desc.acronym]: desc }
		}, {})
		state.affinities = affinities

		state.orderedAcronyms = affinities.sort((a,b)=>{return a.order-b.order}).map(desc => desc.acronym)
	},
	acronyms() {
		return state.acronyms
	},
	name(i) {
		if (typeof i === 'string') {
			return state.keyDescription[i].name
		} else { return state.names[i] }
	},
	names(){
		return state.names
	},
	defaultStatus(i) {
		return state.keyDescription[i].default
	},

	visibleAcronyms(){
		return state.acronyms
	},
	satelliteAcronyms(){
		return state.affinities.filter(a => a.satellite !== false).map(a => a.acronym)
	},
	reverseSatelliteAcronyms(){
		return state.affinities.filter(a => a.satellite !== false).map(a => a.acronym).reverse()
	},
	reverseVisibleAcronyms(){
		if( state.rvisibleAffs ){
			return state.rvisibleAffs
		} else {
			state.rvisibleAffs =  [...state.acronyms].reverse()
			return state.rvisibleAffs
		}
	},
	orderedAcronyms(){
		return state.orderedAcronyms
	},
}
