const express = require("express");
const router = express.Router();
const { listingSchema } = require('../models/listing.js');
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");

const listingController = require("../controllers/listing.js");

const multer = require("multer");
const {storage} = require("../cloudconfig.js");
const upload = multer({storage});

router.route("/")
    .get(wrapAsync(listingController.index)) // index route
    .post(isLoggedIn, upload.single("listing[image]"),  (req, res, next) => {
        req.body.listing.price = Number(req.body.listing.price); 
        next();
     }, validateListing, wrapAsync(listingController.create)); //create route

// new route
router.get("/new", isLoggedIn, listingController.new);

router.route("/:id")
    .get(wrapAsync(listingController.show)) // show route
    .put(isLoggedIn, isOwner, upload.single("listing[image]"), validateListing, wrapAsync(listingController.update)) // update route
    .delete(isLoggedIn, isOwner, wrapAsync(listingController.delete)); // delete route

// edit route
router.get("/:id/edit", isLoggedIn, isOwner, wrapAsync(listingController.edit));



module.exports = router;