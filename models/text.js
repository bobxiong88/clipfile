var mongoose = require('mongoose');

var Schema = mongoose.Schema;

const mongoDb = 'mongodb+srv://bob:locallibrary@cluster0.63iyaw5.mongodb.net/local_library?retryWrites=true&w=majority';
mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));

module.exports = mongoose.model(
    "Text",
    new Schema({
        username: { type: String, required: true },
        message: { type: String, required: true}
    })
);