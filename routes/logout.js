// libraries
var express = require('express');

// modules
var User = require('../models/user');

var router = express.Router();

/* GET home page. */
router.get("/", (req, res) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.render("logout")
    });
});

module.exports = router;
