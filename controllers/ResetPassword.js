const User = require('../models/User');
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcrypt");
const crypto = require("crypto");



//! resetPasswordToken
exports.resetPasswordToken = async(req ,res)=>{
    try{
        // fetch email from req.body
        const email = req.body.email;


        // check user for this email , email validation
        const user = await User.findOne({email:email});
        if(!user){
            return res.json({
                success:false,
                message:"your email is not registerd with us"
            });
        }
        
        // generate token
        const token = crypto.randomUUID();

        // update user by adding token and expiration time
        const updatedDetails =await User.findOneAndUpdate({
            email:email
        },{
            token:token ,
            resetPasswordExpires: Date.now()+ 5*60*1000,
        } ,{
            new:true,
        })

        // create url
        const url = `http://localhost:3000/update-password/${token}`;

        // send mail containing the url
        await mailSender(email , `password reset link` 
        ,
        ` password reset link: ${url}`);

        // return response
        return res.status(200).json({
            success:true,
            message:"emai sent successfully , please check email and change password"
        })
        

    } catch(error){
       console.log(`error in resetPasswordToken ` ,error);
       return res.status(500).json({
        success:false,
        message:'cannot reset passwordf token , please try again'
       })

    }
}



//! resetPassword
exports.resetPassword = async(req ,res)=>{
    try{

        // fetch password and confirm password
        // ! req mai token frontent ne dala hai
        const {newPassword , confirmNewPassword , token} = req.body;
        console.log("started "); 
        // validation
        if(newPassword !== confirmNewPassword){
            return res.json({
                success:false,
                message:"password dot not match ,please try again",
            })
        }
        // get userdetails from db using token
        const userDetails = await User.findOne({token:token});


        // if no entry => invalid token 
        if(!userDetails){
            return res.json({
                success:false,
                message:"invalid token",
            })
        }
        // token time check
        if( Date.now() > userDetails.resetPasswordExpires ){
        
            return res.json({
                success:false,
                message:'time limit exceed , token expire please regenerate link',
            })
        }
        // password hash
        const hashPassword =await bcrypt.hash(newPassword , 10);
        // password update
         await User.findOneAndUpdate({
            token:token
         },
         {
            password:hashPassword
         },
         {
            new:true
         })
        // return response
        return res.status(200).json({
            success:true,
            message:"password reset successfully"
        })

    } catch(error){
 console.log(`error in resetPassword ` ,error);
 return res.status(500).json({
  success:false,
  message:'cannot reset password , please try again'
 })


    }
}
