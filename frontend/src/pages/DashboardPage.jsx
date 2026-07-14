import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAllActionItems } from '../api.js'

function DashboardPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [assignee, setAssignee] = useState('')
  const [status, setStatus] = useState('')
  const [sortBy, setSortBy] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await getAllActionItems({ assignee, status, sortBy }) // { assignee: assignee, status: status, sortBy: sortBy }와 동일
        setItems(result)                                                 
      } catch (e) {
        setError(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [assignee, status, sortBy]) // 필터 or 정렬 조건이 바뀔 때마다 재조회

  return (
    <div className="card">
      <p className="section-label">대시보드</p>
      <h2>액션아이템 대시보드</h2>
      <div className="dashboard-filters">
        <input placeholder="담당자" value={assignee} onChange={(e) => setAssignee(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">전체</option> {/* 빈 문자열이면 api.js에서 쿼리 파라미터가 안 붙어 서버가 전체(필터를 안거는 것 )반환 */}
          <option value="대기">대기</option>
          <option value="진행">진행</option>
          <option value="완료">완료</option>
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="">기본순</option>
          <option value="due_date">기한순</option>
        </select>
      </div>

      {loading && <p>불러오는 중...</p>}
      {error && <p>{error.message}</p>}
      {!loading && !error && items.length === 0 && <p>조건에 맞는 액션아이템이 없습니다</p>}

      {items.length > 0 && (
        <div className="dashboard-row dashboard-header">
          <span className="dashboard-cell">할 일</span>
          <span className="dashboard-cell">회의</span>
          <span className="dashboard-cell">담당자</span>
          <span className="dashboard-cell">기한</span>
          <span className="dashboard-cell">상태</span>
        </div>
      )}

      {items.map((item) => (
        <div key={item.id} className="dashboard-row">
          <span className="dashboard-cell">{item.task}</span>
          <span className="dashboard-cell">
            <Link to={`/meetings/${item.meeting_id}`}>{item.meeting_title}</Link> {/* 클릭 시 이 액션아이템이 속한 회의 상세 화면으로 이동 */}
          </span>
          <span className="dashboard-cell">{item.assignee}</span>
          <span className="dashboard-cell">{item.due_date}</span>
          <span className="dashboard-cell" style={{ fontSize: '12px', color: 'var(--text)' }}>{item.status}</span>
        </div>
      ))}
    </div>
  )
}

export default DashboardPage
