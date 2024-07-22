const RatingAndReview = require("../models/RatingAndReview");
const Course = require("../models/Course");
const { default: mongoose } = require("mongoose");


// ! createRating
exports.createRating = async(req ,res)=>{
    try{
        // fetch userid
        const userId = req.user.id;

        // fetch data from req.  body;
        const {rating , review ,courseId} = req.body;

        // check if  user is enrolled or not
        const courseDetails = await Course.findOne({_id:courseId , studentsEnrolled:{$eleMatch :{$eq: userId}}} )
    
        if(!courseDetails){
            return res.status(404).jsonn({
                success:false, 
                message:"user is not enrolled in course"
            })
        }


        

//* no repeatation of rating and review
const alreadyReviewed = await RatingAndReview.findOne({
    user:userId ,
    
} );
if(alreadyReviewed){
    return res.status(403).json({
        success:false,
        message:"course is already reviewed by the user "
    })
}


//* create rating and review
const ratingReview = await RatingAndReview.create({user:userId ,rating:rating , review:review});


// * add to course model
const courseRating = await Course.findByIdAndUpdate({_id:courseId},{$push:{ratingAndReivew:ratingReview._id}},{new:true});

// return response
return res.status(200).json({
    success:true,
    message:"rating is created successfully",
    ratingReview
})


    } catch(error){
 console.log(error);
 return res.status(500).json({
    success:false,
    message:"error in creating the review"
 })
    }
}

// ! get average rating
exports.getAverageRating = async(req ,res)=>{

    try{
        // * get courseId
        const {courseId } = req.body;

    
        //* calculate average rating

        // ratingandreview wale ke ander sabse pehle match krna hai assi entry ke sath jiski course key ke ander courseId wali value padi ho
        const result = await RatingAndReview.aggregate([
            {
                $match:{
                    course:new mongoose.Types.ObjectId(courseId)
                }
            },
            {
                $group:{
                    // jitni bhi entries ae thi unko single group mai rap kr diya
                    _id:null,
  averageRating:{
    $avg:"$rating",
  }
                }
            }
        ])
        // return rating 
        if(result.length >0){
            return res.status(200).json({
                success:true,
                averageRating:result(0).averageRating
            })
                }

                // if no rating review exist
                return res.status(200).json(
                    {
                        success:true,
                        message:"average rating is 0 , no rating till now ",
                        averageRating:0
                    }
                )
    }
     catch(error){
 console.log(error);
 return res.status(500).json({
    success:false,
    message:"not get average rating , please try again"
 })
     }
}


// ! get all rating and reviews
exports.getAllRatingAndReview = async(req ,res)=>{
    try{

        const allReviews = await RatingAndReview.find({}).sort({rating:"desc"}).populate({
            path:"user",
            // user ke ander kis kis field ki value chahiye bs
            select:"firstName lastName email image"
        })
        .populate({
            path:"course",
            select:"courseName",
        }).exec();

        return res.status(200).json({
            success:true,
            message:"all review fetch successfully"
        })

    } catch(error){
 console.log(error);
 return res.status(500).json({
    success:false,
    message:"not get average rating , please try again"
 })
    }
}