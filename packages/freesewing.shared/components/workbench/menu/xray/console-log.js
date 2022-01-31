import { Li, SumButton, SumDiv, Deg } from 'shared/components/workbench/menu'

const ConsoleLogPattern = ({ draft }) =>  (
  <Li>
    <SumButton onClick={() => console.log(draft)}>
      <SumDiv>
        <Deg />
        <span>console.log(pattern)</span>
      </SumDiv>
    </SumButton>
  </Li>
)

export default ConsoleLogPattern
