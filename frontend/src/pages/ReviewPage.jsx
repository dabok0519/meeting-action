import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveMeeting } from '../api.js'

function ReviewPage({ data }) {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [decisions, setDecisions] = useState(data?.decisions ?? []) //  data가 존재하는 지 확인 후 data 내 decision 목록 확인 -> 뭐가 없든 빈 배열로 방어 
                                                                    
  const [discussions, setDiscussions] = useState(data?.discussions ?? [])
  const [actionItems, setActionItems] = useState(
    (data?.action_items ?? []).map((item) => ({
      task: item.task,
      assignee: item.assignee ?? '', // 담당자나 마감기한을 반환받지 못한 경우 null이 아닌 공백으로 표시 
      due_date: item.due_date ?? '',
    }))
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!data) {
    return <p>분석 결과가 없습니다. 입력 화면으로 돌아가세요.</p>
  }

  function updateDecision(index, value) {
    setDecisions((prev) => prev.map((d, i) => (i === index ? value : d))) 
    // (prev) : lambda 함수 (파이썬)
    // prev : 수정되기 직전의 원래 decision 목록 배열
    // .map() : 기존 decision 목록과 똑같이 생긴 복사본을 생성
    // (i === index ? value : d))) : 삼항 연산자 -> 복사본의 i가 사용자가 변경하려하는 index와 동일한지 확인 후 일치하면 value <-> d(원래데이터)
    // 즉, .map()이 매번 새 배열(새 참조)을 만들어서 리렌더링됨 -> React는 참조가 같은지 보기 때문에 기존 배열을 직접 수정하면 참조가 그대로라 알아채지 못해서 상태를 업데이트해야 함
  }

  function updateDiscussion(index, value) {
    setDiscussions((prev) => prev.map((d, i) => (i === index ? value : d)))
  }

  function updateActionItem(index, field, value) {
    setActionItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }
  // ...item : 기존 할 일 데이터(task, due_date 등)가 지워지지 않도록 그대로 복사
  // [field]: value : 그 중 수정한 특정 field 값만 새로운 값으로 덮어씀
  // 즉 , 기존 내용에서 수정한 부분만 새로운 값으로 수정하되 나머지 데이터가 사라지지 않도록 방지 
  async function handleSave() {
    setLoading(true)
    setError(null)
    try {
      await saveMeeting({
        title,
        raw_text: data.raw_text,
        decisions,
        discussions,
        action_items: actionItems,
      })
      navigate('/meetings')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2>검토·저장</h2>

      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" />

      <p>{data.raw_text}</p>

      <h3>결정사항</h3>
      {decisions.map((d, i) => (
        <input key={i} value={d} onChange={(e) => updateDecision(i, e.target.value)} />
      ))}

      <h3>논의사항</h3>
      {discussions.map((d, i) => (
        <input key={i} value={d} onChange={(e) => updateDiscussion(i, e.target.value)} />
      ))}

      <h3>액션아이템</h3>
      {actionItems.map((item, i) => (
        <div key={i}>
          <input value={item.task} onChange={(e) => updateActionItem(i, 'task', e.target.value)} placeholder="할 일" />
          <input value={item.assignee} onChange={(e) => updateActionItem(i, 'assignee', e.target.value)} placeholder="담당자" />
          <input value={item.due_date} onChange={(e) => updateActionItem(i, 'due_date', e.target.value)} placeholder="기한" />
        </div>
      ))}

      <button onClick={handleSave} disabled={loading || !title}>
        {loading ? '저장 중...' : '저장'}
      </button>
      {error && <p>{error}</p>}
    </>
  )
}

export default ReviewPage
