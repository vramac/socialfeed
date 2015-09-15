let mongoose = require('mongoose')
let crypto = require('crypto')
let nodeify = require('bluebird-nodeify')

let SALT = 'CodePathHeartNodeJS'

let userSchema = mongoose.Schema({
   local: {
      email: String,
      password: String
    },
    facebook: {
      id: String,
      token: String,
      email: String,
      name: String
    },
    twitter: {
      id: String,
      token: String,
      secret: String,
      username: String,
      displayName: String
    },
    google: {
      id: String,
      token: String,
      email: String,
      name: String
    },
})

userSchema.methods.generateHash = async function(password) {
    return (await crypto.promise.pbkdf2(password, SALT, 4096, 512, 'sha256')).toString('hex')
}

userSchema.methods.validatePassword = async function(password) {
  let passwordHash = (await crypto.promise.pbkdf2(password, SALT, 4096, 512, 
    'sha256')).toString('hex')
    if (passwordHash !== this.local.password) {
      return false
    }
    return true
}

userSchema.pre('save', function(callback) {
  console.log("this.isModified: " + this)
  nodeify(async () => {
    if (!this.isModified('local.password')) {
      return callback()
    }
    this.local.password = await this.generateHash(this.local.password)
    console.log("this.password: hash" + this.local.password)
  }(), callback)
})

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

userSchema.methods.linkAccount = function(type, values) {
  return this['link'+capitalize(type)+'Account'](values)
}

userSchema.methods.linkLocalAccount = function({email, password}) {
  throw new Error('Not Implemented.')
}

userSchema.methods.linkFacebookAccount = function({account, token}) {
  this.facebook.id= account.id
  this.facebook.name = account.displayName
  this.facebook.token = token
}

userSchema.methods.linkTwitterAccount = function({account, token}) {
  this.twitter.id= account.id
  this.twitter.username = account.username
  this.twitter.displayName = account.displayName
  this.twitter.token = token 
}

userSchema.methods.linkGoogleAccount = function({account, token}) {
  this.google.id= account.id
  this.google.name = account.displayName
  this.google.email = account.email
  this.google.token = token
}

userSchema.methods.linkLinkedinAccount = function({account, token}) {
  throw new Error('Not Implemented.')
}

userSchema.methods.unlinkAccount = function(type) {
  throw new Error('Not Implemented.')
}

module.exports = mongoose.model('User', userSchema)
