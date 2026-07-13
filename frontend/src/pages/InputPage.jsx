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
      onAnalyzed(result) // onAnalyzed(result)를 호출하여 App.jsx의 setAnalyzedData(result)를 실행
      navigate('/review') // navigate함수를 통해 /review 페이지로 이동 
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
  <>                                                        
    <h2>회의록 입력</h2>                                        

    <textarea 
      value={text}                                            // 입력창에 지금 표시할 값 = text 상태값
      onChange={(e) => setText(e.target.value)}               // 타이핑할 때마다 실행되는 함수
    />

    <button 
      onClick={handleAnalyze}                                 // 클릭하면 handleAnalyze 함수 실행
      disabled={loading || !text}                             // 실행 이후 버튼을 다시 누르거나 아무것도 안 썼는데 누르는 경우 비활성화 되게끔 설정 
    >
      {loading ? '분석 중...' : '분석하기'}                    
    </button>

    {error && <p>{error}</p>}                                  
  </>
)
}

export default InputPage
