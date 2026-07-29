require("dotenv").config();
const Listing = require("../models/listing");
const Booking = require("../models/booking.js");
const { getCoordinate } = require('../utils/coordinates.js');




module.exports.index = async (req, res) => {
  try {
    const query = {};

    // Parse filters from query or body
    const priceRange = req.query.priceRange
    ? req.query.priceRange.split(",")
    : [];

    const amenities = req.query.amenities
    ? req.query.amenities.split(",")
    : [];

    const propertyType = req.query.propertyType
    ? req.query.propertyType.split(",")
    : [];

    // Build query dynamically
    if (amenities.length) {
      query.amenities = { $all: amenities }; // OR $in for "any"
    }
    if (propertyType.length) {
      query.propertyType = { $all: propertyType };
    }
    if (priceRange.length) {
        query.$or = priceRange.map(r => {
            const [minStr, maxStr] = r.split("-");
            const min = Number(minStr);
            const max = Number(maxStr);
            if (Number.isFinite(min) && Number.isFinite(max)) {
            return { price: { $gte: min, $lte: max } };
            }
            return null;
        }).filter(Boolean);
    }


    // Fetch listings
    const allListings = await Listing.find(query);

    if (allListings.length === 0) {
      req.flash("error", "Can't find listings, change filters!");
      return res.redirect("/listings");
    }

    res.render("listings/index", {
      allListings,
      currUser: req.user,
      selectedAmenities: amenities,
      selectedPropertyType: propertyType,
      selectedPriceRange: priceRange
    });
  } catch (e) {
    console.error(e);
    req.flash("error", "Something went wrong!");
    res.redirect("/listings");
  }
};


module.exports.new = (req, res) => {
    res.render("listings/new.ejs");
};

module.exports.create = async (req, res, next) => {
    
    const result = await getCoordinate(req.body.listing.location);
    console.log(result);
    
    const {path, filename} = req.file;

    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = {url: path, filename};
    newListing.geometry = result;
    await newListing.save();
    req.flash("success", "New Listing Created!");
    res.redirect("/listings");
};

module.exports.show = async (req, res) => {
    let { id } = req.params;
    const {userId} = req.user._id;

    id = id.trim();

    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            }
        })
        .populate("owner");
    
    const reviews = listing.reviews;
    var total_Rating = 0;

    reviews.forEach(review => {
        total_Rating += review.rating;
    });
    const avg_rating = reviews.length > 0 ? (total_Rating / reviews.length).toFixed(2) : 0;


    if (!listing) {
        req.flash("error", "Listing Does not Exist!");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing, avg_rating, currUser: req.user, razorpayKey: process.env.RAZORPAY_KEY_ID });
};

module.exports.savedListings = async (req, res) => {

    try {
        const savedListings = await Listing.find({isSaved: req.user._id})

        const bookings = await Booking.find({user: req.user._id}).populate("listing");
        let bookedListings = [];
        if(bookings.length > 0) {
            bookedListings = bookings.map(b => b.listing);
        }

        if (savedListings || bookedListings) {
            res.render("listings/savedListings.ejs", {savedListings, bookedListings});
        }
    } catch (e) {
        req.flash("error", "Something went wrong!");
        console.log(`savedlistings error: ${e}`);
    }
}

module.exports.edit = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Listing Does not Exist!");
        res.redirect("/listings");
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/w_250");
    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.update = async (req, res) => {
    let { id } = req.params;
    let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    
    if(req.file) {
        let {path, filename} = req.file;
        listing.image = {url: path, filename};
        await listing.save();
    }

    req.flash("success", "Listing Updated!");
    res.redirect(`/listings/${id}`);
};

module.exports.delete = async (req, res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id)
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};

module.exports.toggleSave = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id; // must be logged in

        const listing = await Listing.findById(id);
        if (!listing) {
            return res.status(404).json({ success: false, message: "Listing not found" });
        }

        let isSaved;
        if (listing.isSaved.includes(userId)) {
            // remove user from saved list
            listing.isSaved.pull(userId);
            isSaved = false;
        } else {
            // add user to saved list
            listing.isSaved.push(userId);
            isSaved = true;
        }

        await listing.save();

        // return JSON so frontend fetch works
        res.json({ success: true, isSaved });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

module.exports.searchByFilter = async (req, res) => {
    try {

        const amenities = req.body.amenities
            ? JSON.parse(req.body.amenities)
            : [];

        const propertyType = req.body.propertyType
            ? JSON.parse(req.body.propertyType)
            : [];

        const priceRange = req.body.priceRange
            ? JSON.parse(req.body.priceRange)
            : [];

        const query = {};

        if (amenities.length) {
            query.amenities = {$all: amenities};
        }
        if (propertyType.length) {
            query.propertyType = {$all: propertyType};
        }
        if (priceRange.length) {
            query.$or = priceRange.map(r => {
                const [min, max] = r.split("-").map(Number);
                return { price: { $gte: min, $lte: max } };
            });;
        }

        const allListings = await Listing.find(query);

        if(allListings.length === 0) {
            req.flash("error", "Can't find listings, change filters!");
            return res.redirect("/listings");
        }

        res.render("listings/index", {allListings})

    } catch (e) {
        console.log(e);
    }
}