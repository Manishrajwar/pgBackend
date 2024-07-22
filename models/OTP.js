const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");


const OTPSchema = new mongoose.Schema({
    
    email:{
        type:String,
        required:true,
    },
    otp:{
        type:Number,
        required:true,

    },
    createdAt:{
        type:Date,
        default:Date.now(),
        expires: 60 * 5,
        }
    
});

//  function -> to send otp on email before save into db 
async function sendVerificationEmail(email ,otp){
 try{
      const mailResponse = await mailSender(email , "verification email from studyNotion" , otp);
      console.log(`email send successfully: `,mailResponse);
 } catch(error){
    console.log(`error occur while sending mail: `,error);
    throw error;
 }
}

OTPSchema.pre("save" , async function(next){
    
		await sendVerificationEmail(this.email, this.otp);
	
	next();
})


module.exports = mongoose.model("OTP",OTPSchema);