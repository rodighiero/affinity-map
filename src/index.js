import config from './settings/config'
import UI from './ui/ui'

require('marx-css')

require('../assets/css/mainSpinner.css')
require('../assets/css/general.css')

const json = require('../assets/data.json')

// Defer init until the browser has fully computed layout after CSS injection.
// Without this, setCanvasSize() can read clientWidth=0 on slow connections
// (GitHub Pages), causing zoomToExtent to fit nodes into a narrow canvas.
window.addEventListener('load', () => UI().init(json, true))
