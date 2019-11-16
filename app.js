//credit goes to Tony's class notes for providing me with code to start with
//much of this code has also appeared in my assignment 3 for subscription feature
//credit to Brad Traversy video for authentication: https://www.youtube.com/watch?v=6FOq4cUdH8k&t=29s
//credit to Medium article for helping me with the blog posts: https://medium.com/@andrewhartnett/tutorial-building-a-simple-blog-with-node-express-mongo-8e760630db74

const express = require('express');
const path = require("path");
const fs = require("fs");
const bodyParser = require('body-parser');
const dotenv = require("dotenv").config();
const mongoose = require("mongoose");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const flash = require("connect-flash");
const session = require("express-session");
const User = require("./models/User");
const Subscription = require("./models/Subscription");
const Post = require("./models/Post");
const { ensureAuthenticated } = require('./config/auth');

require('./config/passport')(passport);


//instantiate express app
const app = express();


//connecting to mongoose
mongoose.connect(process.env.DB_CONNECTION, {
    useUnifiedTopology:true, useNewUrlParser: true
});
const db = mongoose.connection;


//error handling for mongoose connection
//if no error, this lets us know we have connected to the database
//specified in the .env file that data should be saved in mongo atlas "node-final" database - credit to Katherine Picazo for helping me to figure this out
//set mongodb atlas to "allow access from anywhere (0.0.0.0/0)"


db.on("error", console.error.bind(console, "Error connecting to mongoose"));
db.once("open", function(){
      console.log("Connected to the database");
  })
  
  

//processing the POST data with url encode and body parser
app.use(bodyParser.urlencoded({ extended: true }));


//need express-session middleware so we can create a session for our users, from traversy video
//not sure if this works, however, because logout button does not work

app.use(session({
    secret: "secret",
    resave: true,
    saveUninitialized: true
  })
);



//middleware for passport, to intialize local strategy from passport.js file
app.use(passport.initialize());
app.use(passport.session());


//middleware for connect-flash to get access to request.flash
app.use(flash());


//with this we can call success message and error message from flash so it will display on the page
app.use(function(request, response, next) {
  response.locals.success_msg = request.flash('success_msg');
  response.locals.error_msg = request.flash('error_msg');
  response.locals.error = request.flash('error');
  next();
});


//setting up the view engine to be ejs
app.set("view engine", "ejs"); 



//get pages
//originally tried to use middleware routes for GET and POST endpoints, but I was getting a lot of errors, most likely due to mistakes in my routing 
//for now I am leaving the endpoints in my app.js to keep it functional but I would like to revisit this later 


app.get("/", function(request, response){
  response.render("index");
});


app.get("/register", function(request, response){
  response.render("register");
});


app.get("/subscribe", function(request, response){
    response.render("subscribe");
});


//sending posts to the blog page from database, using code from medium article
app.get("/blog", (request, response) => {
  Post.find({}, (err, posts) => {
     response.render("blog", { posts: posts})
  });
});



//here I am attempting to get the slug functionality to work but not quite there yet
//tried code from mongodb documentation as well as stack overflow

// app.get("/blog/:slug", function (request, response){
//     response.json(posts.filter(function(posts) {
//     response.render("blog", { posts: posts.slug === request.params.slug });
//     }));
//   });



//using ensureAuthenticated to make sure that dashboard is only accessible once logged in
app.get("/dashboard", ensureAuthenticated, (request, response) =>
  response.render("dashboard", {
    user: request.user
  })
);


//post endpoint for subscriptions
app.post('/submit', function(request, response){
    
  const inputName = request.body.name;
  const inputEmail = request.body.email;

  response.render("submit", {
    inputName: inputName,
    inputEmail: inputEmail
  });


  const newSubscription = new Subscription(
    {
     name: inputName,
     email: inputEmail
    }
  )

  newSubscription.save(function(err, newSubscription){
    if(err){
      return console.error(err);
    } 
    console.log("Subscription added to database");
    });

});


