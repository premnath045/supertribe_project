import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import FollowButton from './Actions/FollowButton'

function FollowersListItem({ user, isFollowing, onToggleFollow }) {
  const { user: currentUser } = useAuth()
  const isCurrentUser = currentUser && user.id === currentUser.id

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <Link to={`/user/${user.username}`} className="flex items-center space-x-3">
        <img
          src={user.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'}
          alt={user.display_name || user.username}
          className="w-11 h-11 rounded-full object-cover"
        />
        <div>
          <h4 className="font-semibold text-sm">{user.username}</h4>
          <p className="text-gray-500 text-sm">{user.display_name}</p>
        </div>
      </Link>
      
      {!isCurrentUser && (
        <FollowButton 
          isFollowing={isFollowing}
          onClick={() => onToggleFollow(user.id)}
          username={user.username}
          className="py-1.5 px-3 text-sm rounded-lg"
        />
      )}
    </div>
  )
}

export default FollowersListItem