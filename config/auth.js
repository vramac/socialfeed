// config/auth.js
module.exports = {
  'development': {
    'facebook': {
      'consumerKey': '...',
      'consumerSecret': '...',
      'callbackUrl': '...'
    },
    'twitter' : {
        'consumerKey': 'hJYCuEKzJ11Izvn7YpYBEuxOB',
        'consumerSecret': 'SkxpA31RzCr3viL8KFdjUfqt70lymnDYyZ0axK1PbOkUTFDpVq',
        'callbackUrl': 'http://socialfeed.com:8000/auth/twitter/callback'
    },
    'google': {
      'consumerKey': '446585441765-unda5mjs6307q1pqobvhiqj87m9m2kh1.apps.googleusercontent.com',
      'consumerSecret': '...',
      'callbackUrl': 'http://social-authenticator.com:8000/auth/google/callback'
    }
  }
}
