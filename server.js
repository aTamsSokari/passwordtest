var express = require("express"),
    app = express(),
    session = require("express-session"),
    passwordless = require("passwordless"),
    MongoStore = require("passwordless-mongostore"),
    email = require("emailjs"),
    router = express.Router(),
    bodyParser = require("body-parser");

var smtpServer = email.server.connect({
  user: 'myemail',
  password: 'mypassword',
  host: 'smtp.gmail.com',
  ssl: true
});

app
  .set('views', './views')
  .set('view engine', 'jade');

var pathToMongoStore = "mongodb://localhost/passwordless";

passwordless
  .init(new MongoStore(pathToMongoStore));

passwordless
  .addDelivery(
    function(tokenToSend, uidToSend, recipient, callback) {
      var host = "http://localhost:3000/";

      smtpServer
        .send({
          text: "Hello There!\n You can access your account by following this" +
          " link here: " + host + "?token=" + tokenToSend + "&uid=" +
          encodeURIComponent(uidToSend),
          from: 'myemail',
          to: recipient,
          subject: "Access Token for: " + host
        }, function(err, message) {
          if (err) {
            console.log(err);
          }
          callback(err);
        });
    });

app
  .use(session({
    secret: 'keyboard cat'
  }))
  .use(bodyParser())
  .use(router)
  .use(express.static(__dirname + '/views'))
  .use(passwordless.sessionSupport())
  .use(passwordless.acceptToken({successRedirect: '/'}));

router
  .get('/login', function(req, res) {
    res
      .render('login');
  })
  .post('/sendtoken',
    passwordless
      .requestToken(
        // Turn the email address into an user ID
        function(user, delivery, callback, req) {
            // usually you would want something like:
          // User
          //   .find({
          //     email: user
          //   }, callback (ret));
            //  {
            //   if(ret)
            //     callback(null, ret.id);
            //   else
            //     callback(null, null);
            // });
          // but you could also do the following
          // if you want to allow anyone:
          callback(null, user);
        }), function(req, res) {
        res
          .send('sent');
     });

app
  .listen(3000, function() {
    console.log("passwordless here");
  });