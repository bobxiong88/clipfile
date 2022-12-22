// libraries
var express = require('express');

// modules
var User = require('../models/user');
var passport = require('../models/auth');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('login')
});

router.post(
  "/",
  passport.authenticate("local", {
      successRedirect: "/",
      failureRedirect: "/login"
  })
);

module.exports = router;
