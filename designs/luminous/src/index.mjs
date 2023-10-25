//

import { Design } from '@freesewing/core'
import { i18n } from '../i18n/index.mjs'
import { data } from '../data.mjs'
// Parts
import { points } from './points.mjs'
import { ipoints } from './ipoints.mjs'
import { zpoints } from './zpoints.mjs'

// Create new design
const Luminous = new Design({
  data,
  parts: [/*points, ipoints,*/ zpoints],
})

// Named exports
export { /*points, ipoints,*/ zpoints, i18n, Luminous }

// http://localhost:8000/new/luminous#view=%22inspect%22&settings=%7B%22measurements%22%3A%7B%22waist%22%3A960%2C%22waistBack%22%3A440%2C%22hips%22%3A884%2C%22seat%22%3A980%2C%22seatBack%22%3A490%2C%22inseam%22%3A790%2C%22waistToSeat%22%3A230%2C%22waistToUpperLeg%22%3A280%2C%22waistToKnee%22%3A610%2C%22waistToHips%22%3A120%2C%22waistToFloor%22%3A1090%2C%22knee%22%3A415%2C%22ankle%22%3A230%2C%22crossSeam%22%3A800%2C%22crossSeamFront%22%3A380%2C%22heel%22%3A300%2C%22upperLeg%22%3A640%7D%7D
