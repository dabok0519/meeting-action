import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMeetings } from '../api.js'

function MeetingListPage() {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true) // 배포 링크 클릭 시 조건 없이 바로 뜨는 화면이기에 데이터를 가져오는 동안 빈 목록 안내(저장된 회의록이 없습니다)가
                                               // 뜨는 것을 방지하기 위해 true로 설정 
  const [error, setError] = useState(null)

  useEffect(() => { // 훅 함수는 반드시 정리를 하거나 undefined를 반환해야 하지만 async는 반드시 promise 객체를 반환함
                    // 또 한, async는 콜백함수와 함께 사용할 수 없기에 콜백함수와 분리하여 콜백함수에서 return을 하지 않게함(undefined) 
                    // 이에 따라 react 규칙과의 안전성을 높이고 async를 사용하여 비동기 통신까지 활용
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await getMeetings()
        setMeetings(result)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, []) // 의존성 배열을 통해 첫 화면 띄움 이후 리렌더링될 때마다 백엔드로 데이터 요청하는 것을 방지 

  return (
    <div className="card">
      <p className="section-label">회의 목록</p>
      <h2>회의록 목록</h2>

      {loading && <p>불러오는 중...</p>}{/* loading = true 일때 렌더링 */}
      {error && <p>{error}</p>}
      {!loading && !error && meetings.length === 0 && <p>저장된 회의록이 없습니다</p>}

      {/* meetings 배열을 map함수를 통해 목록에 있는 회의록 개수만큼 각각 해당 id로 가는 클릭 가능한 링크를 미리 다 만들어 놓음 */}
      {meetings.map((meeting) => (
        <div key={meeting.id}>
          <Link to={`/meetings/${meeting.id}`} className="meeting-list-item">
            {meeting.title} —{' '}
            <span style={{color: 'var(--text)', fontSize: '13px', marginLeft: '8px'}}>
              {new Date(meeting.created_at).toLocaleString('ko-KR')} {/* 백엔드가 날짜를 문자열 그대로 돌려주기에 ttoLocaleString으로 한국 날짜로 변경 */}
            </span>
          </Link>
        </div>
      ))}
    </div>
  )
}

export default MeetingListPage
