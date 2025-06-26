import { motion } from 'framer-motion'
import { FiEdit3, FiCamera } from 'react-icons/fi'

function ProfileHeader({
  profileData, 
  isOwnProfile, 
  isEditing, 
  editForm, 
  editErrors, 
  handleEditInputChange,
  stats,
  onOpenFollowers,
  onOpenFollowing
}) {
  return (
    <div className="flex items-center space-x-6 mb-6">
      <div className="relative">
        {isEditing ? (
          <div className="relative group">
            <img
              src={editForm.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'}
              alt={editForm.display_name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              onError={(e) => {
                e.target.src = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
              }}
            />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer">
              <div className="bg-white/90 rounded-full p-2">
                <FiCamera className="text-gray-700 text-lg" />
              </div>
            </div>
            <button className="absolute -bottom-1 -right-1 bg-primary-500 hover:bg-primary-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200">
              <FiEdit3 className="text-sm" />
            </button>
          </div>
        ) : (
          <img
            src={profileData.avatar_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'}
            alt={profileData.display_name}
            className="w-20 h-20 rounded-full object-cover"
            onError={(e) => {
              e.target.src = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
            }}
          />
        )}
        {profileData.user_type === 'creator' && profileData.is_verified && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 border-3 border-white rounded-full flex items-center justify-center">
            <span className="text-white text-xs">✓</span>
          </div>
        )}
      </div>
      
      <div className="flex-1">
        {isEditing ? (
          <div className="text-sm text-gray-600">
            <p>Edit your profile information below</p>
          </div>
        ) : (
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <h1 className="text-xl font-bold text-gray-900">{profileData.display_name}</h1>
              {profileData.user_type === 'creator' && profileData.is_verified && (
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </div>
            <p className="text-gray-600 mb-3">@{profileData.username}</p>
          </div>
        )}
        
        {/* Stats (merged from ProfileStats component) */}
        <div className="flex space-x-6 text-sm">
          <div className="text-center">
            <div className="font-bold text-gray-900">{stats.postCount}</div>
            <div className="text-gray-600">Posts</div>
          </div>
          <div className="text-center cursor-pointer" onClick={onOpenFollowers}>
            <div className="font-bold text-gray-900">{stats.followerCount}</div>
            <div className="text-gray-600">Followers</div>
          </div>
          <div className="text-center cursor-pointer" onClick={onOpenFollowing}>
            <div className="font-bold text-gray-900">{stats.followingCount}</div>
            <div className="text-gray-600">Following</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader