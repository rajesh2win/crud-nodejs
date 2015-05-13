var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
var mysql =require("mysql");
var app = express();
/*MySql connection*/
var connection  = require('express-myconnection');
app.use(

    connection(mysql,{
      host     : 'localhost',
      user     : 'root',
      password : '****',
      port        :3307,
      database : 'test',
      debug    : false //set true if you wanna see debug logger
    },'request')

);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);





//RESTful route
var router = express.Router();


/*------------------------------------------------------
 *  This is router middleware,invoked everytime
 *  we hit url /api and anything after /api
 *  like /api/user , /api/user/7
 *  we can use this for doing validation,authetication
 *  for every route started with /api
 --------------------------------------------------------*/
router.use(function(req, res, next) {
  console.log(req.method, req.url);
  next();
});

var curut = router.route('/user');


//show the CRUD interface | GET
curut.get(function(req,res,next){


  req.getConnection(function(err,conn){

    if (err) return next("Cannot Connect");

    var query = conn.query('SELECT * FROM t_user',function(err,rows){

      if(err){
        console.log(err);
        return next("Mysql error, check your query");
      }

      res.render('user',{title:"RESTful Crud Example",data:rows});

    });

  });

});
//now for Single route (GET,DELETE,PUT)
var curut2 = router.route('/user/:user_id');

curut2.all(function(req,res,next){
  console.log("You need to smth about curut2 Route ? Do it here");
  console.log(req.params);
  next();
});
//get data to update
curut2.get(function(req,res,next){

  var user_id = req.params.user_id;

  req.getConnection(function(err,conn){

    if (err) return next("Cannot Connect");

    var query = conn.query("SELECT * FROM t_user WHERE user_id = ? ",[user_id],function(err,rows){

      if(err){
        console.log(err);
        return next("Mysql error, check your query");
      }

      //if user not found
      if(rows.length < 1)
        return res.send("User Not found");

      res.render('edit',{title:"Edit user",data:rows});
    });

  });

});

//update data
curut2.put(function(req,res,next){
  var user_id = req.params.user_id;

  //validation
  req.assert('name','Name is required').notEmpty();
  req.assert('email','A valid email is required').isEmail();
  req.assert('password','Enter a password 6 - 20').len(6,20);

  var errors = req.validationErrors();
  if(errors){
    res.status(422).json(errors);
    return;
  }

  //get data
  var data = {
    name:req.body.name,
    email:req.body.email,
    password:req.body.password
  };

  //inserting into mysql
  req.getConnection(function (err, conn){

    if (err) return next("Cannot Connect");

    var query = conn.query("UPDATE t_user set ? WHERE user_id = ? ",[data,user_id], function(err, rows){

      if(err){
        console.log(err);
        return next("Mysql error, check your query");
      }

      res.sendStatus(200);

    });

  });

});

//delete data
curut2.delete(function(req,res,next){

  var user_id = req.params.user_id;

  req.getConnection(function (err, conn) {

    if (err) return next("Cannot Connect");

    var query = conn.query("DELETE FROM t_user  WHERE user_id = ? ",[user_id], function(err, rows){

      if(err){
        console.log(err);
        return next("Mysql error, check your query");
      }

      res.sendStatus(200);

    });
    //console.log(query.sql);

  });
});

//now we need to apply our router here
app.use('/api', router);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
