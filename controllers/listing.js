require("dotenv").config();
const Listing = require("../models/listing");
const Booking = require("../models/booking.js");
const { getCoordinate } = require('../utils/coordinates.js');




module.exports.index = async (req, res) => {
  try {
    const filters = [];

    const priceRange = req.query.priceRange ? req.query.priceRange.split(",") : [];
    const amenities = req.query.amenities ? req.query.amenities.split(",") : [];
    const propertyType = req.query.propertyType ? req.query.propertyType.split(",") : [];
    const guests = req.query.guestNum ? req.query.guestNum : 0;
    const destination = req.query.destination ? req.query.destination : "";

    if (amenities.length) {
      filters.push({ amenities: { $all: amenities } });
    }

    if (propertyType.length) {
      filters.push({ propertyType: { $all: propertyType } });
    }

    if (priceRange.length) {
      filters.push({
        $or: priceRange.map(r => {
          const [minStr, maxStr] = r.split("-");
          const min = Number(minStr);
          const max = Number(maxStr);
          if (Number.isFinite(min) && Number.isFinite(max)) {
            return { price: { $gte: min, $lte: max } };
          }
          return null;
        }).filter(Boolean)
      });
    }

    if (guests > 0) {
      filters.push({ guest_Capacity: { $gte: guests } });
    }

    if (destination && destination.length > 0) {
      filters.push({
        $or: [
          { location: { $regex: destination, $options: "i" } },
          { country: { $regex: destination, $options: "i" } }
        ]
      });
    }

    const query = filters.length ? { $and: filters } : {};

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
  try {
    let { id } = req.params;
    id = id.trim();

    const listing = await Listing.findById(id)
      .populate({
        path: "reviews",
        populate: { path: "author" }
      })
      .populate("owner");

    if (!listing) {
      req.flash("error", "Listing Does not Exist!");
      return res.redirect("/listings");
    }

    // Calculate average rating
    const reviews = listing.reviews || [];
    let total_Rating = 0;
    reviews.forEach(review => {
      total_Rating += review.rating;
    });
    const avg_rating = reviews.length > 0
      ? (total_Rating / reviews.length).toFixed(2)
      : 0;

    // Safe userId (null if logged out)
    const userId = req.user?._id || null;

    res.render("listings/show.ejs", {
      listing,
      avg_rating,
      currUser: req.user || null,
      userId,
      razorpayKey: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error(err);
    req.flash("error", "Something went wrong!");
    res.redirect("/listings");
  }
};

module.exports.savedListings = async (req, res) => {

    try {
        const savedListings = await Listing.find({isSaved: req.user._id}).sort({ updatedAt: -1 });
        const bookings = await Booking.find({user: req.user._id}).populate("listing").sort({ createdAt: -1 });
        const myListings = await Listing.find({owner: req.user._id});
        
        if (savedListings || bookings || myListings) {
            res.render("listings/savedListings.ejs", {savedListings, bookings, myListings});
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