// Constants for Story Creation Modal

export const STORY_MODES = {
  PHOTO: 'photo',
  VIDEO: 'video',
  TEXT: 'text',
  GALLERY: 'gallery'
}

export const PERMISSION_TYPES = {
  CAMERA: 'camera',
  MICROPHONE: 'microphone',
  PHOTOS: 'photos'
}

export const VIDEO_CONSTRAINTS = {
  MAX_DURATION: 60000, // 60 seconds
  QUALITY: {
    LOW: { width: 640, height: 480, frameRate: 15 },
    MEDIUM: { width: 1280, height: 720, frameRate: 30 },
    HIGH: { width: 1920, height: 1080, frameRate: 60 }
  }
}

export const CAMERA_CONSTRAINTS = {
  PHOTO: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 }
    // aspectRatio removed for better compatibility
  },
  VIDEO: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 }
  }  
}

export const TEXT_FONTS = [
  { name: 'Classic', className: 'font-sans', family: 'Inter' },
  { name: 'Modern', className: 'font-mono', family: 'SF Mono' },
  { name: 'Neon', className: 'font-sans font-bold', family: 'Inter' },
  { name: 'Typewriter', className: 'font-serif', family: 'Georgia' },
  { name: 'Strong', className: 'font-sans font-black', family: 'Inter' }
]

export const BACKGROUND_COLORS = [
  '#000000', '#1a1a1a', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
  '#ff3040', '#ff6b35', '#f7931e', '#ffcc02', '#9bc53d', '#5cb3cc', '#6264a7', '#8b5a96'
]

export const GRADIENT_BACKGROUNDS = [
  'linear-gradient(45deg, #833AB4, #FD1D1D)',
  'linear-gradient(45deg, #405DE6, #5851DB)',
  'linear-gradient(45deg, #F77737, #FCAF45)',
  'linear-gradient(45deg, #667eea, #764ba2)',
  'linear-gradient(45deg, #f093fb, #f5576c)',
  'linear-gradient(45deg, #4facfe, #00f2fe)',
  'linear-gradient(45deg, #43e97b, #38f9d7)',
  'linear-gradient(45deg, #fa709a, #fee140)'
]

export const TEXT_COLORS = [
  '#ffffff', '#000000', '#ff3040', '#ff6b35', '#f7931e', '#ffcc02',
  '#9bc53d', '#5cb3cc', '#6264a7', '#8b5a96'
]

export const ANIMATION_DURATIONS = {
  MODAL_ENTER: 0.3,
  MODAL_EXIT: 0.2,
  TAB_SWITCH: 0.2,
  BUTTON_PRESS: 0.1,
  CAMERA_FLIP: 0.4
}