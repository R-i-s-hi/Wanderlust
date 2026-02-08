const Listing = require("../models/listing");
const { getCoordinate } = require('../utils/coordinates.js');


//  index route
module.exports.index = async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
};

// new route
module.exports.new = (req, res) => {
    res.render("listings/new.ejs");
};

// create route
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

// show route
module.exports.show = async (req, res) => {
    let { id } = req.params;
    id = id.trim();
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            }
        })
        .populate("owner");
    if (!listing) {
        req.flash("error", "Listing Does not Exist!");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
};

// edit route
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

// update route 
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

// delete route
module.exports.delete = async (req, res) => {
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id)
    console.log(deletedListing);
    req.flash("success", "Listing Deleted!");
    res.redirect("/listings");
};