const Category = require("../models/Category");
function getRandomInt(max) {
  return Math.floor(Math.random() * max)
}

// ! createCategory
exports.createCategory = async (req, res) => {
  try {
    // fetch the data
    const { name, description } = req.body;
    // validation
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "all fields are required",
      });
    }

    // create entry in db
    const categoryDetails = await Category.create({ name, description });
    console.log(`categoryDetails `, categoryDetails);

    // return
    return res.status(200).json({
      success: true,
      message: "category created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//! get all category
exports.showAllCategory = async (req, res) => {
  try {

    const allCategory = await Category.find({}, { name: true, description: true });

    res.status(200).json({
      success: true,
      message: "all category return succesfully",
     data:allCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ! category page details -> see ui different different types ke course show krna 
exports.categoryPageDetails = async(req,res)=>{
  try{

    // get category id
    const {categoryId} = req.params;

    // get courses for specified category id
    const selectedCategory = await Category.findById(categoryId).populate({
      path:"course",
      match:{status:"Published"},
      // populate:"ratingAndReviews",
    }).exec(); 

    // validation 
    if(!selectedCategory){
      return res.status(404).json({
        success:false,
        message:"categoy not found "
      })
    }

    if(selectedCategory.course.length ===0){
      return res.json({
        success:false,
        message:"no course found for the selected category",
      })
    }
    // get courses for different category
    const categoriesExceptSelected = await Category.find({
      // find by idd not equal (ne) to category id
      _id: { $ne: categoryId },
    })
    let differentCategory = await Category.findOne(
      categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]
        ._id
    )
      .populate({
        path: "course",
        match: { status: "Published" },
      })
      .exec()

      
    //todo: get top selling courses
    const allCategorires = await Category.find().populate({path:"course" , 
  match:{status:"Published"} , 
 populate:{
  path:"instructor",
 }
}).exec();

const allCourses = allCategorires.flatMap((category)=>category.course)
const mostSellingCourses = allCourses.sort((a,b)=>b.sold-a.sold).slice(0,10)

    // ṛeturn 
    return res.status(200).json({
      success:true,
      message:"successfuly fetch all category details ",
    data:{
      selectedCategory,
      differentCategory , 
      mostSellingCourses
    }
    })
         
  } catch(error){
 console.log(error);
 return res.status(500).json({
  success:false,
  message:error.message
 })
  }
}
