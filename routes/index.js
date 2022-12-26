// libraries
var mongoose = require('mongoose');
var express = require('express');
var fs = require('fs-extra');
var path = require('path');     //used for file path
var multer = require('multer');
const {GridFsStorage} = require('multer-gridfs-storage');
const crypto = require('crypto');
var ObjectId = require('mongodb').ObjectID;

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

async function get_files(req){
    var files = await File.find({username: req.user.username });
    return files;
}

/* GET home page. */
router.get("/", async (req, res) => {
    // get clipped text
    var message = "";
    var currentMessage;
    if (req.user) currentMessage = await Text.findOne({username: req.user.username });
    if (currentMessage) message = currentMessage.message; 

    // get clipped files
    var files = [];
    if (req.user) var files = await get_files(req);
    console.log(files);

    res.render('index', {user: req.user, message: message, files: files});
});

// clipping new text
router.post("/", async (req, res) => {
    // make sure text is less than 10000 characters

    var received = await req.body.message;

    var len = await received.length;

    if (len > 10000){
        res.render('index', {user:req.user, 
            errorMessage: "You've exceeded the 10000 character limit, please try again", files: get_files(req)});
        return ;
    }

    // get previous message
    var currentMessage = await Text.findOne({username: req.user.username });
    console.log(currentMessage);

    // previous message exist
    if (currentMessage){
        await Text.updateOne(
            {username: req.user.username },
            {
                $set: {message: received}
            });
        res.redirect("/.");
        // res.render('index', {user: req.user, message: req.body.message});
        return ;
    }

    // no previous message
    console.log(req.user.username, received);
    const text = new Text({
        username: req.user.username,
        message: received
    }).save();
    res.redirect("/.")
    //res.render('index', {user: req.user, message:req.body.message});
    return ;
});

// upload files
router.post("/clipfile", upload.array('clippedFile'), async(req, res) =>{
    for (const file of req.files){
        const newFile = new File({
            username: req.user.username,
            id: file.id,
            name: file.originalname,
            filename: file.filename
        }).save();
    };
    console.dir(req.files);
    res.redirect("/..");
});

router.get("/download/:filename/:name", async (req,res)=>{
    console.log(req.params.filename);
    gfs.find({filename: req.params.filename}).toArray((err, files) => {
        if (!files[0] || files.length == 0) {
            return res.status(200).json({
                success: false,
                message: 'No files available',
            });
        }
        gfs.openDownloadStreamByName(req.params.filename).pipe(res);
        return ;
    });
});

router.post("/delete/:id", async(req,res)=>{
    console.log("AHHHHHHHHHHHHHHHHHHHH")
    console.log(req.params.id);
    await File.deleteOne({id: req.params.id});
    var fileId = await new mongoose.Types.ObjectId(req.params.id);
    gfs.delete(fileId);
    res.redirect("/../..");
    return ;
});

module.exports = router;
