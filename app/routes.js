let isLoggedIn = require('./middlewares/isLoggedIn')
let then = require('express-then')
let Twitter = require('twitter')
let posts = require('../data/posts')

require('songbird')

module.exports = (app) => {
    let passport = app.passport
    let twitterConfig = app.config.auth.twitter

    let networks =  {
        twitter: {
            network: {
                icon: 'twitter',
                name: 'Twitter',
                class: 'btn-info'
            } 
        }
    }

    app.get('/', (req, res) => res.render('index.ejs'))

    app.get('/profile', isLoggedIn, (req, res) => {
        res.render('profile.ejs', {
            user: req.user,
            message: req.flash('error')
        })
    })

    app.get('/logout', (req, res) => {
        req.logout()
        res.redirect('/')
    })

    app.get('/login', (req, res) => {
        res.render('login.ejs', {message: req.flash('error')})
    })

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/profile',
        failureRedirect: '/login',
        failureFlash: true
    }))

    app.get('/signup', (req, res) => {
        res.render('signup.ejs', {message: req.flash('error') })
    })

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/profile',
        failureRedirect: '/signup',
        failureFlash: true
    }))

    app.get('/timeline', isLoggedIn, then (async (req, res) => {
        let token_secret = 'QBuzrhqoCKaHKAoIMFHsrVbllXpOZiGNimynlAD3wfzPw'
        try {
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: token_secret
        })

        // console.log("twitterConfig ", twitterConfig) 
        // console.log("twitterClient ", twitterClient) 
        // console.log("twitter token: " + req.user.twitter.token)
        // console.log("token_secret: " + token_secret)

        let [tweets] = await twitterClient.promise.get('statuses/home_timeline')
        //console.log("tweets: ", tweets)
        tweets = tweets.map( tweet => {
            return {
            id: tweet.id_str,
            image: tweet.user.profile_image_url,
            text: tweet.text,
            name: tweet.user.name,
            username: '@' + tweet.user.screen_name,
            liked: tweet.favorited,
            network: networks.twitter
        }
        })

           res.render('timeline.ejs', {
            posts: tweets 
        })

    }catch (e) {
        console.log(e.stack)
    }    
    }))

    app.get('/compose', (req, res) => {
        res.render('compose.ejs', {message: req.flash('error')})
    })


    app.post('/compose', isLoggedIn, then (async (req, res) => {
        let status = req.body.text
       
        let token_secret = 'QBuzrhqoCKaHKAoIMFHsrVbllXpOZiGNimynlAD3wfzPw'
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: token_secret
        })

        if (!status) {
            req.flash('error', 'status cannot be empty')
        }
        if (status.length > 140) {
            return req.flash('error', 'status is more than 140 characters')
        }
        await twitterClient.promise.post('statuses/update',{status})
        res.redirect('timeline')
    }))

    app.post('/like/:id', isLoggedIn, then (async (req, res) => {
        let token_secret = 'QBuzrhqoCKaHKAoIMFHsrVbllXpOZiGNimynlAD3wfzPw'
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: token_secret
        })
        let id = req.params.id
        await twitterClient.promise.post('favorites/create',{id})
        res.end()
    }))

    app.post('/unlike/:id', isLoggedIn, then (async (req, res) => {
        let token_secret = 'QBuzrhqoCKaHKAoIMFHsrVbllXpOZiGNimynlAD3wfzPw'
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: token_secret
        })
        let id = req.params.id
        await twitterClient.promise.post('favorites/destroy',{id})
        res.end()
    }))

    app.get('/share/:id', then (async (req, res) => {
        let id = req.params.id
        try {
        let token_secret = 'QBuzrhqoCKaHKAoIMFHsrVbllXpOZiGNimynlAD3wfzPw'
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: token_secret
        })
        let uri = 'statuses/show/' + id
        let [tweet] = await twitterClient.promise.get(uri)
        let post = {
            id : tweet.id_str,
            image: tweet.user.profile_image_url,
            text: tweet.text,
            name: tweet.user.name,
            username: '@'+tweet.user.screen_name,
            liked: tweet.favorited,
            network: networks.twitter
        }

        res.render('share.ejs', {
            post: post,
            message: req.flash('error')
        })
    }
    catch (e) {
        console.log(e.stack)
    } 
    }))

    app.post('/share/:id', isLoggedIn, then (async (req, res) => {
     
        let id = req.params.id
        let share = req.body.share

        console.log("Reply Id: ", id)
        console.log("Reply text: ", share)
       
        let token_secret = 'QBuzrhqoCKaHKAoIMFHsrVbllXpOZiGNimynlAD3wfzPw'
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: token_secret
        })

        let uri = 'statuses/retweet/' +  id
        console.log("uri: ", uri)
 
        //let [tweet] = await twitterClient.promise.post(uri)
        //await twitterClient.promise.post('statuses/retweet/',{'id':643607386016497664})

        // await twitterClient.promise.post('statuses/update',{'status':reply,
        //     'in_reply_to_status_id_str':id})

        //try {
            await twitterClient.promise.post(uri,{ status: share})
        // }
        // catch (e) {
        //     console.log('error ', e)
        // }   
        
        console.log("Successfully re-tweeted...")
        res.redirect('/timeline')
    
    }))

    app.get('/reply/:id', isLoggedIn, then (async (req, res) => {
        let in_reply_to_status_id = req.params.id
        console.log("Reply Id: ", in_reply_to_status_id)
        try {
        let token_secret = 'QBuzrhqoCKaHKAoIMFHsrVbllXpOZiGNimynlAD3wfzPw'
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: token_secret
        })

        let [tweet] = await twitterClient.promise.get(uri)
        let post = {
                id : tweet.id_str,
                image: tweet.user.profile_image_url,
                text: tweet.text,
                name: tweet.user.name,
                username: '@'+tweet.user.screen_name,
                liked: tweet.favorited,
                network: networks.twitter
        }
        res.render('reply.ejs', {
             post: post,
            message: req.flash('error')
        })
    }
    catch (e) {
        console.log(e.stack)
    } 
    }))

    app.post('/reply/:id', isLoggedIn, then (async (req, res) => {
        let id = req.params.id
        let reply = req.body.reply

        console.log("Reply Id: ", id)
        console.log("Reply text: ", reply)
       
        let token_secret = 'QBuzrhqoCKaHKAoIMFHsrVbllXpOZiGNimynlAD3wfzPw'
        let twitterClient = new Twitter({
            consumer_key: twitterConfig.consumerKey,
            consumer_secret: twitterConfig.consumerSecret,
            access_token_key: req.user.twitter.token,
            access_token_secret: token_secret
        })

        // await twitterClient.promise.post('statuses/update',{'status':reply,
        //     'in_reply_to_status_id_str':id})

        await twitterClient.promise.post('/statuses/update', {
            status : reply,
            in_reply_to_status_id: id
        });

        res.redirect('/timeline')
    }))

    // Scope specifies the desired data fields from the user account
    let scope = 'email'

    // Authentication route & Callback URL
    app.get('/auth/facebook', passport.authenticate('facebook', {scope}))
    
    app.get('/auth/facebook/callback', passport.authenticate('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    // Authorization route & Callback URL
    app.get('/connect/facebook', passport.authorize('facebook', {scope}))
    app.get('/connect/facebook/callback', passport.authorize('facebook', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

     // Authentication route & Callback URL
    app.get('/auth/twitter', passport.authenticate('twitter', {scope}))
    
    app.get('/auth/twitter/callback', passport.authenticate('twitter', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    // Authorization route & Callback URL
    app.get('/connect/twitter', passport.authorize('twitter', {scope}))
    app.get('/connect/twitter/callback', passport.authorize('twitter', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    scope = ['email', 'profile']

    app.get('/auth/google', passport.authenticate('google', {scope}))
    
    app.get('/auth/google/callback', passport.authenticate('google', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

    // Authorization route & Callback URL
    app.get('/connect/google', passport.authorize('google', {scope}))
    app.get('/connect/google/callback', passport.authorize('google', {
        successRedirect: '/profile',
        failureRedirect: '/profile',
        failureFlash: true
    }))

}
