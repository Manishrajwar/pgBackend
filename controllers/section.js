const Section = require("../models/Section");
const Course = require("../models/Course");
const subSection = require("../models/SubSection");

// ! create section
exports.createSection = async (req, res) => {
  try {
    // Extract the required properties from the request body
    const { sectionName, courseId } = req.body;

    // Validate the input
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing required properties",
      });
    }

    // Create a new section with the given name
    const newSection = await Section.create({ sectionName });

    // Add the new section to the course's content array
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    )
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    // Return the updated course object in the response
    res.status(200).json({
      success: true,
      message: "Section created successfully",
      updatedCourse,
    });
  } catch (error) {
    // Handle errors
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// ! update section
exports.updateSection = async (req, res) => {
  try {
    // fetch data
    const { sectionName, sectionId, courseId } = req.body;

    // validation
    if (!sectionName) {
      return res.status(400).json({
        success: false,
        message: `please fill the details `,
      });
    }

    // update data
    const updateSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        sectionName: sectionName,
      },
      { new: true }
    );


    const updateCourse =await Course.findOne({ _id: courseId }).populate({
      path: "courseContent",
      populate: {
        path: "subSection",
      },
    })
    .exec();

    //  return
    return res.status(200).json({
      success: true,
      message: "section is updated successfully",
      data: updateCourse,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: `unable to update section ,please try again `,
    });
  }
};

// ! delete section
exports.deleteSection = async (req, res) => {
  try {
    const { sectionId, courseId } = req.body;
    await Course.findByIdAndUpdate(courseId, {
      $pull: {
        courseContent: sectionId,
      },
    });

    
    const section = await Section.findById(sectionId);

    //delete sub section
    await subSection.deleteMany({ _id: { $in: section.subSection } });

    await Section.findByIdAndDelete(sectionId);

    //find the updated course and return
    const updatedCourse = await Course.findById(courseId)
      .populate({
        path: "courseContent",
        populate: {
          path: "subSection",
        },
      })
      .exec();

    res.status(200).json({
      success: true,
      message: "Section deleted",
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
