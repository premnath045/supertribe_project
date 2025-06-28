import { useEffect, useRef } from 'react'

function NotificationSound({ play = false, volume = 0.5 }) {
  const audioRef = useRef(null)
  
  useEffect(() => {
    if (play && audioRef.current) {
      audioRef.current.volume = volume
      audioRef.current.currentTime = 0
      
      audioRef.current.play().catch(err => {
        // Ignore autoplay errors - common in browsers
        console.log('Notification sound autoplay prevented:', err)
      })
    }
  }, [play, volume])
  
  return (
    <audio ref={audioRef} preload="auto">
      <source src="/notification-sound.mp3" type="audio/mpeg" />
    </audio>
  )
}

export default NotificationSound