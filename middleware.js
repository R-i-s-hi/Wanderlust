const Listing = require("./models/listing");
const Review = require("./models/review");
const {listingSchema, reviewSchema} = require("./schema.js");
const ExpressError = require("./utils/expressError.js");


module.exports.isLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()) {
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be logged in to create a list!");
        return res.redirect("/login");
    }
    next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
    if(req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

module.exports.isOwner = async (req, res, next) => {
    let { id } = req.params;
    let listing = Listing.findById(id);
    if(!res.locals.currUser && listing.owner._id.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the owner!");
        return res.redirect(`/listings/${id}`);
    }
    next();
}

// joi listing middleware
module.exports.validateListing = (req, res, next) => {
    console.log("Validating listing data:", req.body);
    const {error} = listingSchema.validate(req.body);
    if(error) {
        throw new ExpressError(400, error.details.map((el) => el.message).join(","));
    } else {
        next();
    }
}

//joi middleware
module.exports.validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body);
    if(error) {
        throw new ExpressError(400, error.details.map((el) => el.message).join(","));
    } else {
        next();
    }
}

module.exports.isReviewAuther = async (req, res, next) => {
    let { id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    if (!res.locals.currUser) {
        req.flash("error", "User not logged in!");
    }
    if(!review.author.equals(res.locals.currUser._id)) {
        req.flash("error", "You are not the owner!");
        console.log("you are not the owner!");
        return res.redirect(`/listings/${id}`);
    }
    next();
}