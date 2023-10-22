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
    ease: { pct: -20, min: -35, max: 10, menu: 'fit' },
    crossSeamAngle: 35,
    crotchToKnee: 0.4,
    waistToKneeCP: 0.4,
    kneeToWaistLength: 400,
    crotchPointsCP: 2,
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
    const ControlPoints = (p1, p2, p3, t) => {
      let a = Math.abs(p2.angle(p1) - p2.angle(p3)) / 2
      console.log({ t: t, ap2_1: p2.angle(p1), ap2_3: p2.angle(p3), a: a })
      const t1 = p2.shift(p2.angle(p1) + a - 90, p2.dist(p1) / 3)
      const t3 = p2.shift(p2.angle(p3) - a + 90, p2.dist(p3) / 3)
      console.log({ t: t, ap2_t1: p2.angle(t1), ap2_t3: p2.angle(t3), a: a })
      return {
        cp1: p2.shift(p2.angle(p1) + a - 90, p2.dist(p1) / 3),
        cp3: p2.shift(p2.angle(p3) - a + 90, p2.dist(p3) / 3),
      }
    }
    const CreateControlPoints = (names) => {
      for (var i = 1; i < names.length - 1; i++) {
        var cp = ControlPoints(points[names[i - 1]], points[names[i]], points[names[i + 1]])
        points[names[i] + 'Cp1'] = cp.cp1
        points[names[i] + 'Cp2'] = cp.cp3
      }
    }
    const CreatePath = (pathName, names) => {
      console.log({ i: 1, n: names[1], p2: points[names[1] + 'Cp2'], p3: points[names[1]] })
      paths[pathName] = new Path()
        .move(points[names[0]])
        ._curve(points[names[1] + 'Cp1'], points[names[1]])
      for (var i = 2; i < names.length - 1; i++) {
        console.log({
          i: i,
          n: names[i],
          p1: points[names[i - 1] + 'Cp1'],
          p2: points[names[i] + 'Cp2'],
          p3: points[names[i]],
        })
        paths[pathName].curve(
          points[names[i - 1] + 'Cp2'],
          points[names[i] + 'Cp1'],
          points[names[i]]
        )
      }
      console.log({ i: i, n: names[i], p2: points[names[i] + 'Cp2'], p3: points[names[i]] })
      paths[pathName].curve_(points[names[i - 1] + 'Cp2'], points[names[i]])
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
      const crossSeamCp = points.crotch.shiftFractionTowards(
        utils.beamIntersectsY(kneeTemp, waist, 0),
        options.crotchPointsCP
      )

      console.log({ f: front, a: angle })
      var waistCp
      var diff,
        iter = 0
      do {
        waist = kneeTemp.shift(angle, kneeToWaist * ratio * (ratio < 1 ? 1.05 : 0.95))
        // waistCp = waist.shiftFractionTowards(kneeTemp, options.waistToKneeCP)
        waistCp = waist.shiftFractionTowards(points.knee, options.waistToKneeCP)

        const crossSeamPath = new Path().move(points.crotch).curve(crossSeamCp, waistCp, waist)

        diff = crossSeam - crossSeamPath.length()
        ratio = crossSeam / crossSeamPath.length()
        // console.log({ i: iter, d: diff, r: ratio })
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
    const sideRatio = 3 / 5
    const ease = options.ease + 1

    m['waistToAnkle'] = m.waistToFloor - m.heel / Math.PI

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

    console.log({
      r: m.crossSeamFront / m.waistToUpperLeg,
      S: m.waistToSeat * (m.crossSeamFront / m.waistToUpperLeg),
      H: m.waistToHips * (m.crossSeamFront / m.waistToUpperLeg),
    })
    points.seatFront = paths.crossSeamFront
      .reverse()
      .shiftAlong(m.waistToSeat /* * (m.crossSeamFront / m.waistToUpperLeg) */)
      .addCircle(6)
    points.hipsFront = paths.crossSeamFront
      .reverse()
      .shiftAlong(m.waistToHips /* * (m.crossSeamFront / m.waistToUpperLeg) */)
      .addCircle(10)
    points.seatBack = paths.crossSeamBack
      .reverse()
      .shiftAlong(m.waistToSeat /* * (m.waistToSeat / m.waistToUpperLeg) */)
      .addCircle(6)
    points.hipsBack = paths.crossSeamBack
      .reverse()
      .shiftAlong(m.waistToHips /* * (m.waistToSeat / m.waistToUpperLeg) */)
      .addCircle(10)

    points.waistFrontSeam = points.waistFront.shift(
      180 + waistAngle,
      ((m.waist - m.waistBack) * ease) / 2
    )
    points.waistBackSeam = points.waistBack.shift(waistAngle, (m.waistBack * ease) / 2)
    points.seatFrontSeam = points.seatFront.shift(
      180 + waistAngle,
      ((m.seat - m.seatBack) * ease) / 2
    )
    points.seatBackSeam = points.seatBack.shift(waistAngle, (m.seatBack * ease) / 2)
    points.upperLegFrontSeam = points.crotch.shift(180 + waistAngle, (m.upperLeg * ease) / 2)
    points.upperLegBackSeam = points.crotch.shift(waistAngle, (m.upperLeg * ease) / 2)
    points.kneeFrontSeam = points.knee.shift(180, (m.knee * ease) / 2)
    points.kneeBackSeam = points.knee.shift(0, (m.knee * ease) / 2)
    points.ankleFrontSeam = points.ankle.shift(180, (m.ankle * ease) / 2)
    points.ankleBackSeam = points.ankle.shift(0, (m.ankle * ease) / 2)

    const sideFixed = points.waistFrontSeam.dist(
      points.waistFront.shiftFractionTowards(points.waistFrontSeam, sideRatio)
    )
    // points.waistFrontSplit = points.waistFront.shiftFractionTowards(points.waistFrontSeam, sideRatio)
    points.waistFrontSplit = points.waistFrontSeam.shiftTowards(points.waistFront, sideFixed)
    // points.waistBackSplit = points.waistBack.shiftFractionTowards(points.waistBackSeam, sideRatio)
    points.waistBackSplit = points.waistBackSeam.shiftTowards(points.waistBack, sideFixed)
    points.seatFrontSplit = points.seatFrontSeam.shiftTowards(points.seatFront, sideFixed)
    points.seatBackSplit = points.seatBackSeam.shiftTowards(points.seatBack, sideFixed)
    // points.upperLegFrontSplit = points.crotch.shiftFractionTowards(points.upperLegFront, sideRatio)
    points.upperLegFrontSplit = points.upperLegFrontSeam.shiftTowards(points.crotch, sideFixed)
    // points.upperLegBackSplit = points.crotch.shiftFractionTowards(points.upperLegBack, sideRatio)
    points.upperLegBackSplit = points.upperLegBackSeam.shiftTowards(points.crotch, sideFixed)
    points.kneeFrontSplit = points.knee.shiftFractionTowards(points.kneeFrontSeam, sideRatio)
    // points.kneeFrontSplit = points.kneeFront.shiftTowards(points.knee, sideFixed)
    points.kneeBackSplit = points.knee.shiftFractionTowards(points.kneeBackSeam, sideRatio)
    // points.kneeBackSplit = points.kneeBack.shiftTowards(points.knee, sideFixed)
    points.ankleFrontSplit = points.ankle.shiftFractionTowards(points.ankleFrontSeam, sideRatio)
    // points.ankleFrontSplit = points.ankleFront.shiftTowards(points.ankle, sideFixed)
    points.ankleBackSplit = points.ankle.shiftFractionTowards(points.ankleBackSeam, sideRatio)
    // points.ankleBackSplit = points.ankleBack.shiftTowards(points.ankle, sideFixed)

    CreateControlPoints([
      'waistFrontSplit',
      // 'seatFrontSplit',
      'upperLegFrontSplit',
      'kneeFrontSplit',
      'ankleFrontSplit',
    ])

    CreatePath('frontSplit', [
      'waistFrontSplit',
      // 'seatFrontSplit',
      'upperLegFrontSplit',
      'kneeFrontSplit',
      'ankleFrontSplit',
    ])

    CreateControlPoints([
      'waistBackSplit',
      // 'seatBackSplit',
      'upperLegBackSplit',
      'kneeBackSplit',
      'ankleBackSplit',
    ])

    CreatePath('BackSplit', [
      'waistBackSplit',
      // 'seatBackSplit',
      'upperLegBackSplit',
      'kneeBackSplit',
      'ankleBackSplit',
    ])

    points.seatFrontSplit = utils
      .beamIntersectsCurve(
        points.seatFront,
        points.seatFrontSeam,
        points.waistFrontSplit,
        points.waistFrontSplit,
        points.upperLegFrontSplitCp1,
        points.upperLegFrontSplit
      )
      .addCircle(8)
    points.seatBackSplit = utils
      .beamIntersectsCurve(
        points.seatBack,
        points.seatBackSeam,
        points.waistBackSplit,
        points.waistBackSplit,
        points.upperLegBackSplitCp1,
        points.upperLegBackSplit
      )
      .addCircle(8)

    // var cp = ControlPoints(points.waistFrontSplit, points.upperLegFrontSplit, points.kneeFrontSplit)
    // points.upperLegFrontCp1 = cp.cp1
    // points.upperLegFrontCp2 = cp.cp3
    // cp = ControlPoints(points.waistBackSplit, points.upperLegBackSplit, points.kneeBackSplit)
    // points.upperLegBackCp1 = cp.cp1
    // points.upperLegBackCp2 = cp.cp3
    // cp = ControlPoints(points.upperLegFrontSplit, points.kneeFrontSplit, points.ankleFrontSplit)
    // points.kneeFrontCp1 = cp.cp1
    // points.kneeFrontCp2 = cp.cp3
    // cp = ControlPoints(points.upperLegBackSplit, points.kneeBackSplit, points.ankleBackSplit)
    // points.kneeBackCp1 = cp.cp1
    // points.kneeBackCp2 = cp.cp3

    console.log({ pins: JSON.parse(JSON.stringify(points)) })

    paths.front = new Path()
      .move(points.ankleFrontSeam)
      .line(points.kneeFrontSeam)
      .line(points.upperLegFrontSeam)
      .line(points.seatFrontSeam)
      .line(points.waistFrontSeam)
    paths.back = new Path()
      .move(points.ankleBackSeam)
      .line(points.kneeBackSeam)
      .line(points.upperLegBackSeam)
      .line(points.seatBackSeam)
      .line(points.waistBackSeam)

    paths.frontZ = paths.front.reverse()
    points.seatZ = paths.frontZ.shiftAlong(m.waistToSeat).addCircle(4)
    points.hipsZ = paths.frontZ.shiftAlong(m.waistToHips).addCircle(4)
    points.upperLegZ = paths.frontZ.shiftAlong(m.waistToUpperLeg).addCircle(4)
    points.kneeZ = paths.frontZ.shiftAlong(m.waistToKnee).addCircle(4)
    points.ankleZ = paths.frontZ
      .shiftAlong(m.waistToFloor - points.floor.dist(points.ankle))
      .addCircle(4)

    paths.backZ = paths.back.reverse()
    points.seatZback = paths.backZ.shiftAlong(m.waistToSeat).addCircle(4)
    points.hipsZback = paths.backZ.shiftAlong(m.waistToHips).addCircle(4)
    points.upperLegZback = paths.backZ.shiftAlong(m.waistToUpperLeg).addCircle(4)
    points.kneeZback = paths.backZ.shiftAlong(m.waistToKnee).addCircle(4)
    points.ankleZback = paths.backZ
      .shiftAlong(m.waistToFloor - points.floor.dist(points.ankle))
      .addCircle(4)

    console.log({
      pf: paths.frontZ.length(),
      pb: paths.backZ.length(),
      m: m.waistToFloor - points.floor.dist(points.ankle),
    })

    points.sideWaist = new Point(200, 0)
    console.log({ p: points.sideWaist })
    points.sideWaistFront = points.sideWaist
      .shift(180 - waistAngle, points.waistFrontSplit.dist(points.waistFrontSeam))
      .addCircle(13)
    points.sideWaistBack = points.sideWaist.shift(
      -1 * waistAngle,
      points.waistBackSplit.dist(points.waistBackSeam)
    )
    ;[/*'Hips',*/ 'Seat', 'UpperLeg', 'Knee', 'Ankle'].forEach((name) => {
      console.log({ n: 'waistTo' + name, m: m['waistTo' + name] })
      points['side' + name] = points.sideWaist.shift(270, m['waistTo' + name])
      console.log({
        n1: 'side' + name,
        n2: name.toLowerCase() + 'FrontSplit',
        n3: name.toLowerCase() + 'FrontSeam',
      })
      console.log({
        p1: points['side' + name],
        p2: points[name.toLowerCase() + 'FrontSplit'],
        p3: points[name.toLowerCase() + 'FrontSeam'],
      })
      console.log({
        ci: utils.circlesIntersect(
          points['side' + name],
          points[name.toLowerCase() + 'FrontSplit'].dist(points[name.toLowerCase() + 'FrontSeam']),
          points.sideWaistFront,
          paths.frontSplit.split(points[name.toLowerCase() + 'FrontSplit'])[0].length()
        ),
      })
    })

    // paths.splitFront = new Path()
    //   .move(points.waistFrontSplit)
    //   ._curve(points.upperLegFrontCp1, points.upperLegFrontSplit)
    //   .curve(points.upperLegFrontCp2, points.kneeFrontCp1, points.kneeFrontSplit)
    //   .curve_(points.kneeFrontCp2, points.ankleFrontSplit)

    // paths.splitBack = new Path()
    //   .move(points.waistBackSplit)
    //   ._curve(points.upperLegBackCp1, points.upperLegBackSplit)
    //   .curve(points.upperLegBackCp2, points.kneeBackCp1, points.kneeBackSplit)
    //   .curve_(points.kneeBackCp2, points.ankleBackSplit)

    console.log({ pahts: JSON.parse(JSON.stringify(paths)) })
    console.log({ pins: JSON.parse(JSON.stringify(points)) })

    return part
  },
}
