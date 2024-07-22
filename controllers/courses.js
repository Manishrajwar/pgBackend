const Course = require("../models/Course");
const {uploadToCloudinary} = require("../utils/imageUploader");
const Category = require("../models/Category");
const User = require("../models/User");
const CourseProgress = require("../models/CourseProgress");
const Section = require("../models/Section")
const SubSection = require("../models/SubSection")
require("dotenv").config();
const { convertSecondsToDuration } = require("../utils/secToDuration")



//! create Course
exports.createCourse = async(req ,res)=>{
    try{
        
        // fetch data
        let {courseName , courseDescription , whatYouWillLearn , category , price , 
            tag:_tag ,
            status , instructions} = req.body;
        
         //! file -> image

        let thumbnail = req.files.thumbnailImage;

        const tag = JSON.parse(_tag);

        // !validation

        if(!courseName || !courseDescription || !whatYouWillLearn || !price || !tag.length 
            ||
         !category || !instructions.length ){
            return res.status(400).json({
                success:false,
                message:`all fields are required`
            });
        }

       if(!status || status ===undefined){
        status ='Draft';
       }

        // instructor validation ->we are checking this because Course model mai hume instructor ki object id store krni padti hai tabhi db call kr rhe hai
       const userId = req.user.id;


   const instructorDetails = await User.findById(userId , {
    accountType:"Instructor"
   });


   if(!instructorDetails){
    return res.status(404).json({
        success:false,
        message:"instructor details not found ",
    })
   }

       const categoryDetails = await Category.findOne({_id:category});
       if(!categoryDetails){
        return res.status(404).json({
            success:false,
            message:"category details not found ",
        })
       }

        //! image to cloudinary

      const thumbnailImage = await uploadToCloudinary(thumbnail , process.env.FOLDER_NAME , 1000,1000 );

        // !entry in db

        const newCourse = await Course.create({ courseDescription , courseName , instructor:instructorDetails._id, whatYouWillLearn , price , category:categoryDetails._id , 
          tag ,
            thumbnail:thumbnailImage.secure_url ,
            instructions:instructions , status:status});

        // !add course entry in user schema of instructor => because user can be admin and all course create by him should be mention there

        await User.findByIdAndUpdate({_id:instructorDetails._id},
            {$push:{
                courses:newCourse._id,
            }}
            ,{new:true}
            )



// todo: it was homework
        // add course entry in Category => because us Category ke inside sare course aa jaye
        await Category.findByIdAndUpdate({_id:categoryDetails._id} , {
    $push:{
        course:newCourse._id,
    }
},{new:true})



        // return response
return res.status(200).json({
    success:true,
    message:"course created successfully",
    data:newCourse
})


    } catch(error){
  console.log("error in creating the course " ,error);
   return res.status(500).json({
    success:false,
    message:`failed to create error course`
   })
    }
}


//! showAllCourses
exports.showAllCourses = async (req ,res)=>{
    try{

        const allCourses = await Course.find(
            { status: "Published" },
            {
              courseName: true,
              price: true,
              thumbnail: true,
              instructor: true,
              ratingAndReviews: true,
              studentsEnrolled: true,
            }
          )
            .populate("instructor")
            .exec()

            return res.status(200).json({
                success:true ,
                message:"successfully fetch"  ,
                allCourses
            })
        
    } catch(error){
console.log(error);
return res.status(500).json({
     success:false,
     message:"cannot fetch course data ",
     error:error.message
})
    }
}

// ! getCourseDetails 
 
exports.getCourseDetails = async(req,res)=>{
    try{
        const {courseId} = req.params;

        if(!courseId){
            return res.json({
                success:false,
                message:"please send  the details courseId "
            })
        }

        const courseDetails = await Course.findById({_id:courseId}).populate({
            path:"instructor",
            populate:{
                path:"additionalDetails",
            },
            
        }
        )
        .populate("category")
        // .populate("ratingAndReivew")
        .populate({
       path:"courseContent",
       populate:{
        path:"subSection",
       }
        })
        .exec();

        if(!courseDetails){
            return res.json({
                success:false,
                message:`could find the course with ${courseId}`
            })
        }

        return res.status(200).json({
            success:true,
            message:'course details fetch successfully',
            courseDetails
        })
    } catch(error){
     console.log(error);
     return res.status(500).json({
        success:false,
        message:"cannot fetch the courseDetails"
     })
    }
}

