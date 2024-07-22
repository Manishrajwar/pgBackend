// !   sendOTP
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

//! signup

exports.signup = async (req, res) => {
  try {
    // data fetch from req.body
    const { email, password } = req.body;

    // validate data
    if ( !password || !email) {
      return res.status(403).json({
        success: false,
        message: "all field are require",
      });
    }

    // check user already exist or not
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "user is alreay registered",
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({email, password: hashedPassword,
    });

    // return res
    return res.status(200).json({
      success: true,
      message: `user is registered successfullly`,
      user,
    });
  } catch (error) {
    console.log(`error in signup `, error);
    return res.status(500).json({
      success: false,
      message: "user cannot be register please try again",
    });
  }
};

// !login
exports.login = async (req, res) => {
  try {
    //  get data from req.body
    const { email, password } = req.body;
    console.log("email ",email , password);

    //  validation data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: `all fields are required ,please try again`,
      });
    }
    // user check exist of not
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: `please register before login`,
      });
    }

    const payload = {
      email: user.email,
      id: user._id,
      accountType: user.accountType,
    };

    // password match and generate jwt
    if (await bcrypt.compare(password, user.password)) {
      //  creating token
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "3d",
      });

      // todo: toObject ki jrurt ho skti hai fat skta hai
      user.token = token;
      user.password = undefined;

      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };

      // create cookie and send response
      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: `login successfully`,
      });
    } else {
      return res.status(401).json({
        success: false,
        message: `password inccorrect`,
      });
    }
  } catch (error) {
    console.log(`error in login `, error);
    return res.status().json({
      success: false,
      message: ` login failure , please try again `,
    });
  }
};

// !changePassword
// exports.changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     if(!currentPassword || !newPassword){
//       return res.json({
//         success:false,
//         message:"please fill all the data"
//       })
//     }

//     const userId = req.user.id;

//     const userDetails = await User.findOne({_id:userId});

//     if (await bcrypt.compare(currentPassword, userDetails.password)) {
//       // hash the password
//       console.log("iinsde if");
//       const hashedPassword = await bcrypt.hash(newPassword, 10);

//       // update user password by finding using email
//       await User.findOneAndUpdate(
//         {
//           _id:userId
//         },
//         { password: hashedPassword },
//         {
//           new: true,
//         },
//       );

//       // send mail -> password change
//       try {
//         const mailResponse = await mailSender(
//           userDetails.email,
//           `confirm change password from studyNotion`,
//           `your password has been successfully changed`
//         );
//         console.log(
//           "password change successfully-> mailResponse ",
//           mailResponse
//         );
//       } catch (error) {
//         console.log(`error occur while sending password change mail  `, error);
//         throw error;
//       }
//     }
//     else{
//       return res.json({
//         success:false,
//         message:"your currentPassword is wrong",
//       })
//     }

//     return res.status(200).json({
//       success: true,
//       message: `password change successfully`,
//     });
//   } catch (error) {
//     console.log(`error in changing the password `, error);
//     return res.status(500).json({
//       success: false,
//       message: `cannot reset password , please try again`,
//     });
//   }
// };
