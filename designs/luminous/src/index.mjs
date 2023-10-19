//

import { Design } from '@freesewing/core'
import { i18n } from '../i18n/index.mjs'
import { data } from '../data.mjs'
// Parts
import { points } from './points.mjs'
import { ipoints } from './ipoints.mjs'

// Create new design
const Luminous = new Design({
  data,
  parts: [points, ipoints],
})

// Named exports
export { points, ipoints, i18n, Luminous }
