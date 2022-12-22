// libraries
var mongoose = require('mongoose');
var express = require('express');
var fs = require('fs-extra');
var path = require('path');     //used for file path
var multer = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const crypto = require('crypto');

const { 
    v1: uuidv1,
    v4: uuidv4,
  } = require('uuid');

// models
var User = require('../models/user');
var passport = require('../models/auth');
var Text = require('../models/text');
var File = require('../models/file');
//var bucket = require('../models/gridfs'); 



var router = express.Router();

// multer
/*
const storage = multer.diskStorage({
    destination: './public/uploads/images/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + 
    path.extname(file.originalname));
    }
});
const upload = multer({storage: storage});
*/

// file stuff okay
// create storage engine
const url = 'mongodb+srv://bob:locallibrary@cluster0.63iyaw5.mongodb.net/local_library?retryWrites=true&w=majority';
const connect = mongoose.createConnection(url, { useNewUrlParser: true, useUnifiedTopology: true });
const storage = new GridFsStorage({
    url: url,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err);
                }
                const filename = buf.toString('hex') + path.extname(file.originalname);
                const fileInfo = {
                    filename: filename,
                    bucketName: 'uploads'
                };
                resolve(fileInfo);
            });
        });
    }
});
const upload = multer({ storage });
let gfs;
connect.once('open', () => {
    // initialize stream
    gfs = new mongoose.mongo.GridFSBucket(connect.db, {
        bucketName: "uploads"
    });
});

/* GET home page. */
router.get("/", async (req, res) => {
    var currentMessage = {message:""};
    if (req.user) currentMessage = await Text.findOne({username: req.user.username });
    if (!currentMessage) currentMessage = {message:""};
    res.render('index', {user: req.user, message: currentMessage.message});
});

// clipping new text
router.post("/", async (req, res) => {
    if (req.body.message.length > 10000){
        res.render('index', {user:req.user, errorMessage: "You've exceeded the 10000 character limit, please try again"});
        return ;
    }
    var currentMessage = await Text.findOne({username: req.user.username });
    console.log(currentMessage);
    if (currentMessage){
        await Text.updateOne(
            {username: req.user.username },
            {
                $set: {message: req.body.message}
            });
        res.render('index', {user: req.user, message: req.body.message});
        return ;
    }
    console.log(req.user.username, req.body.message);
    const text = new Text({
        username: req.user.username,
        message: req.body.message
    }).save();
    res.render('index', {user: req.user, message:req.body.message});
    return ;
});

// 

router.post("/clipfile", upload.array('clippedFile'), async(req, res) =>{
    /*
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        console.log("Uploading: " + filename);

        //Path where image will be uploaded
        fstream = fs.createWriteStream(__dirname + '/img/' + "bearjak.jpg");
        file.pipe(fstream);
        fstream.on('close', function () {    
            console.log("Upload Finished of " + filename);              
            res.redirect('back');           //where to go next
        });
    });
    
    console.log("ballsack");
    console.log(__dirname);
    console.log(req.body.file, req.body.file);
    console.dir(req.files);
    fstream = fs.createWriteStream(__dirname + '/img/' + 'bearjak.jpg');
    console.log(__dirname + '/img/' + 'bearjak.jpg');
    //fs.createReadStream(__dirname+'/../uploads/bearjak.jpg').pipe(bucket.openUploadStreamWithId(uuidv4(), 'bearjak.jpg', {chunkSizeBytes: 1048576}));
    */
    
    /*
    var currentMessage = {message:""};
    if (req.user) currentMessage = await Text.findOne({username: req.user.username });
    if (!currentMessage) currentMessage = {message:""};
    res.render('index', {user: req.user, message: currentMessage.message});
*/
    //return ;
    
    for (const file of req.files){
        const newFile = new File({
            username: req.user.username,
            fileId: file.id,
            fileName: file.originalname
        }).save();
    };
    console.dir(req.files);
    res.redirect("/..");
});

module.exports = router;
