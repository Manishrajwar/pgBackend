const instance = require("../config/razorpay");
const Course = require("../models/Course");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const courseEnrollmentEmail = require("../mail/template/courseEnrollmentEmail");
const mongoose = require("mongoose");

// capture the payment and initiate the razorpay order

// ! for multiple item payment at a time
exports.capturePayment = async (req, res) => {
  // all courses that are going to buy

  const { courses } = req.body;
  const userId = req.user.id;

  if (courses.length === 0) {
    return res.json({ success: false, message: "please provide course Id" });
  }

  let totalAmount = 0;

  for (const course_id of courses) {
    let course;
    try {
      course = await Course.findById(course_id);
      if (!course) {
        return res
          .status(200)
          .json({ success: false, message: "could not find the course" });
      }

      const uid = new mongoose.Types.ObjectId(userId);
      if (course.studentsEnrolled.includes(uid)) {
        return res
          .status(200)
          .json({ success: false, message: "student is already enrolled" });
      }

      totalAmount += course.price;
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  const options = {
    amount: totalAmount * 100,
    currency: "INR",
    receipt: Math.random(Date.now()).toString(),
  };

  try {
    const paymentResponse = await instance.orders.create(options);

    res.json({
      success: true,
      message: paymentResponse,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "internal server error" });
  }
};

// ! for multiple item buy
exports.verifyPayment = async (req, res) => {
  const razorpay_order_id = req.body.razorpay_order_id;
  const razorpay_payment_id = req.body?.razorpay_payment_id;
  const razorpay_signature = req.body?.razorpay_signature;
  const courses = req.body?.courses;
  const userId = req.user.id;

  if (
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature ||
    !courses ||
    !userId
  ) {
    return res.status(200).json({ success: false, message: "payment failed" });
  }

  let body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    //  enroll krwa do
    await enrollStudents(courses, userId, res);

    //  return res
    return res.status(200).json({
      success: true,
      message: " payment verified",
    });
  }

  return res.status(200).json({
    success: false,
    message: "paymenrt failed",
  });
};


// ! function to update the enroll student
const enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res.status(400).json({
      success: false,
      message: "please provide data",
    });
  }

  for (const courseId of courses) {
    try {
      // find the course the student in it

      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        {
          $push: {
            studentsEnrolled: userId,
          },
        },
        { new: true }
      );

      if (!enrolledCourse) {
        return res
          .status(500)
          .json({ success: false, message: "course not found" });
      }

      // find the student and add the course to their list of enrolledCourses
      const enrolledStudent = await User.findByIdAndUpdate(
        { userId },
        {
          $push: {
            courses: courseId,
          },
        },
        { new: true }
      );

      // send mail
      const emailResponse = await mailSender(
        enrollStudents.email,
        `successfuly enrolled into ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudent.firstName}`
        )
      );

      console.log(`email sent succesfuly`, emailResponse);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};


// ! use of webhook 
// ! for single item payment at a time
// exports.capturePayment = async (req, res) => {
//   try {
//     // fetch courseId and  userId
//     const { course_id } = req.body;

//     const userId = req.user.id;

//     // validation
//     // valid course id or not
//     if (!course_id) {
//       return res.json({
//         success: false,
//         message: `please provide valid course id`,
//       });
//     }

//     // valid courseDetails
//     let course;
//     try {
//       course = await Course.findById({ course_id });
//       if (!course) {
//         return res.json({
//           success: false,
//           message: `could not find the course`,
//         });
//       }

//       // user already pay for the same course  or not

//       // ! converting the string userId into the objectId type
//       const uid = new mongoose.Types.objectId(userId);

//       if (course.studentsEnrolled.includes(uid)) {
//         return res.status(200).json({
//           success: false,
//           message: `student is already enrolled`,
//         });
//       }
//     } catch (error) {
//       console.log(error);
//       return res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }

//     //  order create
//     const amount = course.price;

//     const currency = "INR";

//     const options = {
//       amount: amount * 100,
//       currency,
//       receipt: Math.random(Date.now()).toString(),
//       notes: {
//         course_id: course_id,
//         userId,
//       },
//     };

//     try {
//       // initiate the payment using razorpay
//       const paymentResponse = await instance.orders.create(options);
//       console.log("paymentResponse ", paymentResponse);

//       return res.status(200).json({
//         success: true,
//         courseName: course.courseName,
//         courseDescription: course.courseDescription,
//         thumbnail: course.thumbnail,
//         orderId: paymentResponse.id,
//         currency: paymentResponse.currency,
//         amount: paymentResponse.amount,
//       });
//     } catch (error) {
//       console.log(error);
//       return res.status(500).json({
//         success: false,
//         message: `could not initiate order`,
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       success: false,
//       message: `failed payment`,
//     });
//   }
// };

// ! for single item buy
// exports.verifySignature = async (req, res) => {
//   try {
//     const webhookSecret = "12345678";

//     // ye signature Secret razorpay se aa rha hai and iska ase he behaviour hota hai
//     //* razorpay will return signaute in hash
//     const signature = req.headers("x-razorpay-signature");

//     // * hum kya krenge ki webhookSecret ko bhi hash kr lenge fr compare karenge with signature
//     const shasum = crypto.createHmac("sha256", webhookSecret);

//     //  convert this into string format
//     shasum.update(JSON.stringify(req.body));

//     // match two key
//     if (signature === digest) {
//       console.log("payment is authorized ");

//       const { courseId, userId } = req.body.payload.payment.entity.notes;

//       try {
//         // fulfill the action

//         // find the course and enroll the student in it
//         const enrolledCourse = await Course.findOneAndUpdate(
//           { _id: courseId },
//           {
//             $push: {
//               studentsEnrolled: userId,
//             },
//           },
//           { new: true }
//         );

//         if (!enrolledCourse) {
//           return res.status(500).json({
//             success: false,
//             message: "Course not found ",
//           });
//         }

//         console.log("enrolledCourse ", enrolledCourse);

//         // find the student and add the  course to their list enrolled courses me

//         const enrolledStudent = await User.findOneAndUpdate(
//           { _id: userId },
//           {
//             $push: {
//               courses: courseId,
//             },
//           },
//           { new: true }
//         );

//         console.log("enrolledStudent ", enrolledStudent);

//         //  mail send krdo confirmatioin wala
//         const emailResponse = await mailSender(
//           enrolledStudent.email,
//           `congratulation from studyNotion`,
//           `congratulation you are onboarded into new studyNotion course`
//         );

//         console.log(emailResponse);
//         return res.status(200).json({
//           success: true,
//           message: `signature verified and course added`,
//         });
//       } catch (error) {
//         console.log(error);
//         return res.status(500).json({
//           success: false,
//           message: error.message,
//         });
//       }
//     }
//     else{
//          return res.status(400).json({
//             success:false,
//             message:"invalid request",
//          })
//     }
//   } catch (error) {
//     return res.status(500).json({
//         success:false,
//         message:error.message
//     })
//   }
// };
