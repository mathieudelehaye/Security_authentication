//jshint esversion:6
const express = require("express")
const bodyParser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")

const app = express()

app.use(express.static("public"))
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
  extended: true
}))

mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const userSchema = {
  email: String,
  password: String
}

const User = mongoose.model("User", userSchema)

app.get('/', function(req, res) {
  res.render("home")
})

app.route('/register')

  .get(function(req, res) {
    res.render("register")
  })

  .post(function(req, res) {
    const user = new User({
      email: req.body.username,
      password: req.body.password
    })
    user.save(function(err) {
      if (!err) {
        res.render("secrets")
      } else {
        console.log(err)
      }
    })
  })

app.route('/login')

  .get(function(req, res) {
    res.render("login")
  })

  .post(function(req, res) {
    const username = req.body.username
    const password = req.body.password

    User.findOne({
      email: username
    }, function(err, foundUser) {

      if (err) {
        console.log(err)
      } else {
        if (foundUser.password === password) {
          res.render("secrets")
        }
      }
    })
  })

app.listen(3000, function() {
  console.log("Server started on port 3000")
})
