const Rayzorpay = require("razorpay");
require("dotenv").config();

exports.instance = new Rayzorpay({
    key_id:process.env.RAZORYPAY_KEY,
    key_secret:process.env.RAZORPAY_SECRET,
     
});
