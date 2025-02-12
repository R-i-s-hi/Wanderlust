const Listing = require("../models/listing.js");
const Review = require("../models/review.js");

// post route
module.exports.post = async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    let newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    listing.reviews.push(newReview);

    await newReview.save();
    await listing.save();

    console.log("Review Saved");
    req.flash("success", "New Reviewe Created!");
    res.redirect(`/listings/${listing._id}`);
};

// delete route
module.exports.del = async (req, res) => {
   let {id, reviewId} = req.params;
   await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
   await Review.findByIdAndDelete(reviewId);
   req.flash("success", "Review Deleted!");
   res.redirect(`/listings/${id}`);
};