export const ipoints = {
  name: 'luminous.ipoints',
  measurements: [
    'waist',
    'waistBack',
    'hips',
    'seat',
    'seatBack',
    'inseam',
    'waistToSeat',
    'waistToUpperLeg',
    'waistToKnee',
    'waistToHips',
    'waistToFloor',
    'knee',
    'ankle',
    'crossSeam',
    'crossSeamFront',
    'heel',
    'upperLeg',
  ],
  options: {
    size: { pct: 50, min: 10, max: 100, menu: 'fit' },
    crossSeamAngle: 25,
    crotchToKnee: 0.5,
    waistToKneeCP: 0.4,
    kneeToWaistLength: 400,
  },
  draft: ({
    measurements,
    options,
    Point,
    Path,
    points,
    paths,
    Snippet,
    snippets,
    utils,
    log,
    complete,
    sa,
    paperless,
    macro,
    part,
  }) => {
    const ControlPoints = (p1, p2, p3) => {
      const a = Math.abs(p2.angle(p1) - p2.angle(p3)) / 2
      console.log({ ap2_1: p2.angle(p1), ap2_3: p2.angle(p3), a: a })
      return {
        cp1: p2.shift(p2.angle(p1) - a + 90, p2.dist(p1) / 3),
        cp3: p2.shift(p2.angle(p3) + a - 90, p2.dist(p3) / 3),
      }
    }

    const CreateWaistPoint = (m, options, points, utils, front) => {
      const kneeTemp = points.crotch.shiftFractionTowards(points.knee, options.crotchToKnee)
      const angle =
        90 +
        (front
          ? options.crossSeamAngle * (m.waistBack / m.waist)
          : -1 * options.crossSeamAngle * (1 - m.waistBack / m.waist))
      const crossSeam = front ? m.crossSeamFront : m.crossSeam - m.crossSeamFront
      var kneeToWaist = m.waistToKnee
      var ratio = 1
      var waist = kneeTemp.shift(angle, kneeToWaist * ratio)
      const crossSeamCp = utils.beamIntersectsY(kneeTemp, waist, 0)

      console.log({ f: front, a: angle })
      var waistCp
      var diff,
        iter = 0
      do {
        waist = kneeTemp.shift(angle, kneeToWaist * ratio * (ratio < 1 ? 1.05 : 0.95))
        waistCp = waist.shiftFractionTowards(kneeTemp, options.waistToKneeCP)

        const crossSeamPath = new Path().move(points.crotch).curve(crossSeamCp, waistCp, waist)

        diff = crossSeam - crossSeamPath.length()
        ratio = crossSeam / crossSeamPath.length()
        console.log({ i: iter, d: diff, r: ratio })
      } while (++iter < 100 && (diff > 1 || diff < -1))
      if (iter >= 100) {
        console.log('Too many iterations trying to make it fit!')
        // log.error('Too many iterations trying to make it fit!')
      }

      if (front) {
        points.waistFront = waist.clone()
        points.waistFrontCp = waistCp.clone()
        points.crossSeamFrontCp = crossSeamCp.clone()
      } else {
        points.waistBack = waist.clone()
        points.waistBackCp = waistCp.clone()
        points.crossSeamBackCp = crossSeamCp.clone()
      }
    }

    const m = measurements
    const crotchOffset = m.waistToFloor - m.inseam

    const waistFrontBackRatio = m.waistBack / m.waist

    console.log({ m: JSON.parse(JSON.stringify(m)) })
    console.log({ wfr: waistFrontBackRatio })
    // points.origin = new Point(0, 0)
    // points.knee = points.origin.shift(270, m.inseam - (m.waistToFloor - m.waistToKnee))
    // points.ankle = points.origin.shift(270, m.inseam - (m.ankle / Math.PI))
    // points.waist = points.origin.shift(90, m.waistToFloor - m.inseam)

    points.crotch = new Point(0, 0)
    points.knee = points.crotch.shift(270, m.waistToKnee - crotchOffset)
    points.ankle = points.crotch.shift(270, m.inseam - m.heel / Math.PI)
    points.floor = points.crotch.shift(270, m.inseam)

    // points.waistTemp = points.crotch.shiftFractionTowards(points.knee,options.crotchToKnee).shift(90 + options.crossSeamAngle*(m.waistBack/m.waist), options.kneeToWaistLength)
    // paths.waistTemp = new Path()
    // .move(points.crotch.shiftFractionTowards(points.knee,options.crotchToKnee))
    // .line(points.waistTemp)
    // points.crotchFrontCp = utils.beamIntersectsY(points.kneeTemp,points.waistTempFront,0)
    // points.crotchBackCp = utils.beamIntersectsY(points.kneeTemp,points.waistTempBack,0)

    CreateWaistPoint(m, options, points, utils, true)
    CreateWaistPoint(m, options, points, utils, false)

    // paths.waistTempCp = new Path()
    // .move(points.crotch)
    // .line(points.crossSeamFrontCp)

    console.log({ pionts: JSON.parse(JSON.stringify(points)) })

    paths.middle = new Path().move(points.crotch).line(points.floor)

    paths.crossSeamFront = new Path()
      .move(points.crotch)
      .curve(points.crossSeamFrontCp, points.waistFrontCp, points.waistFront)
    paths.crossSeamBack = new Path()
      .move(points.crotch)
      .curve(points.crossSeamBackCp, points.waistBackCp, points.waistBack)

    let csFront = paths.crossSeamFront.length()
    let csBack = paths.crossSeamBack.length()

    console.log({ csf: m.crossSeamFront, csFront: csFront })

    const waistAngle = utils.rad2deg(
      Math.asin((points.waistBack.y - points.waistFront.y) / (m.waist / 2))
    )

    points.seatFront = paths.crossSeamFront.shiftAlong(
      m.crossSeamFront * (m.waistToSeat / m.waistToUpperLeg)
    )
    points.seatFrontSeam = points.seatFront.shift(180 - waistAngle, (m.seat - m.seatBack) / 2)
    points.seatBack = paths.crossSeamBack.shiftAlong(
      m.crossSeamBack * (m.waistToSeat / m.waistToUpperLeg)
    )
    points.seatBackSeam = points.seatBack.shift(waistAngle, m.seatBack / 2)

    points.waistBackSeam = points.waistBack.shift(waistAngle, m.waistBack / 2)
    points.waistFrontSeam = points.waistFront.shift(180 - waistAngle, (m.waist - m.waistBack) / 2)
    points.upperLegFront = points.crotch.shift(180, m.upperLeg / 2)
    points.upperLegBack = points.crotch.shift(0, m.upperLeg / 2)
    points.kneeFront = points.knee.shift(180, m.knee / 2)
    points.kneeBack = points.knee.shift(0, m.knee / 2)
    points.ankleFront = points.ankle.shift(180, m.ankle / 2)
    points.ankleBack = points.ankle.shift(0, m.ankle / 2)

    paths.front = new Path()
      .move(points.ankleFront)
      .line(points.kneeFront)
      .line(points.upperLegFront)
      .line(points.seatFrontSeam)
      .line(points.waistFrontSeam)
    paths.back = new Path()
      .move(points.ankleBack)
      .line(points.kneeBack)
      .line(points.upperLegBack)
      .line(points.seatBackSeam)
      .line(points.waistBackSeam)

    console.log({ pahts: JSON.parse(JSON.stringify(paths)) })
    console.log({ pins: JSON.parse(JSON.stringify(points)) })

    return part
  },
}
