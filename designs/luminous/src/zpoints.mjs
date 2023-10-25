export const zpoints = {
  name: 'luminous.zpoints',
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
      // console.log({ t: t, ap2_1: p2.angle(p1), ap2_3: p2.angle(p3), a: a })
      const t1 = p2.shift(p2.angle(p1) + a - 90, p2.dist(p1) / 3)
      const t3 = p2.shift(p2.angle(p3) - a + 90, p2.dist(p3) / 3)
      // console.log({ t: t, ap2_t1: p2.angle(t1), ap2_t3: p2.angle(t3), a: a })
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
      console.log({ pathName: pathName })
      console.log({ i: 1, n: names[1], p2: points[names[1] + 'Cp2'], p3: points[names[1]] })
      paths[pathName] = new Path()
        .move(points[names[0]])
        ._curve(points[names[1] + 'Cp1'], points[names[1]])
      console.log({ s: 0, l: paths[pathName].length() })
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
        console.log({
          s: i - 1,
          l: new Path()
            .move(points[names[i - 1]])
            .curve(points[names[i - 1] + 'Cp2'], points[names[i] + 'Cp1'], points[names[i]])
            .length(),
        })
      }
      console.log({ i: i, n: names[i], p2: points[names[i] + 'Cp2'], p3: points[names[i]] })
      paths[pathName].curve_(points[names[i - 1] + 'Cp2'], points[names[i]])
    }

    const CreateWaistPoint = (front) => {
      console.log({
        crossSeamAngle: options.crossSeamAngle,
        crotchPointsCP: options.crotchPointsCP,
      })
      const kneeTemp = points.insideCrossSeam.shiftFractionTowards(
        points.insideKnee,
        options.crotchToKnee
      )
      const angle =
        90 +
        (front
          ? options.crossSeamAngle * (m.waistBack / m.waist)
          : -1 * options.crossSeamAngle * (1 - m.waistBack / m.waist))
      const crossSeam = front ? m.crossSeamFront : m.crossSeam - m.crossSeamFront
      var kneeToWaist = m.waistToKnee
      var ratio = 1
      var waist = kneeTemp.shift(angle, kneeToWaist * ratio)
      const crossSeamCp = points.insideCrossSeam.shiftFractionTowards(
        utils.beamIntersectsY(kneeTemp, waist, points.insideCrossSeam.y),
        options.crotchPointsCP
      )

      console.log({ f: front, a: angle })
      var waistCp
      var diff,
        iter = 0
      do {
        waist = kneeTemp.shift(angle, kneeToWaist * ratio * (ratio < 1 ? 1.05 : 0.95))
        // waistCp = waist.shiftFractionTowards(kneeTemp, options.waistToKneeCP)
        waistCp = waist.shiftFractionTowards(points.insideKnee, options.waistToKneeCP)

        const crossSeamPath = new Path()
          .move(points.insideCrossSeam)
          .curve(crossSeamCp, waistCp, waist)

        diff = crossSeam - crossSeamPath.length()
        ratio = crossSeam / crossSeamPath.length()
        // console.log({ i: iter, d: diff, r: ratio })
      } while (++iter < 100 && (diff > 1 || diff < -1))
      if (iter >= 100) {
        console.log('Too many iterations trying to make it fit!')
        // log.error('Too many iterations trying to make it fit!')
      }

      if (front) {
        points.frontWaist = waist.clone()
        points.frontWaistCp = waistCp.clone()
        points.frontCrossSeamCp = crossSeamCp.clone()
      } else {
        points.backWaist = waist.clone()
        points.backWaistCp = waistCp.clone()
        points.backCrossSeamCp = crossSeamCp.clone()
      }
    }

    const CreateSidePoints = (
      prefix,
      postfix,
      names,
      ratio,
      ratioFixed,
      ease,
      distanceCompentation
    ) => {
      console.log('-----' + prefix + postfix + '----')
      var measurement, width
      for (var i = 0; i < names.length; i++) {
        var distance =
          m['waistTo' + names[i - 1]] -
          (m['waistTo' + names[i]] === undefined ? 0 : m['waistTo' + names[i]])
        switch (names[i]) {
          case 'UpperLeg':
            measurement = m['upperLeg']
            const intersect = utils.beamIntersectsCurve(
              points[prefix + names[i]],
              points[prefix + names[i]].shift(prefix == 'front' ? 180 : 0, ratioFixed * 3),
              points.insideCrossSeam,
              points[prefix + 'CrossSeamCp'],
              points[prefix + 'WaistCp'],
              points[prefix + 'Waist']
            )
            console.log({ intersect: intersect })
            measurement += intersect.dist(points[prefix + names[i]])
            break
          case 'Waist':
            measurement = prefix == 'front' ? m.waist - m.waistBack : m.waistBack
          case 'Seat':
            measurement = prefix == 'front' ? m.seat - m.seatBack : m.seatBack
            distance *= distanceCompentation
            break
          default:
            measurement = m[names[i].toLowerCase()]
        }
        measurement /= 2
        measurement *= ease

        width = measurement * ratio

        console.log({
          ratio: ratio,
          ratioFixed: ratioFixed,
          width: width,
          distance: distance,
          dc: distanceCompentation,
        })
        if (i == 0) {
          points[prefix + postfix + names[i]] = points[prefix + names[i]].shift(
            prefix == 'front' ? 180 : 0,
            measurement - width < ratioFixed ? width : measurement - ratioFixed
          ) //.addCircle(3).addCircle(6).addCircle(9)
          points[prefix + names[i]] //.addCircle(width < ratioFixed ? width : ratioFixed)
        } else {
          console.log({
            n1: prefix + names[i],
            n2: prefix + postfix + names[i - 1],
            m1: 'waistTo' + names[i - 1],
            m2: 'waistTo' + names[i],
            d: distance,
          })
          console.log({
            p1: points[prefix + names[i]],
            p2: points[prefix + postfix + names[i - 1]],
            m1: m['waistTo' + names[i - 1]],
            m2: m['waistTo' + names[i]],
            w: width < ratioFixed ? width : ratioFixed,
            d: points[prefix + names[i]].dist(points[prefix + names[i - 1]]),
          })

          var ci = utils.circlesIntersect(
            points[prefix + names[i]],
            // width < ratioFixed ? width : ratioFixed,
            // measurement - width < ratioFixed ? ratioFixed : measurement - width,
            measurement - width < ratioFixed ? width : measurement - ratioFixed,
            points[prefix + postfix + names[i - 1]],
            distance
          )
          console.log({ ci: ci })

          // points[ prefix +postfix +names[i-1] ].addCircle(distance)
          // points[prefix +names[i]].addCircle(width < ratioFixed ? width : ratioFixed)

          if (false !== ci) {
            points[prefix + postfix + names[i]] = ci[prefix == 'front' ? 0 : 1] //.addCircle(2).addCircle(4).addCircle(6)
          } else {
            // break
            points[prefix + postfix + names[i]] = points[prefix + postfix + names[i - 1]].clone()

            points[prefix + postfix + names[i - 1]].addCircle(distance)
            // points[prefix +names[i]].addCircle(width < ratioFixed ? width : ratioFixed)
            points[prefix + names[i]].addCircle(
              measurement - width < ratioFixed ? width : measurement - ratioFixed
            )
          }
        }
      }
    }

    const SmoothPoints = (prefix, postfix, names) => {
      var adjust
      for (var i = 0; i < names.length - 2; i++) {
        adjust = false
        console.log({
          n1: names[i],
          n2: names[i + 1],
          n3: names[i + 2],
        })
        console.log({
          smooth1: points[prefix + postfix + names[i]],
          smooth2: points[prefix + postfix + names[i + 1]],
          smooth3: points[prefix + postfix + names[i + 2]],
        })
        console.log({
          a1: points[prefix + postfix + names[i]].angle(points[prefix + postfix + names[i + 1]]),
          a2: points[prefix + postfix + names[i]].angle(points[prefix + postfix + names[i + 2]]),
        })
        if (prefix == 'front') {
          adjust =
            points[prefix + postfix + names[i]].angle(points[prefix + postfix + names[i + 1]]) >
            points[prefix + postfix + names[i]].angle(points[prefix + postfix + names[i + 2]])
        } else {
          adjust =
            points[prefix + postfix + names[i]].angle(points[prefix + postfix + names[i + 1]]) <
            points[prefix + postfix + names[i]].angle(points[prefix + postfix + names[i + 2]])
        }
        if (adjust) {
          points[prefix + postfix + names[i + 1]] = points[
            prefix + postfix + names[i]
          ].shiftTowards(
            points[prefix + postfix + names[i + 2]],
            points[prefix + postfix + names[i]].dist(points[prefix + postfix + names[i + 1]])
          )
        }
      }
    }

    const m = measurements
    const crotchOffset = m.waistToFloor - m.inseam

    const waistFrontBackRatio = m.waistBack / m.waist
    const sideRatio = 3 / 5
    const ease = options.ease + 1

    m['waistToAnkle'] = m.waistToFloor - m.heel / Math.PI
    // m['waistToWaist'] = 0;

    // const sideFixed = (((m.seat - m.seatBack) * ease) / 2) * sideRatio
    const sideFixed = (((m.waist - m.waistBack) * ease) / 2) * sideRatio

    console.log({
      waistFrontBackRatio: waistFrontBackRatio,
      sideFixed: sideFixed,
      waist: m.waist,
      waistb: m.waistBack,
    })

    console.log({ m: JSON.parse(JSON.stringify(m)) })
    console.log({ wfr: waistFrontBackRatio })

    points.insideWaist = new Point(0, 0)
    points.insideHips = points.insideWaist.shift(270, m.waistToHips)
    points.insideSeat = points.insideWaist.shift(270, m.waistToSeat)
    points.frontCrossSeam =
      points.backCrossSeam =
      points.insideCrossSeam =
        points.insideWaist.shift(270, crotchOffset)
    points.frontUpperLeg =
      points.backUpperLeg =
      points.insideUpperLeg =
        points.insideWaist.shift(270, m.waistToUpperLeg)
    points.frontKnee =
      points.backKnee =
      points.insideKnee =
        points.insideWaist.shift(270, m.waistToKnee)
    points.frontAnkle =
      points.backAnkle =
      points.insideAnkle =
        points.insideWaist.shift(270, m.waistToFloor - m.heel / Math.PI)
    points.frontFloor =
      points.backFloor =
      points.insideFloor =
        points.insideWaist.shift(270, m.waistToFloor)

    CreateWaistPoint(true)
    CreateWaistPoint(false)

    // paths.waistTempCp = new Path()
    // .move(points.upperleg)
    // .line(points.crossSeamFrontCp)

    console.log({ pionts: JSON.parse(JSON.stringify(points)) })

    paths.middle = new Path().move(points.insideUpperLeg).line(points.insideFloor)

    paths.crossSeamFront = new Path()
      .move(points.insideCrossSeam)
      .curve(points.frontCrossSeamCp, points.frontWaistCp, points.frontWaist)
    paths.crossSeamBack = new Path()
      .move(points.insideCrossSeam)
      .curve(points.backCrossSeamCp, points.backWaistCp, points.backWaist)

    let csFront = paths.crossSeamFront.length()
    let csBack = paths.crossSeamBack.length()

    console.log({ csf: m.crossSeamFront, csFront: csFront, csBack: csBack })

    points.frontSeat = paths.crossSeamFront
      .reverse()
      .shiftAlong(m.waistToSeat * (m.crossSeamFront / m.waistToUpperLeg) * 0.8)
      .addCircle(6)
    points.frontHips = paths.crossSeamFront
      .reverse()
      .shiftAlong(m.waistToHips * (m.crossSeamFront / m.waistToUpperLeg))
      .addCircle(10)
    points.backSeat = paths.crossSeamBack
      .reverse()
      .shiftAlong(m.waistToSeat * (m.waistToSeat / m.waistToUpperLeg))
      .addCircle(6)
    points.backHips = paths.crossSeamBack
      .reverse()
      .shiftAlong(m.waistToHips * (m.waistToSeat / m.waistToUpperLeg))
      .addCircle(10)

    CreateSidePoints(
      'front',
      'Side',
      ['Ankle', 'Knee', 'UpperLeg', 'Seat', 'Waist'],
      0,
      0.1,
      ease,
      1
    )
    // CreateSidePoints( 'front', 'Side', ['Ankle', 'Knee', 'UpperLeg', 'Waist'], 1, sideFixed *3, ease )
    CreateSidePoints(
      'back',
      'Side',
      ['Ankle', 'Knee', 'UpperLeg', 'Seat', 'Waist'],
      0,
      0.1,
      ease,
      1
    )
    // // CreateSidePoints( 'front', 'Split', ['Ankle', 'Knee', 'UpperLeg', 'Waist'], sideRatio, sideFixed, ease )
    console.log({
      inseam: points.frontAnkle.dist(points.frontCrossSeam),
      csf: paths.crossSeamFront.length(),
      wtf: m.waistToFloor,
      h: m.heel / Math.PI,
    })
    console.log({
      one: points.frontAnkle.dist(points.frontCrossSeam) + paths.crossSeamFront.length(),
      two: m.waistToFloor - m.heel / Math.PI,
    })
    console.log({
      div:
        (points.frontAnkle.dist(points.frontCrossSeam) + paths.crossSeamFront.length()) /
        (m.waistToFloor - m.heel / Math.PI),
    })

    CreateSidePoints(
      'front',
      'Split',
      ['Ankle', 'Knee', 'UpperLeg', 'Seat', 'Waist'],
      sideRatio,
      sideFixed,
      ease,
      (points.frontAnkle.dist(points.frontCrossSeam) + paths.crossSeamFront.length()) /
        (m.waistToFloor - m.heel / Math.PI)
    )
    CreateSidePoints(
      'back',
      'Split',
      ['Ankle', 'Knee', 'UpperLeg', 'Seat', 'Waist'],
      sideRatio,
      sideFixed,
      ease,
      (points.frontAnkle.dist(points.frontCrossSeam) + paths.crossSeamFront.length()) /
        (m.waistToFloor - m.heel / Math.PI)
    )

    SmoothPoints('front', 'Side', ['Ankle', 'Knee', 'UpperLeg', 'Seat', 'Waist'])
    SmoothPoints('front', 'Split', ['Ankle', 'Knee', 'UpperLeg', 'Seat', 'Waist'])
    SmoothPoints('back', 'Side', ['Ankle', 'Knee', 'UpperLeg', 'Seat', 'Waist'])
    SmoothPoints('back', 'Split', ['Ankle', 'Knee', 'UpperLeg', 'Seat', 'Waist'])

    console.log({ pins: JSON.parse(JSON.stringify(points)) })

    // CreateControlPoints([
    //   'frontSideWaist',
    //   'frontSideSeat',
    //   'frontSideUpperLeg',
    //   'frontSideKnee',
    //   'frontSideAnkle',
    // ])
    // CreateControlPoints([
    //   'frontSplitWaist',
    //   'frontSplitSeat',
    //   'frontSplitUpperLeg',
    //   'frontSplitKnee',
    //   'frontSplitAnkle',
    // ])
    ;['front', 'back'].forEach((prefix) => {
      ;['Side', 'Split'].forEach((type) => {
        CreateControlPoints([
          prefix + type + 'Waist',
          prefix + type + 'Seat',
          prefix + type + 'UpperLeg',
          prefix + type + 'Knee',
          prefix + type + 'Ankle',
        ])
      })
    })
    ;['front', 'back'].forEach((prefix) => {
      ;['Side', 'Split'].forEach((type) => {
        CreatePath(prefix + type, [
          prefix + type + 'Waist',
          prefix + type + 'Seat',
          prefix + type + 'UpperLeg',
          prefix + type + 'Knee',
          prefix + type + 'Ankle',
        ])
      })
    })

    // ;['front', 'back'].forEach((prefix) => {
    //   ;['Side'].forEach((type) => {
    //     paths[prefix + type] = new Path()
    //       .move(points[prefix + type + 'Ankle'])
    //       .line(points[prefix + type + 'Knee'])
    //       .line(points[prefix + type + 'UpperLeg'])
    //       .line(points[prefix + type + 'Seat'])
    //       .line(points[prefix + type + 'Waist'])
    //   })
    // })
    // ;['front', 'back'].forEach((prefix) => {
    //   ;['Split'].forEach((type) => {
    //     paths[prefix + type +'2'] = new Path()
    //       .move(points[prefix + type + 'Ankle'])
    //       .line(points[prefix + type + 'Knee'])
    //       .line(points[prefix + type + 'UpperLeg'])
    //       .line(points[prefix + type + 'Waist'])
    //   })
    // })

    // paths.frontSplit.addClass('dotted note')
    // paths.backSplit.addClass('dotted note')
    // paths.frontSplit2.addClass('dashed lining')
    // paths.backSplit2.addClass('dashed lining')

    // console.log({d1: points.frontKnee.dist(points.frontUpperLeg),d2: points.frontSplitKnee.dist(points.frontSplitUpperLeg)})

    console.log({ pahts: JSON.parse(JSON.stringify(paths)) })

    // paths.frontSide = new Path()
    //   .move(points.frontSideAnkle)
    //   .line(points.frontSideKnee)
    //   .line(points.frontSideUpperLeg)
    //   .line(points.frontSideSeat)
    //   .line(points.frontSideWaist)
    return part

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
    points.upperlegFrontSeam = points.upperleg.shift(180 + waistAngle, (m.upperLeg * ease) / 2)
    points.upperlegBackSeam = points.upperleg.shift(waistAngle, (m.upperLeg * ease) / 2)
    points.kneeFrontSeam = points.knee.shift(180, (m.knee * ease) / 2)
    points.kneeBackSeam = points.knee.shift(0, (m.knee * ease) / 2)
    points.ankleFrontSeam = points.ankle.shift(180, (m.ankle * ease) / 2)
    points.ankleBackSeam = points.ankle.shift(0, (m.ankle * ease) / 2)

    // const sideFixed = points.waistFrontSeam.dist(
    //   points.waistFront.shiftFractionTowards(points.waistFrontSeam, sideRatio)
    // )

    paths.front = new Path()
      .move(points.ankleFrontSeam)
      .line(points.kneeFrontSeam)
      .line(points.upperlegFrontSeam)
      .line(points.seatFrontSeam)
      .line(points.waistFrontSeam)
    paths.back = new Path()
      .move(points.ankleBackSeam)
      .line(points.kneeBackSeam)
      .line(points.upperlegBackSeam)
      .line(points.seatBackSeam)
      .line(points.waistBackSeam)

    const ShiftPathPoints = (path, ratio, names) => {
      if (names.length < 2) return
      for (var i = names.length - 2; i >= 0; i--) {
        console.log({ n1: names[i].toLowerCase() + path, n2: names[i + 1].toLowerCase() + path })
        console.log({
          p1: points[names[i].toLowerCase() + path],
          p2: points[names[i + 1].toLowerCase() + path],
        })
        console.log({
          lb: points[names[i].toLowerCase() + path].dist(points[names[i + 1].toLowerCase() + path]),
        })
        points[names[i].toLowerCase() + path] = points[
          names[i].toLowerCase() + path
        ].shiftFractionTowards(points[names[i + 1].toLowerCase() + path], ratio)
        console.log({
          la: points[names[i].toLowerCase() + path].dist(points[names[i + 1].toLowerCase() + path]),
        })
      }
    }
    const shiftRatio =
      1 - (m.waistToFloor - points.floorFront.dist(points.ankleFront)) / paths.front.length()
    console.log({ shiftRatio: shiftRatio })
    ShiftPathPoints('FrontSeam', shiftRatio, [
      'Waist',
      /*'Hips',*/ 'Seat',
      'UpperLeg',
      'Knee',
      'Ankle',
    ])

    // points.waistFrontSplit = points.waistFront.shiftFractionTowards(points.waistFrontSeam, sideRatio)
    points.waistFrontSplit = points.waistFrontSeam.shiftTowards(points.waistFront, sideFixed)
    // points.waistBackSplit = points.waistBack.shiftFractionTowards(points.waistBackSeam, sideRatio)
    points.waistBackSplit = points.waistBackSeam.shiftTowards(points.waistBack, sideFixed)
    points.seatFrontSplit = points.seatFrontSeam.shiftTowards(points.seatFront, sideFixed)
    points.seatBackSplit = points.seatBackSeam.shiftTowards(points.seatBack, sideFixed)
    // points.upperlegFrontSplit = points.upperleg.shiftFractionTowards(points.upperlegFront, sideRatio)
    points.upperlegFrontSplit = points.upperlegFrontSeam.shiftTowards(points.upperleg, sideFixed)
    // points.upperlegBackSplit = points.upperleg.shiftFractionTowards(points.upperlegBack, sideRatio)
    points.upperlegBackSplit = points.upperlegBackSeam.shiftTowards(points.upperleg, sideFixed)
    points.kneeFrontSplit = points.knee.shiftFractionTowards(points.kneeFrontSeam, sideRatio)
    // points.kneeFrontSplit = points.kneeFront.shiftTowards(points.knee, sideFixed)
    points.kneeBackSplit = points.knee.shiftFractionTowards(points.kneeBackSeam, sideRatio)
    // points.kneeBackSplit = points.kneeBack.shiftTowards(points.knee, sideFixed)
    points.ankleFrontSplit = points.ankle.shiftFractionTowards(points.ankleFrontSeam, sideRatio)
    // points.ankleFrontSplit = points.ankleFront.shiftTowards(points.ankle, sideFixed)
    points.ankleBackSplit = points.ankle.shiftFractionTowards(points.ankleBackSeam, sideRatio)
    // points.ankleBackSplit = points.ankleBack.shiftTowards(points.ankle, sideFixed)

    points.seatFrontSplit = utils
      .beamsIntersect(
        points.seatFront,
        points.seatFrontSeam,
        points.waistFrontSplit,
        points.upperlegFrontSplit
      )
      .addCircle(8)

    CreateControlPoints([
      'waistFrontSplit',
      'seatFrontSplit',
      'upperlegFrontSplit',
      'kneeFrontSplit',
      'ankleFrontSplit',
    ])

    CreatePath('frontSplit', [
      'waistFrontSplit',
      'seatFrontSplit',
      'upperlegFrontSplit',
      'kneeFrontSplit',
      'ankleFrontSplit',
    ])

    CreateControlPoints([
      'waistBackSplit',
      // 'seatBackSplit',
      'upperlegBackSplit',
      'kneeBackSplit',
      'ankleBackSplit',
    ])

    CreatePath('BackSplit', [
      'waistBackSplit',
      // 'seatBackSplit',
      'upperlegBackSplit',
      'kneeBackSplit',
      'ankleBackSplit',
    ])

    points.seatBackSplit = utils
      .beamIntersectsCurve(
        points.seatBack,
        points.seatBackSeam,
        points.waistBackSplit,
        points.waistBackSplit,
        points.upperlegBackSplitCp1,
        points.upperlegBackSplit
      )
      .addCircle(8)

    var cp = ControlPoints(points.waistFrontSplit, points.upperlegFrontSplit, points.kneeFrontSplit)
    points.upperlegFrontCp1 = cp.cp1
    points.upperlegFrontCp2 = cp.cp3
    cp = ControlPoints(points.waistBackSplit, points.upperlegBackSplit, points.kneeBackSplit)
    points.upperlegBackCp1 = cp.cp1
    points.upperlegBackCp2 = cp.cp3
    cp = ControlPoints(points.upperlegFrontSplit, points.kneeFrontSplit, points.ankleFrontSplit)
    points.kneeFrontCp1 = cp.cp1
    points.kneeFrontCp2 = cp.cp3
    cp = ControlPoints(points.upperlegBackSplit, points.kneeBackSplit, points.ankleBackSplit)
    points.kneeBackCp1 = cp.cp1
    points.kneeBackCp2 = cp.cp3

    console.log({ pins: JSON.parse(JSON.stringify(points)) })

    paths.frontZ = paths.front.reverse()
    points.seatZ = paths.frontZ.shiftAlong(m.waistToSeat).addCircle(4)
    points.hipsZ = paths.frontZ.shiftAlong(m.waistToHips).addCircle(4)
    points.upperlegZ = paths.frontZ.shiftAlong(m.waistToUpperLeg).addCircle(4)
    points.kneeZ = paths.frontZ.shiftAlong(m.waistToKnee).addCircle(4)
    points.ankleZ = paths.frontZ
      .shiftAlong(m.waistToFloor - points.floor.dist(points.ankle))
      .addCircle(4)

    paths.backZ = paths.back.reverse()
    points.seatZback = paths.backZ.shiftAlong(m.waistToSeat).addCircle(4)
    points.hipsZback = paths.backZ.shiftAlong(m.waistToHips).addCircle(4)
    points.upperlegZback = paths.backZ.shiftAlong(m.waistToUpperLeg).addCircle(4)
    points.kneeZback = paths.backZ.shiftAlong(m.waistToKnee).addCircle(4)
    points.ankleZback = paths.backZ
      .shiftAlong(m.waistToFloor - points.floor.dist(points.ankle))
      .addCircle(4)

    console.log({
      pf: paths.frontZ.length(),
      pb: paths.backZ.length(),
      m: m.waistToFloor - points.floor.dist(points.ankle),
    })

    console.log({ pahts: JSON.parse(JSON.stringify(paths)) })
    points.kneeFrontSplit.addCircle(2).addCircle(4).addCircle(6).addCircle(8)
    // console.log({kfs:paths.frontSplit.split(points.seatFrontSplit)})
    // console.log({kfs:paths.frontSplit.split(points.upperlegFrontSplit)})
    console.log('--------------------------------')
    console.log({ kfs: paths.frontSplit.split(points.kneeFrontSplit) })
    // console.log({kfs:paths.frontSplit.split(points.upperlegFrontSplit)})

    points.sideWaist = new Point(200, 0)
    console.log({ p: points.sideWaist })
    points.sideWaistFront = points.sideWaist
      .shift(180 - waistAngle, points.waistFrontSplit.dist(points.waistFrontSeam))
      .addCircle(10)
    points.sideWaistBack = points.sideWaist.shift(
      -1 * waistAngle,
      points.waistBackSplit.dist(points.waistBackSeam)
    )
    const mp = ['Waist', /*'Hips',*/ 'Seat', 'UpperLeg', 'Knee', 'Ankle']
    // var pathLength = [0]
    for (var i = 1; i < mp.length; i++) {
      // console.log({ n: 'waistTo' + mp[i], m: m['waistTo' + mp[i]], pl: pathLength[i-1] })
      // console.log({T:paths.frontSplit.split(points[mp[i].toLowerCase() + 'FrontSplit'])[0].length()})
      points['side' + mp[i]] = points.sideWaist.shift(270, m['waistTo' + mp[i]]).addCircle(3)
      console.log({
        n1: 'side' + mp[i],
        n2: mp[i].toLowerCase() + 'FrontSplit',
        n3: mp[i].toLowerCase() + 'FrontSeam',
        n4: mp[i - 1].toLowerCase() + 'Front',
        n5: 'side' + mp[i - 1] + 'Front',
      })
      console.log({
        p1: points['side' + mp[i]],
        p2: points[mp[i].toLowerCase() + 'FrontSplit'],
        p3: points[mp[i].toLowerCase() + 'FrontSeam'],
        p4: points[mp[i - 1].toLowerCase() + 'Front'],
        p5: points['side' + mp[i - 1] + 'Front'],
      })
      // console.log({split:paths.frontSplit.split(points[mp[i].toLowerCase() + 'FrontSplit'])})
      // pathLength.push(paths.frontSplit.split(points[mp[i].toLowerCase() + 'FrontSplit'])[0].length())
      points['side' + mp[i]].addCircle(
        points[mp[i].toLowerCase() + 'FrontSplit'].dist(points[mp[i].toLowerCase() + 'FrontSeam'])
      )
      points['side' + mp[i]].addCircle(10)
      points['side' + mp[i]].addCircle(12)
      points['side' + mp[i]].addCircle(14)
      points['side' + mp[i - 1] + 'Front'].addCircle(
        points[mp[i].toLowerCase() + 'FrontSplit'].dist(
          points[mp[i - 1].toLowerCase() + 'FrontSplit']
        )
      )
      points['side' + mp[i - 1] + 'Front'].addCircle(2)
      points['side' + mp[i - 1] + 'Front'].addCircle(4)
      points['side' + mp[i - 1] + 'Front'].addCircle(6)
      points['side' + mp[i - 1] + 'Front'].addCircle(8)
      // console.log({l1:points[mp[i].toLowerCase() + 'FrontSplit'].dist(points[mp[i].toLowerCase() + 'FrontSeam']),l2:pathLength[i]-pathLength[i-1],pl:pathLength})
      var ci = utils.circlesIntersect(
        points['side' + mp[i]],
        points[mp[i].toLowerCase() + 'FrontSplit'].dist(points[mp[i].toLowerCase() + 'FrontSeam']),
        points['side' + mp[i - 1] + 'Front'],
        points[mp[i].toLowerCase() + 'FrontSplit'].dist(
          points[mp[i - 1].toLowerCase() + 'FrontSplit']
        )
        // pathLength[i]-pathLength[i-1]
      )
      console.log({ ci: ci })
      if (false !== ci) {
        points['side' + mp[i] + 'Front'] = ci[0].addCircle(7)
        // points['ci' +mp[i] + '1' ] = ci[1].addCircle(7)
        // points['side' + mp[i] +'Front'].addCircle(pathLength)
      }
    }

    paths.splitFront = new Path()
      .move(points.waistFrontSplit)
      ._curve(points.upperlegFrontCp1, points.upperlegFrontSplit)
      .curve(points.upperlegFrontCp2, points.kneeFrontCp1, points.kneeFrontSplit)
      .curve_(points.kneeFrontCp2, points.ankleFrontSplit)

    paths.splitBack = new Path()
      .move(points.waistBackSplit)
      ._curve(points.upperlegBackCp1, points.upperlegBackSplit)
      .curve(points.upperlegBackCp2, points.kneeBackCp1, points.kneeBackSplit)
      .curve_(points.kneeBackCp2, points.ankleBackSplit)

    console.log({ pahts: JSON.parse(JSON.stringify(paths)) })
    console.log({ pins: JSON.parse(JSON.stringify(points)) })

    console.log({
      Split: paths.frontSplit.length(),
      M: m.waistToFloor - points.floorFront.dist(points.ankleFront),
    })
    return part
  },
}

//http://localhost:8000/new/luminous#view=%22inspect%22&settings=%7B%22measurements%22%3A%7B%22waist%22%3A960%2C%22waistBack%22%3A440%2C%22hips%22%3A884%2C%22seat%22%3A980%2C%22seatBack%22%3A490%2C%22inseam%22%3A790%2C%22waistToSeat%22%3A230%2C%22waistToUpperLeg%22%3A280%2C%22waistToKnee%22%3A610%2C%22waistToHips%22%3A120%2C%22waistToFloor%22%3A1090%2C%22knee%22%3A415%2C%22ankle%22%3A230%2C%22crossSeam%22%3A800%2C%22crossSeamFront%22%3A380%2C%22heel%22%3A300%2C%22upperLeg%22%3A640%7D%7D
