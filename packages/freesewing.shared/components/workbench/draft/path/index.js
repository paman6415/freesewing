import TextOnPath from '../text-on-path'
import { getProps } from '../utils'
import { round, formatMm } from 'shared/utils'

const spaces = '&#160;'.repeat(20)
const bannerize = text => (spaces+text+spaces).repeat(30)
// FIXME: Left it here because grrrrr
const Handle = ({ point, id }) => (
  <circle
    id={id}
    cx={point.x}
    cy={point.y}
    r={1}
    className="fill-contrast"
  />
)

const ControlPoints = ({ path }) => {
  if (!path.ops) return null
  const output = []
  let prev
  let i = 0
  for (const op of path.ops) {
    i++
    if (op.type === 'curve') {
      output.push(<path d={`
        M ${prev.x} ${prev.y} L ${op.cp1.x} ${op.cp1.y}
        M ${op.to.x} ${op.to.y} L ${op.cp2.x} ${op.cp2.y}
      `} id={i} className='stroke contrast ' />)
      output.push(<Handle point={op.cp1} id={i+'cp1'} />)
      output.push(<Handle point={op.cp2} id={i+'cp2'} />)
    }
    prev = op.to || false
  }

  return output
}

const PassiveXrayPath = props => (
  <g>
    <path
      d={props.path.asPathstring()}
      {...getProps(props.path)}
      className="opacity-0 stroke-3xl stroke-contrast hover:opacity-25 hover:cursor-pointer"
      onClick={props.gist.xray?.parts?.[props.partName]?.paths?.[props.pathName]
        ? () => props.unsetGist(
          ['xray', 'parts', props.partName, 'paths', props.pathName]
        )
        : () => props.updateGist(
          ['xray', 'parts', props.partName, 'paths', props.pathName],
          1
        )
      }
    />
    <ControlPoints path={props.path} />
  </g>
)

const ActiveXrayPath = props => {
  const id = `act_${props.partName}_${props.pathName}`
  const color = Object.keys(props.gist.xray.parts[props.partName].paths).indexOf(props.pathName)%10

  return (
    <g>
      <path id={id} d={props.path.asPathstring()} {...getProps(props.path)}
        className={`opacity-50 stroke-xl gashed stroke-color-${color}`}
        onClick={() => props.updateGist(
          ['xray', 'parts', props.partName, 'paths', props.pathName],
          1
        )}
      />
      <ControlPoints path={props.path} />
      <text>
        <textPath xlinkHref={`#${id}`} startOffset="50%">
          <tspan
            className="center fill-accent text-sm"
            dy={0}
            dangerouslySetInnerHTML={{
              __html: bannerize(
                `path.length() = ` + formatMm(
                  round(props.path.length()),
                  props.gist.units, 'text'
                ) + (props.gist.units === 'imperial' ? '"' : 'cm')
              )
            }}
          />
        </textPath>
      </text>
    </g>
  )
}


const Path = props => {
  const { path, partName, pathName } = props
  if (!path.render) return null
  const output = []
  const pathId = 'path-' + partName + '-' + pathName
  output.push(
    <path id={pathId} key={pathId} d={path.asPathstring()} {...getProps(path)} />
  )
  if (path.attributes.get('data-text'))
    output.push(<TextOnPath key={'text-on-path-' + name} pathId={pathId} {...props} />)
  // Active Xray
  if (props.gist?.xray?.enabled && props.gist.xray?.parts?.[partName]?.paths?.[pathName])
    output.push(<ActiveXrayPath {...props} key={'xpath_act_'+pathId} />)
  // Passive Xray
  if (props.gist?.xray?.enabled) output.push(<PassiveXrayPath {...props} key={'xpath'+pathId} />)

  return output
}

export default Path
