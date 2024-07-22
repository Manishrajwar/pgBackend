const User = require("../models/User");
const mailSender = require("../utils/mailSender");

exports.contactUs = async(req ,res)=>{
    try{

        // fetch the data 
        const {firstName , lastName , email , phoneNumber , message} = req.body;

        // check validation
        if(!firstName || !lastName || !email || !message){
            return res.status(403).json({
                success:false,
                message:"please send the required data ",
            })
        }

       const response =  await mailSender(email , `your form has successfuly submitted `,`your message has been send successfully`);


       const response2 = await mailSender(`manishsinghrajwar80@gmail.com` , `${userDetails.firstName} has sent a message` , `user detail  ${userDetails}`)

       return res.status(200).json({
        success:true,
        message:"successfully send the msg",
        response
       })

    } catch(error){
 console.log(error);
 return res.status(500).json({
    success:false,
    message:"error in contact us page "
 })
    }
}