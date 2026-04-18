import config from './settings/config'
import UI from './ui/ui'

require('marx-css')

require('../assets/css/mainSpinner.css')
require('../assets/css/general.css')

const json = require('../assets/data.json')

UI().init(json, true)
