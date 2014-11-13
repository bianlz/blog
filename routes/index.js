
/*
 * GET home page.
 */
var passport = require("passport");
var crypto = require('crypto');
var fs = require('fs');
User = require('../models/user.js');
Post = require('../models/post.js');
Comment = require('../models/comment.js');

module.exports = function(app){
    app.get('/',function(req,res){
       var page = req.query.p?parseInt(req.query.p):1;
       Post.getTen(null,page,function(err,posts,total){
           if(err){
               posts = [];
           }
           res.render('index',{
               title:'主页',
               user:req.session.user,
               posts:posts,
               page:page,
               isFirstPage:(page-1) == 0,
               isLastPage:((page-1)*10+posts.length)==total,
               success:req.flash('success').toString(),
               error:req.flash('error').toString()
           })
       })
    });
    app.get('/reg',checkNotLogin);
    app.get('/reg',function(req,res){
        res.render('reg',{
            title:'注册',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    });
    app.get('/reg',checkNotLogin);
    app.post('/reg',function(req,res){
        var name = req.body.name,
            password = req.body.password,
            password_re = req.body['password-repeat'];
        if(''==password){
            req.flash('error','请填写密码!')
            return res.redirect('/reg');
        }
        if(''==password){
            req.flash('error','请填写确认密码!')
            return res.redirect('/reg');
        }
        if(password!=password_re){
            req.flash('error','两次输入的密码不一致!')
            return res.redirect('/reg');
        }
        var md5 = crypto.createHash('md5'),
            password = md5.update(password).digest('hex');
        var newUser = new User({
            name:name,
            password:password,
            email:req.body.email
        });
        User.get(newUser.name,function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/reg');
            }
            if(user){
                req.flash('error','用户已经存在!');
                return res.redirect('/reg');
            }
            newUser.save(function(err,user){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/reg');
                }
                req.session.user = user;
                req.flash('success','注册成功!');
                res.redirect('/');
            });
        })

    });
    app.get('/reg',checkNotLogin);
    app.get('/login',function(req,res){
        res.render('login',{
            title:'登录',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    });
    app.get('/login/github',passport.authenticate("github",{session:false}));
    app.get('/github/callback',passport.authenticate("github",{
        session:false,
        failureRedirect:'login',
        successFlash:'登陆成功!'
    }),function(req,res){
        req.session.user = {name:req.user.username,head:"http://gravatar.com/avatar/"+req.user._json.gravatar_id+"?s=48"};
        res.redirect('/');
    })
    app.get('/reg',checkNotLogin);
    app.post('/login',function(req,res){
        var name = req.body.name,
            password = req.body.password;
        if(''==name.trim()){
            req.flash('error','请填写用户名称!');
            return res.redirect('/login');
        }
        if(''==password.trim()){
            req.flash('error','请填写密码!');
            return res.redirect('/login');
        }
        var md5 = crypto.createHash('md5');
            password = md5.update(password).digest('hex');
        User.get(name,function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/login');
            }
            if(!user){
                req.flash('error','用户不存在!');
                return res.redirect('/login');
            }
            if(password!=user.password){
                req.flash('error','密码错误!');
                return res.redirect('/login');
            }
            req.session.user = user;
            req.flash('success','登录成功!');
            return res.redirect('/');
        });
    });
    app.get('/post',checkLogin);
    app.get('/post',function(req,res){
        res.render('post',{
            title:'发表',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    });
    app.get('/reg',checkLogin);
    app.get('/logout',function(req,res){
        req.session.user = null;
        req.flash('success','登出成功!');
        return res.redirect('/');
    });
    app.post('/post',checkLogin);
    app.post('/post',function(req,res){
       var tags =[req.body.tag1,req.body.tag2,req.body.tag3],
           post = new Post(req.session.user.name,req.session.user.head,req.body.title,tags,req.body.post);
        post.save(function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            req.flash('success','发表成功!');
            return res.redirect('/');
        });
    });
    app.get('/upload',checkLogin);
    app.get('/upload',function(req,res){
        res.render('upload',{
            title:'文件上传',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    });
    app.post('/upload',checkLogin);
    app.post('/upload',function(req,res){
       for(var i in req.files){
            if(req.files[i].size==0){
                fs.unlinkSync(req.files[i].path);
                console.log('del');
            }else{
                var target_path = './public/images/'+req.files[i].name;
                fs.renameSync(req.files[i].path,target_path);
                console.log('rename');
            }
       }
        req.flash('success','成功上传');
        return res.redirect('/upload');
    });
    app.get('/u/:name',function(req,res){
        var page = req.query.p?parseInt(req.query.p):1;
        User.get(req.params.name,function(err,user){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            if(!user){
                req.flash('error','用户不存在!');
                return res.redirect('/');
            }
            Post.getTen(req.params.name,page,function(err,posts,total){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/');
                }
                res.render('user',{
                    title:user.name,
                    user:user,
                    posts:posts,
                    page:page,
                    isFirstPage:(page-1) == 0,
                    isLastPage:((page-1)*10+posts.length)==total,
                    success:req.flash('success').toString(),
                    error:req.flash('error').toString()
                });
            });
        });
    });
    app.get('/u/:name/:day/:title',function(req,res){
           Post.getOne(req.params.name,req.params.day,req.params.title,function(err,doc){
               if(err){
                   req.flash('error',err);
                   return res.redirect('/');
               }
               res.render('article',{
                   title:req.params.title,
                    post:doc,
                   user:req.session.user,
                   success:req.flash('success').toString(),
                   error:req.flash('error').toString()
               });
           });
    });
    app.post('/u/:name/:day/:title',function(req,res){
        var date = new Date();
        var time = date.getFullYear()+"-"+(date.getMonth()+1)+"-"+(date.getDate()<10?("0"+date.getDate()):date.getDate())+" "+date.getHours()+":"+(date.getMinutes()<10?("0"+date.getMinutes()):date.getMinutes());
        var md5 = crypto.createHash("md5"),
            email_md5 = md5.update(req.body.email.toLowerCase()).digest("hex"),
            head = "http://www.gravatar.com/avatar/"+email_md5+"?s=48";
        var comment = {
            name:req.body.name,
            email:req.body.email,
            time:time,
            website : req.body.website,
            content: req.body.content,
            head:head
        }

        var newComment = new Comment(req.params.name,req.params.title,req.params.day,comment);
        newComment.save(function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','留言成功!');
            return res.redirect('back');
        })
    });
    app.get('/edit/:name/:day/:title',checkLogin);
    app.get('/edit/:name/:day/:title',function(req,res){
        Post.edit(req.session.user.name,req.params.day,req.params.title,function(err,post){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('edit',{
                title:"编辑",
                post:post,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        });
    });
    app.post('/edit/:name/:day/:title',checkLogin);
    app.post('/edit/:name/:day/:title',function(req,res){
       Post.update(req.session.user.name,req.params.day,req.params.title,req.body.post,function(err){
           var url = '/u/'+ req.session.user.name +'/'+req.params.day +'/'+req.params.title;
           if(err){
                req.flash('error',err);
               return res.redirect(url);
           }
           req.flash('success','修改成功!');
           return res.redirect(url);
       });
    });
    app.get('/remove/:name/:day/:title',checkLogin);
    app.get('/remove/:name/:day/:title',function(req,res){
        Post.remove(req.session.user.name,req.params.day,req.params.title,function(err){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            req.flash('success','删除成功!');
            return res.redirect('/');
        });
    });
    app.get('/archive',function(req,res){
        Post.getArchive(function(err,posts){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('archive',{
                title:'存档',
                user:req.session.user,
                posts:posts,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        });
    });
    app.get('/tags',function(req,res){
        Post.getTags(function(err,tags){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('tags',{
                title:'标签',
                user:req.session.user,
                tags:tags,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            });
        })
    });
    app.get('/tags/:tag',function(req,res){
        Post.getTag(req.params.tag,function(err,posts){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('tag',{
                title:'TAG'+req.params.tag,
                posts:posts,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        });
    });
    app.get('/search',function(req,res){
        Post.search(req.query.keyword,function(err,posts){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('search',{
                title:"SEARCH : "+req.query.keyword,
                posts:posts,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            }
            );
        });
    });
    app.get('/links',function(req,res){
        res.render('links',{
            title:"友情链接",
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });
    app.get('/reprint/:name/:day/:title',checkLogin);
    app.get('/reprint/:name/:day/:title',function(req,res){
        Post.edit(req.params.name,req.params.day,req.params.title,function(err,post){
            if(err){
                req.flash('error',err);
                return res.redirect('back');
            }
            var currentUser = req.session.user,
                reprint_from = {name:post.name,day:post.time.day,title:post.title},
                reprint_to = {name:currentUser.name,head:currentUser.head};
            Post.reprint(reprint_from,reprint_to,function(err,post){
                if(err){
                    req.flash('error',err);
                    return res.redirect('back');
                }
                req.flash('success','转载成功!');
                var url = '/u/'+ post.name + '/'+ post.time.day + '/'+ post.title;
                res.redirect(url);
            });
        });
    });
    app.use(function(req,res){
        res.render("404");
    });
    function checkLogin(req,res,next){
        if(!req.session.user){
            req.flash('error','未登录');
            return res.redirect('/login');
        }
        next();
    }
    function checkNotLogin(req,res,next){
        if(req.session.user){
            req.flash('error','已登录');
            return res.redirect('back');
        }
        next();
    }
}