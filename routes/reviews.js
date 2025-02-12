const express = require("express");
const router = express.Router({mergeParams: true});

const wrapAsync = require("../utils/wrapAsync.js");
const {validateReview, isLoggedIn, isReviewAuther} = require("../middleware.js");

const reviewController = require("../controllers/reviews.js");


// post Route
router.post("/", isLoggedIn, validateReview, wrapAsync(reviewController.post))

//delete route
router.delete("/:reviewId", isLoggedIn, isReviewAuther, wrapAsync(reviewController.del));

module.exports = router;