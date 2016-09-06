var express = require('express');
var auth = require('../middleware/auth');
var markdown = require('markdown').markdown;
//创建一个路由容器
var router = express.Router();
//文章列表路由
router.get('/list', auth.mustLogin, function (req, res) {
    var user = req.query.user;//取得查询字符串中的用户ID
    var keyword = req.query.keyword;//取得查询字关键字
    //读取所有的列表并显示在页面中
    var query = {};//查询条件对象
    /**
     * 要实现分页 需要让客户端知道 当前是第几页，每页多少条,一共多少页
     *
     */
    var pageNum = parseInt(req.query.pageNum || 1); //当前的页码
    var pageSize = parseInt(req.query.pageSize || 3);//每页的条数
    var order = req.query.order;
    //如果有用户ID的话查询此用户的所有的文章
    if (user)
        query['user'] = user;
    //如果用户输入的关键字的话，那么查询标题和正文中包含此关键字的文章
    if (keyword) {
        var filter = new RegExp(keyword);//先写正则
        //或条件，如果title符合正则或者 内容符合正则
        query["$or"] = [{title: filter}, {content: filter}];
    }
    //默认情况下按文章的发表顺序倒序排列
    var defaultOrder = {createAt: -1};
    if (order) { // createAt -createAt title -title
        var orderValue = 1;//默认排序顺序 1
        var orderBy = 'createAt';
        if (order.startsWith('-')) {//表示倒序排列
            orderValue = -1;//表示要倒序
            orderBy = order.slice(1);//去掉-之后就成为真正排序字段名称了
        }
        defaultOrder[orderBy] = orderValue;
    }
    console.log(defaultOrder);
    var count;
    Model('Article')
        .count(query)
        .then(function (result) {//得到符合这个条件的总条数
            count = result;
            return Model('Article')
                .find(query)//按指定的条件过滤
                .sort(defaultOrder)
                .skip((pageNum - 1) * pageSize) //跳过指定的条数
                .limit(pageSize)//限定返回的条数
                .populate('user')//把user属性从ID转成对象
                .exec();//开始真正执行查询，返回一个新promise
        }).then(function (docs) {//docs是当前页的文章列表
        docs.forEach(function (doc) {
            doc.content = markdown.toHTML(doc.content);
        });

        res.render('article/list', {
            title: '文章列表',
            articles: docs,
            keyword: keyword,
            pageNum: pageNum,
            pageSize: pageSize,
            order: order,
            totalPages: Math.ceil(count / pageSize) //总页数
        });
    }).catch(function (err) {
        req.flash('error', '显示文章列表失败' + err);
        res.redirect('back');
    });

});

router.get('/add', auth.mustLogin, function (req, res) {

    res.render('article/add', {title: '新增文章', article: {}});
});

router.post('/add', auth.mustLogin, function (req, res) {
    var article = req.body;
    var articleId = article._id;
    if (articleId) {
        Model('Article').update({_id: articleId}, {
            $set: {
                title: article.title,
                content: article.content
            }
        }).then(function (result) {
            res.redirect('/article/detail/' + articleId);
        }, function (error) {
            req.flash('error', error);
            res.redirect('back');
        });
    } else {
        article.user = req.session.user._id;
        delete article._id;
        Model('Article').create(article, function (err, doc) {
            if (err) {
                req.flash('error', '文章发表失败了');
                res.redirect('back');
            } else {
                req.flash('success', '文章发表成功');
                res.redirect('/');
            }
        });
    }

});
router.get('/detail/:articleId', function (req, res) {
    var articleId = req.params.articleId;
    Model('Article').update({_id: articleId}, {$inc: {pv: 1}}).then(function () {
            return Model('Article').findById(articleId).populate('comments.user');
        })
        .then(function (doc) {
            res.render('article/detail', {title: '文章详情', article: doc});
        }).catch(function (err) {
        req.flash('error', '查询文章详情失败');
        req.redirect('back');
    });
});
//删除文章
router.get('/delete/:articleId', function (req, res) {
    //先得到要删除的文章ID
    var articleId = req.params.articleId;
    //删除指定的文章
    Model('Article').remove({_id: articleId}).then(function (data) {
        req.flash('success', '删除文章成功');
        res.redirect('/');
    }, function (error) {
        req.flash('error', '删除文章失败');
        res.redirect('back');
    });
});
router.get('/update/:articleId', function (req, res) {
    //先得到要编辑的文章ID
    var articleId = req.params.articleId;
    //根据文章的ID查询文章的文档对象
    Model('Article').findById(articleId).populate('comments.user').then(function (doc) {
        //渲染模板，并传递当前的文章对象
        res.render('article/add', {title: '编辑文章', article: doc});
    })
});
//提交评论
router.post('/comment', function (req, res) {
    var comment = req.body;// articleId(文章的ID) content(评论的内容)
    Model('Article').update({_id: comment.articleId},
        {
            $push: {
                comments: {
                    content: comment.content,
                    user: req.session.user._id,
                }
            }
        }
    ).then(function (result) {
        res.redirect('/article/detail/' + comment.articleId);
    }, function (error) {
        res.redirect('back');
    });

});

module.exports = router;