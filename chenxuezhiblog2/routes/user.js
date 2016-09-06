var express = require('express');
var utils = require('../utils');
var auth = require('../middleware/auth');
var multer = require('multer');
var upload = multer({ dest: '../public/uploads/' })
var router = express.Router();

router.get('/reg',auth.mustNotLogin,function(req, res, next) {
  res.render('user/reg');
});

router.post('/reg',auth.mustNotLogin,upload.single('avatar'), function(req, res, next) {

  var user = req.body;
  if(user.password != user.repassword){
    return res.redirect('back');
  }
  Model('User').findOne({username:user.username},function(err,result){
    if(result){
      req.flash('error','很抱歉,你的用户名已经被人占用，注册失败');

      return res.redirect('back');
    }else{

      user.password = utils.md5(user.password);
      if(req.file){
        user.avatar = '/uploads/'+req.file.filename;
      }

      Model('User').create(user,function(err,doc){

        if(err){
          req.flash('error','很抱歉,你注册失败'+err);
          return res.redirect('back');
        }else{
          req.flash('success','恭喜你注册成功')
          req.session.user  = doc;
          return res.redirect('/');
        }
      });
    }
  });

});
//不是完整的路径，而是/users后面的路径
//用户登陆
router.get('/login',auth.mustNotLogin, function(req, res, next) {
  res.render('user/login');
});
//处理提交登录功能
router.post('/login',auth.mustNotLogin, function(req, res, next) {
  var user = req.body;//先获取请求体 user ={username,password}
  Model('User').findOne({username:user.username},function(err,doc){
      if(err){
        req.flash('error','登录失败');
        res.redirect('back');
      }else{
        if(doc){//意味着有此用户名的用户
          //判断数据库中的用户密码和本次输入的密码是否一致
          if(doc.password == utils.md5(user.password)){
            req.session.user  = doc;
            //重定向到首页
            return res.redirect('/');
          }else{
            req.flash('error','密码输入错误,请重新输入');
            res.redirect('back');
          }
        }else{
          req.flash('error','此用户名不存在');
          res.redirect('back');
        }
      }
  });
});
//必须登陆以后才能退出
router.get('/logout',auth.mustLogin,function(req,res){
   req.session.user = null;
   res.redirect('/');
})

//用户退出
router.get('/logout', function(req, res, next) {
  res.send('退出');
});

module.exports = router;
