import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { analyzeMeeting } from '../api.js'

function InputPage({ onAnalyzed }) {
  const [text, setText] = useState('')  // 입력창 내용
  const [loading, setLoading] = useState(false) // 분석 요청 진행 중 여부
  const [error, setError] = useState(null) // 분석 실패 시 보여줄 메시지
  const navigate = useNavigate() 

  async function handleAnalyze() {
    setLoading(true)
    setError(null)
    try {
      const result = await analyzeMeeting(text) // api.js의 analyzemeeting을 호출 (api.js에서 fetch로 /analyze 요청 )
      onAnalyzed({ ...result, raw_text: text }) // 저장 시 원문(raw_text)도 같이 담아서 App.jsx의 setAnalyzedData 실행
      navigate('/review') // navigate함수를 통해 /review 페이지로 이동 
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
  <div className="card">
    <p className="section-label">AI 구조화</p>

    <h2>회의록 입력</h2>

    <label
      htmlFor="meeting-text"
      style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap' }}
    >
      회의록 원문
    </label>
    <textarea
      id="meeting-text"
      value={text}                                            // 입력창에 지금 표시할 값 = text 상태값
      onChange={(e) => setText(e.target.value)}               // 타이핑할 때마다 실행되는 함수
      placeholder="회의록 원문을 붙여넣으세요."
      rows={12}
    />

    <button
      onClick={handleAnalyze}                                 // 클릭하면 handleAnalyze 함수 실행
      disabled={loading || !text}                             // 실행 이후 버튼을 다시 누르거나 아무것도 안 썼는데 누르는 경우 비활성화 되게끔 설정
    >
      {loading ? '분석 중...' : '분석하기'}
    </button>

    {error && <p style={{color: 'var(--text-h)', fontWeight: 500}}>{error}</p>}
  </div>
)
}

export default InputPage
