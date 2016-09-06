
var mongoose = require('mongoose');
mongoose.Promise = Promise;
var settings= require('../settings');
var ObjectId = mongoose.Schema.Types.ObjectId;
mongoose.connect(settings.dbUrl);
var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String,
    avatar: String
});
var UserModel = mongoose.model('User',UserSchema);

var ArticleSchema = new mongoose.Schema({
    title: String,
    content: String,
    pv:{type:Number,default:0},

    comments:[{user:{type:ObjectId,ref:'User'},
        createAt:{type:Date,default:Date.now()},content:String}],
    user: {type: ObjectId, ref: 'User'},
    createAt: {type: Date, default: Date.now()}
});

var ArticleModel = mongoose.model('Article',ArticleSchema);

global.Model = function(modelName){
   return mongoose.model(modelName);
}
