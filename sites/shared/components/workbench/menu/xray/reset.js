import { Li, SumButton, SumDiv, Deg } from 'shared/components/workbench/menu'
import { useTranslation } from 'next-i18next'

const ResetXray = props =>  (
  <Li>
    <SumButton onClick={() => {
      props.updateGist(['xray'], { enabled: true })
      props.updateGist(['only'], false)
    }}>
      <SumDiv>
        <Deg />
        <span>{ props.app.t(`app.reset`) }</span>
      </SumDiv>
    </SumButton>
  </Li>
)

export default ResetXray
