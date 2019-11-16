//code based on traversy video, will go in more depth into documentation in the future so have better understanding

const LocalStrategy = require('passport-local').Strategy;

const bcrypt = require("bcryptjs"); //to compare the hash and the password

const User = require("../models/User");



//pass in passport from the app js file rather than including it as const in here

//now we need to use the local strategy and bcrypt to compare the username and password they input to what's in the database
module.exports = function(passport){
    passport.use(
        new LocalStrategy({ usernameField: "email"}, (email, password, done) => {
            //match email using mongoose
            User.findOne(
                { email: email}
                )
            .then(user => {
                //matching user to email, if not the user return done with the error message
                if(!user){
                    return done(null, false, { message: "The email you entered is not registered"});
                }

                //use bcrypt.compare to compare hash to their password, since password in db is hashed but their entry is not

                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if(err) throw err;

                    //if passwords match, return user
                    if(isMatch) {
                        return done(null, user);
                    }else {
                        return done(null, false, { message: "The password is incorrect"});
                    }
                });
            });
        })
    );

//now have to serialize and deserialize the user. According to passport documentation this is because credientials are only sent during login, and once the user is logged in, they are given a cookie to identify the session, so you are not sending the credentials again.

//would like to investigate this further, in case it is contributing to my logout problem

  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });
}