// ! get full course Details
exports.getFullCourseDetails = async (req, res) => {
    try {
       console.log("start");
      const { courseId } = req.params;
      console.log("courseId" , courseId);
      const userId = req.user.id;
      console.log("usersiD" , userId);

      const courseDetails = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        // .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()

        console.log("courseDetails " , courseDetails);
  
      let courseProgressCount = await CourseProgress.findOne({
        courseID: courseId,
        userId: userId,
      })
  
      console.log("courseProgressCount : ", courseProgressCount)
  
      if (!courseDetails) {
        return res.status(400).json({
          success: false,
          message: `Could not find course with id: ${courseId}`,
        })
      }
  
      let totalDurationInSeconds = 0
      courseDetails.courseContent.forEach((content) => {
        content.subSection.forEach((subSection) => {
          const timeDurationInSeconds = parseInt(subSection.timeDuration)
          totalDurationInSeconds += timeDurationInSeconds
        })
      })
  
      const totalDuration = convertSecondsToDuration(totalDurationInSeconds);
      console.log("totalduration" , totalDuration);
  
      console.log("return true");
      return res.status(200).json({
        success: true,
        data: {
          courseDetails,
          totalDuration,
          completedVideos: courseProgressCount?.completedVideos
            ? courseProgressCount?.completedVideos
            : [],
        },
      })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      })
    }
  }

//! Get a list of Course for a given Instructor
exports.getInstructorCourses = async (req, res) => {
    try {
      // Get the instructor ID from the authenticated user or request body
      const instructorId = req.user.id;
  
      // Find all courses belonging to the instructor
      const instructorCourses = await Course.find({
        instructor: instructorId,
      }).sort({ createdAt: -1 })  
  
      // Return the instructor's courses
      res.status(200).json({
        success: true,
        data: instructorCourses,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Failed to retrieve instructor courses",
        error: error.message,
      })
    }
  }

// ! delete Course 
exports.deleteMyCourse = async(req ,res)=>{
    try {
        const { courseId } = req.params;
    
        // Find the course
        const course = await Course.findById(courseId)
        if (!course) {
          return res.status(404).json({ message: "Course not found" })
        }
    
        // Unenroll students from the course
        const studentsEnrolled = course.studentsEnrolled
        for (const studentId of studentsEnrolled) {
          await User.findByIdAndUpdate(studentId, {
            $pull: { courses: courseId },
          })
        }
    
        // Delete sections and sub-sections
        const courseSections = course.courseContent
        for (const sectionId of courseSections) {
          // Delete sub-sections of the section
          const section = await Section.findById(sectionId)
          if (section) {
            const subSections = section.subSection
            for (const subSectionId of subSections) {
              await SubSection.findByIdAndDelete(subSectionId)
            }
          }
    
          // Delete the section
          await Section.findByIdAndDelete(sectionId)
        }
    
        // Delete the course
        await Course.findByIdAndDelete(courseId)
    
        return res.status(200).json({
          success: true,
          message: "Course deleted successfully",
        })
      } catch (error) {
        console.error(error)
        return res.status(500).json({
          success: false,
          message: "Server error",
          error: error.message,
        })
      }
}

// ! edit course Details
exports.editCourse = async(req ,res)=>{
    try{

        const {courseId ,status }  = req.body;
   
        const course = await Course.findById(courseId);

        if(!course){
            return res.status(404).json({ error: "Course not found" }) 
        }

     course.status = status;
      await course.save()

      const updatedCourse = await Course.findOne({
        _id: courseId,
      })
        .populate({
          path: "instructor",
          populate: {
            path: "additionalDetails",
          },
        })
        .populate("category")
        // .populate("ratingAndReviews")
        .populate({
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        })
        .exec()
  
      res.json({
        success: true,
        message: "Course updated successfully",
        data: updatedCourse,
      })
    } catch (error) {
      console.error(error)
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      })
    }
  }




 