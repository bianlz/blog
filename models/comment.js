/**
 * Created by bianlz on 2014/11/2.
 */
var mongodb = require('mongodb').Db;
var settings = require('../settings');
function Comment(name,title,day,comment){
    this.name = name,
    this.title = title,
    this.day = day,
    this.comment = comment
}
module.exports = Comment;
Comment.prototype.save = function(callback){
    var name = this.name,
        day=this.day,
        title=this.title,
        head = this.head,
        comment = this.comment;
    mongodb.connect(settings.url,function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                db.close();
                return callback(err);
            }
            collection.update({
                "name":name,
                "time.day":day,
                "title":title
            },{$push:{"comments":comment}},function(err){
                db.close();
                if(err){
                    return callback(err);
                }
                return callback(null);
            });
        });
    });
}
