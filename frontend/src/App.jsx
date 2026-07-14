import { useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import InputPage from './pages/InputPage'
import ReviewPage from './pages/ReviewPage'
import MeetingListPage from './pages/MeetingListPage'
import MeetingDetailPage from './pages/MeetingDetailPage'
import './App.css'

function App() {
  const [analyzedData, setAnalyzedData] = useState(null)  
   // InputPage,ReviewPage는 라우트 전환 시 언마운트되어 자기 state가 사라지지만 App은 라우팅 전체를 감싸는 컴포넌트라 언마운트되지 않아 값이 유지
   // 즉 , input과 review 페이지는 서로 직접 통신 못 하니 공통 부모(App)가 중간 창고 역할 수행 
  return (
    <BrowserRouter>
      {/* Link, Routes, Route를 쓸 수 있게 감싸는 태그 */}
      <nav className="app-header">
        <span>회의록 분석 서비스</span>
        <Link to="/meetings">회의 목록</Link>
      </nav>
      {/* 여러 개의 Route를 모아두고 현재 url에 맞는 Route를 판단 */}
      <Routes>
        {/* URL과 해당하는 컴포넌트 연결 역할 */}
        
        <Route path="/" element={<InputPage onAnalyzed={setAnalyzedData} />} /> 
        {/* iputpage의 호출로 인해 setAnalyzedData를 트리거하여 App.jsx의 analyzedData가 result 값으로 바뀜  */}
        
        <Route path="/review" element={<ReviewPage data={analyzedData} />} />
         {/* 창고에 저장된 값을 data로 전달  */}
        
        <Route path="/meetings" element={<MeetingListPage />} />
        <Route path="/meetings/:id" element={<MeetingDetailPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
