/**
 * Created by bianlz on 2014/10/30.
 */
var mongodb = require('mongodb').Db;
var settings = require('../settings');
var markdown = require('markdown').markdown;
function Post(name,head,title,tags,post){
    this.name = name;
    this.title = title;
    this.post = post;
    this.tags = tags;
    this.head = head;
}
module.exports = Post;
Post.prototype.save = function(callback){
    var date = new Date();
    var time = {
        date :date,
        year : date.getFullYear(),
        month :date.getFullYear() +'-'+(date.getMonth()+1),
        day : date.getFullYear() + '-' +(date.getMonth()+1) +"-"+(date.getDate()<10?("0"+date.getDate()):date.getDate())
    }
    var post = {
        title : this.title,
        name :this.name,
        head : this.head,
        time : time,
        post : this.post,
        tags : this.tags,
        reprint_info:{},
        comments :[],
        pv:0
    }
    mongodb.connect(settings.url,function(err,db){
        if(err){
            callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                db.close();
                return callback(err);
            }
            collection.insert(post,{safe:true},function(err){
                db.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            });
        });
    });
}
Post.getAll = function(name,callback){
    mongodb.connect(settings.url,function(err,db){
        if(err){
            db.close();
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                db.close();
                return callback(err);
            }
            var query = {};
            if(name){
                query.name = name;
            }
            collection.find(query).sort({time:-1}).toArray(function(err,docs){
                db.close();
                if(err){
                    return callback(err);
                }
                docs.forEach(function(doc){
                    doc.post = markdown.toHTML(doc.post);
                })
                callback(null,docs);
            });
    });
    });
}

Post.getOne = function(name,day,title,callback){
    mongodb.connect(settings.url,function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                db.close();
                return callback(err);
            }

            collection.findOne({
                "name":name,
                "time.day":day,
                "title":title
            },function(err,doc){
                if(err){
                    db.close();
                    return callback(err);
                }
                if(doc){
                    collection.update({
                        "name":name,
                        "time.day":day,
                        "title":title
                    },{
                        $inc:{"pv":1}
                    },function(err){
                      db.close();
                      if(err){
                          return callback(err);
                      }
                    });
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function(comment){
                        comment.content = markdown.toHTML(comment.content);
                    });
                }else{
                    db.close();
                }
                callback(null,doc);
            });
        });
    });
}
Post.edit = function(name,day,title,callback){
    mongodb.connect(settings.url,function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                db.close();
                return callback(err);
            }

            collection.findOne({
                "name":name,
                "time.day":day,
                "title":title
            },function(err,doc){
                db.close();
                if(err){
                    return callback(err);
                }
                callback(null,doc);
            });
        });
    });
}
Post.update=function(name,day,title,post,callback){
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
            },{$set:{"post":post}},function(err){
                db.close();
                if(err){
                   return callback(err);
                }
                return callback(null);
            });
        });
    });
}
Post.remove=function(name,day,title,callback){
    mongodb.connect(settings.url,function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                db.close();
                return callback(err);
            }
            collection.fineOne({
                "name":name,
                "time.day":day,
                "title":title
            },function(err,doc){
                if(err){
                    db.close();
                    return callback(err);
                }
                var reprint_from = "";
                if(doc.reprint_info.reprint_from){
                    reprint_from = doc.reprint_info.reprint_from;
                }
                if(reprint_from!=""){
                    collection.update({
                        "name":reprint_from.name,
                        "time.day":reprint_from.day,
                        "title":reprint_from.title
                    },{
                        $pull:{
                            "reprint_info.reprint_to":{
                                "name":name,
                                "day":day,
                                "title":title
                            }
                        }
                    },function(err){
                        if(err){
                           db.close();
                           return callback(err);
                        }
                    })
                }

                collection.remove({
                    "name":name,
                    "time.day":day,
                    "title":title
                },{w:1},function(err){
                    db.close();
                    if(err){
                        return callback(err);
                    }
                    return callback(null);
                })
            });
        });
    });
}
Post.getTen = function(name,page,callback){
    mongodb.connect(settings.url,function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                db.close();
                return callback(err);
            }
            var query = {};
            if(name){
                query = {"name":name};
            }
            collection.count(query,function(err,total){
                collection.find(query,{
                    skip:(page-1)*10,
                    limit:10
                }).sort({"time":-1}).toArray(function(err,docs){
                       db.close();
                       if(err){
                          return callback(err);
                       }
                    docs.forEach(function(doc){
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null,docs,total)
                });
            });
        });
    });
}
Post.getArchive = function(callback){
    mongodb.connect(settings.url,function(err,db){
        if(err){
            callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                db.close();
                return callback(err);
            }
            collection.find({},{
                "name":1,
                "title":1,
                "time":1
            }).sort({time:-1}).toArray(function(err,docs){
                db.close();
                if(err){
                    return callback(err);
                }
                return callback(null,docs);
            });
        });
    });
}
Post.getTags = function(callback){
    mongodb.connect(settings.url,function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                db.close();
                return callback(err);
            }
            collection.distinct('tags',function(err,tags){
                db.close();
                if(err){
                    return callback(err);
                }
                return callback(null,tags);
            });
        });
    });
}
Post.getTag = function(tag,callback){
    mongodb.connect(settings.url,function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                db.close();
                return callback(err);
            }
            collection.find({
                tags:tag
            },{
                name:1,
                title:1,
                time:1
            }).sort({
                time:-1
            }).toArray(function(err,posts){
                db.close();
                if(err){
                    return callback(err);
                }
                callback(null,posts);
            });
        });
    });
}
Post.search = function(keyword,callback){
    mongodb.connect(settings.url,function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                db.close();
                return callback(err);
            }
            var keyReg = new RegExp("^.*"+keyword+".*$","i");
            collection.find({
                title:keyReg
            },{
                "name":1,
                "title":1,
                "time":1
            }).sort({time:-1}).toArray(function(err,docs){
                db.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs)
            });
        });
    });
}
Post.reprint= function(reprint_from,reprint_to,callback){
    mongodb.connect(settings.url,function(err,db){
        if(err){
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                db.close();
                return callback(err);
            }
            collection.findOne({
                "name":reprint_from.name,
                "time.day":reprint_from.day,
                "title":reprint_from.title
            },function(err,doc){
                if(err){
                    db.close();
                    return callback(err);
                }
                var date = new Date();
                var time = {
                    date :date,
                    year : date.getFullYear(),
                    month :date.getFullYear() +'-'+(date.getMonth()+1),
                    day : date.getFullYear() + '-' +(date.getMonth()+1) +"-"+(date.getDate()<10?("0"+date.getDate()):date.getDate())
                }
                delete doc._id;
                doc.name = reprint_to.name,
                doc.head = reprint_to.head,
                doc.time = time,
                doc.title = (doc.title.search('/[转载]/')>-1)?doc.title:"[转载]" + doc.title;
                doc.comments = [];
                doc.reprint_info = {"reprint_from":reprint_from};
                doc.pv = 0;
                collection.update({
                    "name":reprint_from.name,
                    "title":reprint_from.title,
                    "time":reprint_from.day
                },{
                    $push:{
                        "reprint_info.reprint_to":{
                            "name":doc.name,
                            "title":doc.title,
                            "day":doc.day
                        }
                    }
                },function(err){
                    if(err){
                        db.close();
                        callback(err);
                    }
                });
                collection.insert(doc,{
                    safe:true
                },function(err,post){
                    db.close();
                    if(err){
                        return  callback(err);
                    }
                    callback(err,post[0]);
                })
            })
        });
    });
}