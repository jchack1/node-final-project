//put subscription schema in models folder to help modularize my code (in assignment 3 it was in my app.js)

const mongoose = require("mongoose")
const subscriptionSchema = new mongoose.Schema(
    {
      name:
      {
        type: String,
        required: true
      },
      email:
      {
        type: String,
        required: true
      }
    }
  );
  const Subscription = mongoose.model("Subscription", subscriptionSchema)

  module.exports = Subscription;