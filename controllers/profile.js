const Course = require("../models/Course");
const Profile = require("../models/Profile");
const User = require("../models/User");
const { uploadToCloudinary } = require("../utils/imageUploader");
require("dotenv").config();

// ! update Profile
exports.updateProfile = async (req, res) => {
  try {
    //  fetch data
    const { firstName, lastName, gender, dateOfBirth, about, contactNumber } =
      req.body;
    // user id
    const id = req.user.id;
    console.log("id", id);
    // find   the profile
    const userDetails = await User.findById({ _id: id });
    console.log("userDetails ", userDetails);

    const profileId = userDetails.additionalDetails;
    console.log("profileId", profileId);

    const profileDetails = await Profile.findById({ _id: profileId });
    console.log("profileDetails", profileDetails);

    //    update the profile
    userDetails.firstName = firstName;
    userDetails.lastName = lastName;
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.gender = gender;
    profileDetails.contactNumber = contactNumber;

    await userDetails.save();
    await profileDetails.save();

    // return response
    return res.status(200).json({
      success: true,
      message: "profile updated successfully",
      profileDetails,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: `cannot update profile of user`,
    });
  }
};

// !deleteAccount
// todo: Explore how can we schedule the deletion operation
exports.deleteAccount = async (req, res) => {
  try {
    
    // get id
    const id = req.user.id;

    // check valid id or not
    const userDetails = await User.findOne({ _id: id });

    if (!userDetails) {
      return res.status(404).json({
        success: false,
        message: `user not found`,
      });
    }

    //delete profile
    await Profile.findByIdAndDelete({
      _id: userDetails.additionalDetails,
    }).exec();

    // todo:HW unroll user from all enrolled courses delete
    const courses = await Course.find({ studentsEnrolled: id });

    if (courses.length > 0) {
      // Remove the user from the "enrolled" array in each course
      const updatePromises = courses.map((course) => {
        course.studentsEnrolled = course.studentsEnrolled.filter(
          (enrolledUserId) => enrolledUserId.toString() !== id
        );
        return course.save();
      });

      await Promise.all(updatePromises);
    }

    //now  delete user
    await User.findByIdAndDelete({ _id: id }).exec();

    // return response
    return res.status(200).json({
      success: true,
      message: "successfully deleted the account ",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "cannot delete account , please try again ",
    });
  }
};

// ! get all user Details
exports.getAllUserDetails = async (req, res) => {
  try {
    const id = req.user.id;

    const userDetails = await User.findById({ id })
      .populate("additionalDetails")
      .exec();

    return res.status(200).json({
      success: true,
      message: ` user data fetch successfully`,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "cannot fetch all user details , please try again ",
    });
  }
};

// ! update Display picture
exports.updateDisplayPicture = async (req, res) => {
  try {
    const displayPicture = req.files.displayPicture;
    console.log("displayPicture ", displayPicture);
    const userId = req.user.id;
    console.log("user id", userId);

    //  validation
    if (!displayPicture) {
      return res.status(403).json({
        success: false,
        message: `please send the display profile`,
      });
    }

    // upload to cloudinary
    const image = await uploadToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );

    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "successfully update the profile picture",
      updatedProfile,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "error in updating the profile ",
    });
  }
};

// ! update Password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(403).json({
        success: false,
        message: "please send the require data ",
      });

      const userId = req.user.id;

      const userDetails = await User.findByIdAndUpdate({});
    }
  } catch (error) {}
};

// ! get login user details
exports.getUserDetails = async (req, res) => {
  try {
    const id = req.user.id;

    const user = await User.findById({ _id: id });

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "cannot fetch user details",
    });
  }
};

// ! get user enrolled details
exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const userDetails = await User.findOne({
      _id: userId,
    })
      .populate("courses")
      .exec();

    if (userDetails.courses.length === 0) {
      return res.json({
        success: false,
        message: `${userDetails.firstName} is not enrolled in any courses`,
      });
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
