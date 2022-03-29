import { Chevron } from 'shared/components/navigation/primary.js'
import ClearIcon from 'shared/components/icons/clear.js'
import FilterIcon from 'shared/components/icons/filter.js'
import SearchIcon from 'shared/components/icons/search.js'
import { Ul, Li, Details, Summary, SumDiv, Deg } from 'shared/components/workbench/menu'
import Path from './path.js'
import Point from './point.js'
import { useTranslation } from 'next-i18next'

const types = {
  paths: Path,
  points: Point
}

const RevealDot = ({ gist, partName, type='part', name, noOpacity=false }) => {
  const color = (type === 'part')
    ? Object.keys(gist.xray.parts).indexOf(partName)%10
    : Object.keys(gist.xray.parts[partName][type]).indexOf(name)%10
  return (
    <div className="w-4 h-4 bg-base-100 rounded-full inline-block mx-2">
      <div className={`bg-color-${color} w-full h-full rounded-full ${noOpacity ? '' : 'opacity-50'}`}>
      </div>
    </div>
  )
}

const XrayList = props => {
  const { t } = useTranslation(['app', 'parts'])

  const title = t(`parts:${props.partName}`) + ` (${props.partName})`

  const part = props.gist._state.xray.parts[props.partName]

  // Is this the only part on display?
  const only = (
    props.gist.only &&
    props.gist.only.length === 1 &&
    props.gist.only[0] === props.partName
  )

  // Is this part being revealed?
  const partReveal = (
    (
      props.gist.xray?.reveal?.[props.partName]?.points &&
      Object.keys(props.gist.xray?.reveal?.[props.partName]?.points).length > 0
    ) ||
    (
      props.gist.xray?.reveal?.[props.partName]?.paths &&
      Object.keys(props.gist.xray?.reveal?.[props.partName]?.paths).length > 0
    )
  ) ? true : false


  return (
    <Li>
      <Details>
        <Summary>
          <SumDiv>
            {partReveal
              ? <RevealDot
                  gist={props.gist}
                  partName={props.partName}
                  noOpacity
                />
              : <Deg />
            }
            <span>{title}</span>
            <span className="ml-2 opacity-60">[{props.partName}]</span>
          </SumDiv>
          <button
            className={`px-3 hover:text-secondary-focus ${only ? 'text-accent' : 'text-secondary'}`}
            title={t('filter')}
            onClick={only
              ? () => props.unsetGist(['only'])
              : () => props.updateGist(['only'], [props.partName])
            }
          >
            <FilterIcon />
          </button>
          <button
            className="text-accent px-3 hover:text-secondary-focus"
            onClick={() => {
              props.unsetGist(['xray', 'parts', props.partName])
              props.unsetGist(['xray', 'reveal', props.partName])
            }}
          >
            <ClearIcon />
          </button>
          <Chevron w={6} m={3}/>
        </Summary>
        {Object.keys(types).map(type => part[type] && (
          <Ul>
            <Li>
              <Details>
                <Summary>
                  <SumDiv>
                    <span className="capitalize">{type}</span>
                  </SumDiv>
                  <button
                    className="text-accent px-3 hover:text-secondary-focus"
                    onClick={() => {
                      props.unsetGist(['xray', 'parts', props.partName, type])
                      props.unsetGist(['xray', 'reveal', props.partName, type])
                    }}
                  >
                    <ClearIcon />
                  </button>
                  <Chevron />
                </Summary>
                <Ul>
                  {Object.keys(part[type])
                    .map(id => (
                      <Li>
                        <Details>
                          <Summary>
                            <SumDiv>
                              <RevealDot
                                gist={props.gist}
                                partName={props.partName}
                                type={type}
                                name={id}
                                noOpacity
                              />
                              <span>{id}</span>
                            </SumDiv>
                            <button
                              className={`px-3 hover:text-secondary-focus"
                                ${props.gist._state?.xray?.reveal?.[props.partName]?.[type]?.[id]
                                  ? 'text-accent'
                                  : 'text-secondary'
                                }`}
                              onClick={props.gist._state?.xray?.reveal?.[props.partName]?.[type]?.[id]
                                ? () => props.unsetGist(
                                  ['_state', 'xray', 'reveal', props.partName, type, id]
                                )
                                : () => props.updateGist(
                                  ['_state', 'xray', 'reveal', props.partName, type, id],
                                  id
                                )
                              }
                            >
                              <SearchIcon />
                            </button>
                            <button
                              className="text-accent px-3 hover:text-secondary-focus"
                              onClick={() => {
                                props.unsetGist(['_state', 'xray', 'parts', props.partName, type, id])
                                props.unsetGist(['_state', 'xray', 'reveal', props.partName, type, id])
                              }}
                            >
                              <ClearIcon />
                            </button>
                            <Chevron />
                          </Summary>
                          {type === 'paths' && <Path
                            pathName={id}
                            partName={props.partName}
                            draft={props.draft}
                            t={t}
                            units={props.gist.units}
                          />}
                          {type === 'points' && <Point
                            pointName={id}
                            partName={props.partName}
                            draft={props.draft}
                            t={t}
                          />}
                        </Details>
                      </Li>
                    ))
                  }
                </Ul>
              </Details>
            </Li>
          </Ul>
        ))}
      </Details>
    </Li>
  )
}

export default XrayList
