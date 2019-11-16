//using Tony's build.js code here 

const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const posts = require('./data/posts');

//connect to database
const uri = process.env.DB_CONNECTION;
MongoClient.connect(uri,{ useUnifiedTopology: true,useNewUrlParser: true }, function(err, client) {
   if(err) {
      console.log('Error connecting to database (posts)...\n',err);
   }
   console.log('Connected to database (posts)');
   
   //create variables for database and collection
   const db = client.db("node-final");
   const postsCollection = db.collection('posts');

   //insert data from my "posts" file into the collection
   postsCollection.drop();
   postsCollection.insertMany(posts, function(err, cursor) {
    if (err) {
      console.log('There was a problem inserting posts');
    }
    console.log(cursor.insertedCount);
  });


  client.close();
});