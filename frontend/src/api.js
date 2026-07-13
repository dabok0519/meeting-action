const API_BASE = "http://localhost:8000"
const DEFAULT_TIMEOUT = 15000   // meetings CRUD용
const ANALYZE_TIMEOUT = 90000   // /analyze용 (백엔드 내부 재시도 감안)


// fetch가 브라우저에 요청을 위임해 비동기로 통신하고 async/await를 통해 그 결과를 함수 내에서 통제 
async function request(path, { method = "GET", body, timeout = DEFAULT_TIMEOUT } = {}) { // 조회시에는 옵션({METHOD~})이 필요 없기 때문에 ={}를 통해 기본값 설정  
  const controller = new AbortController() // 타임아웃시 fetch를 중단시키기 위해 취소 버튼 생성  
  const timer = setTimeout(() => controller.abort(), timeout) // 각 요청별로 타임아웃 초과시 강제 종료 실행 
                                                              // fetch 함수가 무한 로딩되지 않도록 방어  
  try {
    const res = await fetch(`${API_BASE}${path}`, { // 브라우저 백그라운드에 통신을 위임하고, 데이터가 올 때까지 이 request 함수를 일시 정지(비동기)
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,  // body(내용물)가 존재할 때만 백엔드가 읽을 수 있게 설정 
                                                                           // Content타입이 json이라는 것을 명시하여 Fast api에게 json 구조임을 확인시킨 후 
                                                                           //  백엔드의 pydantic이 역직렬화를 통해 파이썬 객체로 변환 

      body: body ? JSON.stringify(body) : undefined, // 백엔드에 보낼 데이터가 존재하면 body 내용을 직렬화하여 보냄 <-> 보낼 데이터가 없는 경우 비우기 
      signal: controller.signal, // timeout시에 브라우저의 백그라운드 fetch 통신을 강제 종료(취소)하기 위한 신호선 연결
    })
    if (!res.ok) throw new Error(`API 요청 실패: ${method} ${path} (${res.status})`) // api 통신이 정상적으로 처리되지 않는 경우 에러 강제 발생 
    return res.status === 204 ? null : res.json( ) // 삭제시에는 돌려줄 데이터가 없기 때문에 파싱을 시도하지 않고 null 반환 
  } finally {
    clearTimeout(timer) // 통신이 시간 내에 끝나면 설정해놓은 타이머 제거
  }
}




// 실제 요청/에러처리/타임아웃 로직은 공통 함수 request()에 위임하고 이 함수는 경로(/analyze) & 메서드(POST) & 보낼 데이터(text)만 지정

export function analyzeMeeting(text) { 
  return request("/analyze", { method: "POST", body: { text }, timeout: ANALYZE_TIMEOUT })
}

export function saveMeeting(meetingData) {
  return request("/meetings", { method: "POST", body: meetingData })
}

export function getMeetings() {
  return request("/meetings")
}

export function getMeeting(id) {
  return request(`/meetings/${id}`) // 백틱 기호를 통해 id 삽입 가능하게 설정 
}

export function updateMeeting(id, data) {
  return request(`/meetings/${id}`, { method: "PUT", body: data })
}

export function deleteMeeting(id) {
  return request(`/meetings/${id}`, { method: "DELETE" })
}

export function updateActionItem(id, data) {
  return request(`/action-items/${id}`, { method: "PUT", body: data })
}

export function deleteActionItem(id) {
  return request(`/action-items/${id}`, { method: "DELETE" })
}
