// libraries
var express = require('express');
var bcrypt = require('bcryptjs');

// modules
var User = require('../models/user');
var passport = require('../models/auth');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('signup', {errorMessage: ""})
});

router.post('/', async(req,res,next) => {
    var exists = await User.findOne({username: req.body.username });
    if (exists){
        res.render('signup', {errorMessage: "Username exists"});
        return; 
    }
    if (req.body.password!=req.body.confirm){
        res.render('signup', {errorMessage: "Passwords do not match"});
        return ;
    }
    req.body.password = await bcrypt.hash(req.body.password, 10);
    const user = new User({
        username: req.body.username,
        password: req.body.password
    }).save(err => {
        if (err) { 
        return next(err);
        }
        res.redirect("/");
    });
});
module.exports = router;
