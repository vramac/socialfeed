let passport = require('passport')
let LocalStrategy = require('passport-local').Strategy
let FacebookStrategy = require('passport-facebook').Strategy
let TwitterStrategy = require('passport-twitter').Strategy
let GoogleStrategy = require('passport-google-oauth').OAuthStrategy
let nodeifyit = require('nodeifyit')
let auth = require('../../config/auth')
let User = require('../models/user')
let util = require('util')

require('songbird')

function useExternalPassportStrategy(OauthStrategy, config, field) {

  console.log("config: " + config)

  config.passReqToCallback = true
  passport.use(new OauthStrategy(config, nodeifyit(authCB, {spread: true})))

  async function authCB(req, token, _ignored_, account) {
      // 1. Load user from store
      // 2. If req.user exists, we're authorizing (connecting an account)
      // 2a. Ensure it's not associated with another account
      // 2b. Link account
      // 3. If not, we're authenticating (logging in)
      // 3a. If user exists, we're logging in via the 3rd party account
      // 3b. Otherwise create a user associated with the 3rd party account

      console.log("Acct: " , account)
      console.log("_ignored_: " , _ignored_)
      
      let user = await User.promise.findOne({})
    if (req.user) {
      user.linkAccount(account.provider, {account: account, token: token})
      return user
    }
    else {

      if (!user) {

        //  create the user
        user = new User()
      }
      user.linkAccount(account.provider, {account: account, token: token})
      await user.save()
      return user
    }
  }
}

function configure(config) {
  // Required for session support / persistent login sessions
  passport.serializeUser(nodeifyit(async (user) => user._id))
  passport.deserializeUser(nodeifyit(async (id) => {
      return await User.promise.findById(id)
    }))

  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'linkedin')
  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'facebook')
  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'google')
  // useExternalPassportStrategy(LinkedInStrategy, {...}, 'twitter')
  // passport.use('local-login', new LocalStrategy({...}, (req, email, password, callback) => {...}))
  // passport.use('local-signup', new LocalStrategy({...}, (req, email, password, callback) => {...}))

  useExternalPassportStrategy(FacebookStrategy, {
    clientID: config['facebook'].consumerKey,
    clientSecret: config['facebook'].consumerSecret,
    callbackURL: config['facebook'].callbackUrl
  }, 'facebook')

  useExternalPassportStrategy(TwitterStrategy, {
    consumerKey: config['twitter'].consumerKey,
    consumerSecret: config['twitter'].consumerSecret,
    callbackURL: config['twitter'].callbackUrl
  }, 'twitter')

  // passport.use(new GoogleStrategy({
  //   consumerKey: auth['google'].consumerKey,
  //   consumerSecret: auth['google'].consumerSecret,
  //   callbackURL: auth['google'].callbackUrl
  // },'google')



  passport.use('local-login', new LocalStrategy({

      // Use "email" field instead of "username"
      usernameField: 'email',
      failureFlash: true
    }, nodeifyit(async (email, password) => {
      let user = await User.promise.findOne({'local.email':email})
      console.log("User: " + user +", email: " + email)
      if (!user || email !== user.local.email) {
        return [false, {message: 'Invalid email'}]
      }

      if (!await user.validatePassword2(password)) {
        return [false, {message: 'Invalid password'}]
      }
      return user
    }, {spread: true})))

  passport.use('local-signup', new LocalStrategy({
      usernameField: 'email',
      failureFlash: true,
      passReqToCallback: true
    }, nodeifyit(async (req, email, password) => {
        
        console.log("signing up. Email: " + email + ", password: " + password)

        email = (email || '').toLowerCase()

        // Is the email taken?
        if (await User.promise.findOne({email})) {
          return [false, {message: 'That email is already taken.'}]
        }

        // create the user
        let user = new User()
        user.local.email = email
        user.local.password = password

        try {

            // save the user in DB
            return await user.save()
        }
        catch (e) {
          console.log(util.inspect(e))
          return [false, {message: e.message}]
        }
    }, {spread: true})))

  return passport
}

module.exports = {passport, configure}
