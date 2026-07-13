import { useParams } from 'react-router-dom'

function MeetingDetailPage() {
  const { id } = useParams()
  return (
    <>
      <h2>회의록 상세</h2>
      <p>id: {id}</p>
    </>
  )
}

export default MeetingDetailPage
