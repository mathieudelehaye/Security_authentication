//jshint esversion:6
require('dotenv').config()
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
// const encrypt = require("mongoose-encryption") // 1/ Authentication with encryption key and environment variable
// const md5 = require('md5') // 2/ Authentication with hash function
// const bcrypt = require('bcrypt') // 3/ Hashing and salting password
// 4/ Cookies and session
const session = require("express-session")
const passport = require("passport")
const passportLocalMongoose = require("passport-local-mongoose")
// 5/ Google oauth authentication
const GoogleStrategy = require("passport-google-oauth20").Strategy
const findOrCreate = require("mongoose-findorcreate")

// const saltRounds = 10 // 3/ Hashing and salting password

const app = express()

app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
  extended: true
}))

// 4/ Cookies and session
app.use(session({
  secret: 'Our little secret.',
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
})

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String
})

// 1/ Authentication with encryption key and environment variable
// userSchema.plugin(encrypt, {
//   secret: process.env.SECRET,
//   encryptedFields: ["password"]
// })

// 4/ Cookies and session
userSchema.plugin(passportLocalMongoose)

// 5/ Google oauth authentication
userSchema.plugin(findOrCreate)

const User = mongoose.model("User", userSchema)

passport.use(User.createStrategy())

// passport.serializeUser(User.serializeUser())
// passport.deserializeUser(User.deserializeUser())

// 5/ Google oauth authentication: user (de)serialization must comprise another Strategy than the local one
passport.serializeUser(function(user, done) {
  done(null, user.id);
})

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user)
  })
})

// 5/ Google oauth authentication
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile)

    User.findOrCreate({
      googleId: profile.id
    }, function(err, user) {
      return cb(err, user)
    })
  }
))

app.get('/', function(req, res) {
  res.render("home")
})

app.route('/register')

  .get(function(req, res) {
    res.render("register")
  })

  .post(function(req, res) {

    // 4/ Cookies and session
    User.register({
      username: req.body.username
    }, req.body.password, function(err, user) {
      if (err) {
        console.log(err)
        res.redirect("/register")
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/secrets")
        })
      }
    })

    // console.log(req.body.password)
    //
    // // 3/ Hashing and salting password
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //
    //   console.log(hash)
    //
    //   const user = new User({
    //     email: req.body.username,
    //     // password: req.body.password  // 1/ Authentication with encryption key and environment variable
    //     // password: md5(req.body.password) // 2/ Authentication with hash function
    //     password: hash // 3/ Hashing and salting password
    //   })
    //   user.save(function(err) {
    //     if (!err) {
    //       res.render("secrets")
    //     } else {
    //       console.log(err)
    //     }
    //   })
  })

// 5/ Google oauth authentication
app.route("/auth/google")

  .get(passport.authenticate(
    "google", {
      scope: ["profile"]
    }
  ))

app.get("/auth/google/secrets",
  passport.authenticate('google', {
    failureRedirect: "/login"
  }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets")
  })

// 4/ Cookies and session
app.route('/secrets')

  .get(function(req, res) {

    if (req.isAuthenticated()) {
      res.render("secrets")
    } else {
      res.redirect("/login")
    }

  })

// 4/ Cookies and session
app.route('/login')

  .get(function(req, res) {
    res.render("login")
  })

  .post(function(req, res) {

    const user = new User({
      username: req.body.username,
      password: req.body.password
    })

    req.login(user, function(err) {
      if (err) {
        console.log(err)
      } else {
        passport.authenticate("local")(req, res, function() {
          res.redirect("/secrets")
        })
      }
    })

    // const username = req.body.username
    // const password = req.body.password
    //
    // User.findOne({
    //   email: username
    // }, function(err, foundUser) {
    //
    //   if (err) {
    //     console.log(err)
    //   } else {
    //     // if (foundUser.password === md5(req.body.password)) { // 2/ Authentication with hash function
    //     // 3/ Hashing and salting password
    //     bcrypt.compare(password, foundUser.password, function(err, result) {
    //       if (result === true) {
    //         res.render("secrets")
    //       }
    //     })
    //   }
    // })
  })

app.route('/logout')

  .get(function(req, res) {
    req.logout();
    res.redirect('/');
  })

app.listen(3000, function() {
  console.log("Server started on port 3000")
})
