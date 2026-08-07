const joi = require("joi");

module.exports.listingSchema = joi.object({
    listing : joi.object({
        title : joi.string().required(),
        description : joi.string().required(),
        propertyType : joi.string().valid("Hotel", "House", "Flat", "Guest House", "Other").required(),
        image : joi.string().allow("", null),
        price : joi.number().required().min(0),
        guest_Capacity : joi.number().required().min(1).max(9),
        location : joi.string().required(),
        country : joi.string().required(),
        contactInfo : joi.number().required().min(1000000000).max(9999999999),
        amenities : joi.array().items(joi.string().valid("WiFi", "Swimming Pool", "Air Conditioning", "Mountains & Hills", "Beach & Tent", "Lake & Rivers", "Boat House", "Personal Bar", "Guest Favourite", "Saved")).required()
    }).required()
});

module.exports.reviewSchema = joi.object({
    review: joi.object({
        rating: joi.number().required().min(1).max(5),
        comment: joi.string().required()
    }).required()
});