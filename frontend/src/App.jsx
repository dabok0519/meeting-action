import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import InputPage from './pages/InputPage'
import ReviewPage from './pages/ReviewPage'
import MeetingListPage from './pages/MeetingListPage'
import MeetingDetailPage from './pages/MeetingDetailPage'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      {/* Link, Routes, Route를 쓸 수 있게 감싸는 태그 */}
      <nav>
        <Link to="/">입력</Link>{/* 사용자의 클릭 행동에 반응하여 url을 변경하는 역할 */}
        <Link to="/review">검토·저장</Link>
        <Link to="/meetings">목록</Link>
        <Link to="/meetings/1">상세(예시 id=1)</Link>{/* 1은 현재 예시로 진행 */}
      </nav>
      {/* 여러 개의 Route를 모아두고 현재 url에 맞는 Route를 판단 */}
      <Routes>
        <Route path="/" element={<InputPage />} />{/* URL과 해당하는 컴포넌트 연결 역할 */}
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/meetings" element={<MeetingListPage />} />
        <Route path="/meetings/:id" element={<MeetingDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
