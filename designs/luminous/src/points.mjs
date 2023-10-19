export const points = {
  name: 'luminous.points',
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

    return part.hide()
    const m = measurements

    console.log({ m: JSON.parse(JSON.stringify(m)) })
    // points.origin = new Point(0, 0)
    // points.knee = points.origin.shift(270, m.inseam - (m.waistToFloor - m.waistToKnee))
    // points.ankle = points.origin.shift(270, m.inseam - (m.ankle / Math.PI))
    // points.waist = points.origin.shift(90, m.waistToFloor - m.inseam)

    points.waist = new Point(0, 0)
    points.hips = points.waist.shift(270, m.waistToHips)
    points.seat = points.waist.shift(270, m.waistToSeat)
    points.knee = points.waist.shift(270, m.waistToKnee)
    points.ankle = points.waist.shift(270, m.waistToFloor - m.heel / Math.PI)
    points.floor = points.waist.shift(270, m.waistToFloor)
    points.upperLeg = points.waist.shift(270, m.waistToFloor - m.inseam)

    points.ankleFront = points.ankle.shift(0, m.ankle / 2)
    points.ankleBack = points.ankle.shift(180, m.ankle / 2)
    points.kneeFront = points.knee.shift(0, m.knee / 2)
    points.kneeBack = points.knee.shift(180, m.knee / 2)
    points.upperLegFront = points.upperLeg.shift(0, m.upperLeg / 2)
    points.upperLegBack = points.upperLeg.shift(180, m.upperLeg / 2)

    points.seatFront = points.seat.shift(0, (m.seat - m.seatBack) / 2)
    points.seatBack = points.seat.shift(180, m.seatBack / 2)
    points.hipsFront = points.hips.shift(0, m.hips / 4)
    points.hipsBack = points.hips.shift(180, m.hips / 4)
    points.waistFront = points.waist.shift(0, (m.waist - m.waistBack) / 2)
    points.waistBack = points.waist.shift(180, m.waistBack / 2)

    const seatFrontCP = ControlPoints(points.upperLegFront, points.seatFront, points.hipsFront)
    const hipsFrontCP = ControlPoints(points.seatFront, points.hipsFront, points.waistFront)

    points.seatFrontCp1 = seatFrontCP.cp1
    points.seatFrontCp2 = seatFrontCP.cp3
    points.hipsFrontCp1 = hipsFrontCP.cp1
    points.hipsFrontCp2 = hipsFrontCP.cp3

    const seatBackCP = ControlPoints(points.upperLegBack, points.seatBack, points.hipsBack)
    const hipsBackCP = ControlPoints(points.seatBack, points.hipsBack, points.waistBack)

    points.seatBackCp1 = seatBackCP.cp1
    points.seatBackCp2 = seatBackCP.cp3
    points.hipsBackCp1 = hipsBackCP.cp1
    points.hipsBackCp2 = hipsBackCP.cp3

    points.topLeft = new Point(-300, -50)
    points.topRight = new Point(300, -50)
    points.bottomRight = new Point(300, 1350)
    points.bottomLeft = new Point(-300, 1350)

    paths.frontTop = new Path()
      .move(points.upperLegFront)
      ._curve(points.seatFrontCp1, points.seatFront)
      .curve(points.seatFrontCp2, points.hipsFrontCp1, points.hipsFront)
      .curve_(points.hipsFrontCp2, points.waistFront)

    paths.front = new Path()
      .move(points.ankleFront)
      .line(points.kneeFront)
      .line(points.upperLegFront)
      .join(paths.frontTop)

    paths.backTop = new Path()
      .move(points.upperLegBack)
      ._curve(points.seatBackCp1, points.seatBack)
      .curve(points.seatBackCp2, points.hipsBackCp1, points.hipsBack)
      .curve_(points.hipsBackCp2, points.waistBack)

    console.log({
      bt: paths.backTop.length(),
      br: m.crossSeam - m.crossSeamFront,
      ft: paths.frontTop.length(),
      fr: m.crossSeamFront,
    })
    paths.back = new Path()
      .move(points.ankleBack)
      .line(points.kneeBack)
      .line(points.upperLegBack)
      .join(paths.backTop)

    paths.seam = new Path()
      .move(points.topLeft)
      .line(points.bottomLeft)
      .line(points.bottomRight)
      .line(points.topRight)
      .line(points.topLeft)
      .close()
      .attr('class', 'fabric')

    if (sa) {
      paths.sa = paths.seam.offset(sa).attr('class', 'fabric sa')
    }

    macro('hd', {
      from: points.bottomLeft,
      to: points.bottomRight,
      y: points.bottomLeft.y + sa + 15,
    })
    macro('vd', {
      from: points.bottomRight,
      to: points.topRight,
      x: points.topRight.x + sa + 15,
    })

    return part
  },
}
