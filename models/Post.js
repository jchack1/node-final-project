//medium article helped me build blog:  https://medium.com/@andrewhartnett/tutorial-building-a-simple-blog-with-node-express-mongo-8e760630db74
//also used Tony's code from article.js

const mongoose = require("mongoose");

//creating schema, assigning title, body, and slug to be a string
const postSchema = new mongoose.Schema(
    {
        title: {
          type: String,
          require: true
        },
        body: {
          type: String,
          require: true
        },
        slug: {
          type: String,
          required: true
        }
      }
    );

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