//post endpoint for registration, includes authentication
//followed along with Traversy video for this

app.post("/register", function(request, response){
  const username = request.body.username;
  const email = request.body.email;
  const password = request.body.password;
  const confirmpassword = request.body.confirmpassword;

  //will use this to show errors on page
  let errors = [];

  //check if required fields are filled in
  //if any of these are not filled in properly, send a message to the errors array defined above

  if(!username || !email || !password ||!confirmpassword){
      errors.push({ msg: "Please fill in all fields" });
  }

  //check if the passwords match

  if(password !== confirmpassword){
      errors.push({ msg: "Passwords do not match"});
  }

  //check password length, which I required to be 8-20 characters in my ejs file
  //in the future, I could require the passwords have other characters or numbers. I could make this work in my validation by using more conditionals in my if statement for numbers and/or characters

  if(password.length < 8 || password.length > 20){
      errors.push({ msg: "Password must be between 8-20 characters in length"});
  }

  //if there is something in our errors array, render it to the view
  if(errors.length > 0){
      response.render("register", {
      errors,
      username,
      password,
      confirmpassword
      })
  }else{
      //passed validation
      //try to match email to a user in database, returns promise
      //in the future I would like to try this with async/await, and see if there is a way to avoid these long indented chains, it looks messy and is a bit confusing to read
      User.findOne( { email: email})
          .then(user => {
              if(user){
                  //if this user and email exists, give error
                  errors.push({ msg: "Email registered already"});
                  response.render("register", {
                      errors,
                      username,
                      email,
                      password,                      
                      })
              }else {
                  //instantiate a new user, using our model 
                  const newUser = new User({
                      username,
                      email,
                      password
                  });
                  
                  //now we need to use bcrypt to encrypt the password, using a salt to create a hash

                  //use genSalt to get salt, then bcrypt.hash takes the new user's password and the salt we just generated with genSalt

                  bcrypt.genSalt(10, (err, salt) => bcrypt.hash(newUser.password, salt, (err, hash) => {
                      if(err) throw err;
                      
                      //setting password to hash
                      newUser.password = hash;

                      //now we save the user
                      newUser.save()
                          .then(user => {
                              //use flash to display success message, before redirecting to login
                              request.flash("success_msg", "you have registed and may now log in");
                              response.redirect("/");
                          })
                          .catch(err => console.log(err));
                  }))

              }
          });
  }
})


//login handler, redirects to dashboard upon successful login 
app.post("/", function(request, response, next){
  passport.authenticate("local", {
      successRedirect: "/dashboard",
      failureRedirect: "/",
      failureFlash: true
  })(request, response, next);
});


//to create posts on the dashboard page, and add to posts collection
//not working yet
//starter code from medium article
app.post('/addpost', (request, response) => {
  const title = request.body.title;
  const body = request.body.blogbody;
  const slug = "user post";
  
  const newPost = new Post(
    {
     title: title,
     body: body,
     slug: slug
    }
  )

  //add post to database
  newPost.save(function(err, newPost){
    if(err){
      return console.error(err);
    } 
    console.log("Blog post added to database");
    request.flash("success_msg", "post saved and is now viewable on the blog page.");
    response.redirect("/dashboard");
    })
});


//logout handler
//can't get logout button to work
app.get('/logout', (request, response) => {
  request.logOut();
  request.flash('success_msg', 'You are logged out');
  response.redirect('/');
});



//display static assets
app.use(express.static(path.join(__dirname, "assets")));


//error handling for page not found
app.use(function(request, response, next){
  response.status(404);
  response.render("error-404");
});

//error handling for server error
app.use(function (err, request, response, next) {
  console.error(err);
  response.status(500);
  response.send("Something went wrong on the server");
});


//listening on port 3000
const PORT = process.env.PORT || 3000;

app.listen(PORT, function (){
    console.log(`Listening on port ${PORT}`);
});
