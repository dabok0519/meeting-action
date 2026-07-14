import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getMeeting,
  updateMeeting,
  deleteMeeting,
  updateActionItem,
  deleteActionItem,
  addActionItem,
} from '../api.js'

function ActionItemRow({ item, onDeleted }) { // 항목 개수가 가변적이라 MeetingDetailPage가 아닌 자체 state로 관리, onDeleted로 삭제만 부모에 알림
  const [task, setTask] = useState(item.task)
  const [assignee, setAssignee] = useState(item.assignee ?? '')
  const [dueDate, setDueDate] = useState(item.due_date ?? '')
  const [status, setStatus] = useState(item.status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() { // Actionitem 저장 함수 
    setSaving(true)
    setError(null)
    try {
      await updateActionItem(item.id, { task, assignee, due_date: dueDate, status })
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() { // Actionitem 삭제 함수 
    if (!confirm('이 액션아이템을 삭제하시겠습니까?')) return
    setSaving(true)
    setError(null)
    try {
      await deleteActionItem(item.id) // 백엔드 DB에서 삭제
      onDeleted(item.id) // MeetingDetailpage에서도 삭제한 item이 안 보이게 제외시킴
    } catch (e) {
      setError(e.message)
      setSaving(false)
    }
  }

  return ( // Actionitem 개별 항목 렌더링
    <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
      <input value={task} onChange={(e) => setTask(e.target.value)} placeholder="할 일" /> {/* 플레이스홀더를 통해 입력값 안내 */}
      <input value={assignee} onChange={(e) => setAssignee(e.target.value)} placeholder="담당자" />
      <input value={dueDate} onChange={(e) => setDueDate(e.target.value)} placeholder="기한" />
      <select value={status} onChange={(e) => setStatus(e.target.value)}> {/* 유저의 선택에 따라 값 변경  */}
        <option value="대기">대기</option>
        <option value="진행">진행</option>
        <option value="완료">완료</option>
      </select>
      <button onClick={handleSave} disabled={saving} style={{minWidth: '52px', flexShrink: 0}}>저장</button>
      <button onClick={handleDelete} disabled={saving} style={{minWidth: '52px', flexShrink: 0, background: 'var(--border)', color: 'var(--text-h)'}}>삭제</button>
      {error && <p>{error}</p>}
    </div>
  )
}

export default MeetingDetailPage




function MeetingDetailPage() {
  const { id } = useParams() // 훅을 통해 주소 값에서 id를 추출하여 변수에 저장 
  const navigate = useNavigate()

  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [title, setTitle] = useState('')
  const [decisions, setDecisions] = useState([])
  const [discussions, setDiscussions] = useState([])
  const [actionItems, setActionItems] = useState([])

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const [newTask, setNewTask] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState(null)

  useEffect(() => { // useEffect를 통해 컴포넌트 확인 시 바로 아래와 같은 함수를 실행하여 필요한 값 채우기 
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await getMeeting(id)
        setMeeting(result)
        setTitle(result.title)
        setDecisions(result.decisions)
        setDiscussions(result.discussions)
        setActionItems(result.action_items)
      } catch (e) {
        setError(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id]) // 의존성 배열을 통해 id 값이 바뀔때마다 리렌더링 후 재조회 여부를 결정

  if (loading) return <p>불러오는 중...</p>
  if (error) return <p>{error.status === 404 ? '해당 회의록을 찾을 수 없습니다' : error.message}</p>
  if (!meeting) return null

  function updateDecision(index, value) { // 이미 입력된 값에서 사용자가 수정 시 해당 위치(index)만 수정 
    setDecisions((prev) => prev.map((d, i) => (i === index ? value : d)))
  }
  function removeDecision(index) { // 삭제만 할 뿐 값을 사용자가 제공하지 않기 때문에 index만을 확인하여 삭제
    if (!confirm('이 결정사항을 삭제하시겠습니까?')) return
    setDecisions((prev) => prev.filter((_, i) => i !== index))
  }
  function addDecision() { // 추가 버튼 클릭 시 기존 배열 끝에 빈 문자열 하나 추가 
    setDecisions((prev) => [...prev, ''])
  }

  function updateDiscussion(index, value) {
    setDiscussions((prev) => prev.map((d, i) => (i === index ? value : d)))
  }
  function removeDiscussion(index) {
    if (!confirm('이 논의사항을 삭제하시겠습니까?')) return
    setDiscussions((prev) => prev.filter((_, i) => i !== index))
  }
  function addDiscussion() {
    setDiscussions((prev) => [...prev, ''])
  }

  async function handleSaveMeeting() { // 회의록 저장 로직 
    setSaving(true)
    setSaveError(null)
    try {
      await updateMeeting(id, { title, raw_text: meeting.raw_text, decisions, discussions }) // 회의록 업데이트 시에 결정사항이나 , 논의사항 변경도 함께 업데이트 
    } catch (e) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteMeeting() { // 회의록 자체 삭제 로직  
    if (!confirm('이 회의록을 삭제하시겠습니까?')) return
    setSaving(true)
    setSaveError(null)
    try {
      await deleteMeeting(id)
      navigate('/meetings') // 회의록 자체 삭제 로직 후 회의록 목록 화면으로 이동
    } catch (e) {
      setSaveError(e.message)
      setSaving(false)
    }
  }

  async function handleAddActionItem() { // 새로운 Actionitem 추가 로직 
    setAdding(true)
    setAddError(null)
    try {
      const newItem = await addActionItem(id, {
        task: newTask,
        assignee: newAssignee.trim() || null, // 양쪽 공백 제거 및 null값까지 수용 가능 
        due_date: newDueDate.trim() || null,
      })
      setActionItems((prev) => [...prev, newItem]) // 백엔드가 DB에 저장 후 반환한 새 ActionItem 객체 하나를 기존 목록 끝에 추가
      setNewTask('') // 입력창을 초기화 
      setNewAssignee('')
      setNewDueDate('')
    } catch (e) {
      setAddError(e.message)
    } finally {
      setAdding(false)
    }
  }

  function removeActionItem(itemId) { // ActionItemRow에서 삭제된 itemId를 전달받아, 그 id를 목록에서 제외  
    setActionItems((prev) => prev.filter((a) => a.id !== itemId))
  }

  return (
    <div className="card">
      <p className="section-label">회의록 상세</p>
      <h2>회의록 상세</h2>

      <label htmlFor="detail-title">회의 제목</label>
      <input id="detail-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" />

      <p style={{background: 'var(--code-bg)', padding: '12px', borderRadius: '8px'}}>{meeting.raw_text}</p>

      <div className="review-section">
        <p className="section-label">결정사항 ({decisions.length})</p>
        {decisions.map((d, i) => (
          <div key={i} style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
            <input style={{flex: 1}} value={d} onChange={(e) => updateDecision(i, e.target.value)} />
            <button onClick={() => removeDecision(i)}>삭제</button>
          </div>
        ))}
        <button onClick={addDecision} style={{marginTop: '8px'}}>결정사항 추가</button>
      </div>

      <div className="review-section">
        <p className="section-label">논의사항 ({discussions.length})</p>
        {discussions.map((d, i) => (
          <div key={i} style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
            <input style={{flex: 1}} value={d} onChange={(e) => updateDiscussion(i, e.target.value)} />
            <button onClick={() => removeDiscussion(i)}>삭제</button>
          </div>
        ))}
        <button onClick={addDiscussion} style={{marginTop: '8px'}}>논의사항 추가</button>
      </div>

      <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
        <button onClick={handleSaveMeeting} disabled={saving || !title}>
          {saving ? '저장 중...' : '회의록 저장'}
        </button>
        <button onClick={handleDeleteMeeting} disabled={saving} style={{background: 'var(--border)', color: 'var(--text-h)'}}>회의록 삭제</button>
      </div>
      {saveError && <p>{saveError}</p>}

      <div className="review-section">
        <p className="section-label">액션아이템 ({actionItems.length})</p>
        {actionItems.map((item) => (
          <ActionItemRow key={item.id} item={item} onDeleted={removeActionItem} />
        ))}

        <h4>액션아이템 추가</h4>
        <div style={{display: 'flex', gap: '8px'}}>
          <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="할 일" />
          <input value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)} placeholder="담당자" />
          <input value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} placeholder="기한" />
          <button onClick={handleAddActionItem} disabled={adding || !newTask}>
            {adding ? '추가 중...' : '추가'}
          </button>
        </div>
        {addError && <p>{addError}</p>}
      </div>
    </div>
  )
}

