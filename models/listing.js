const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./review.js");
const { required } = require("joi");

const listingSchema = new Schema({
    title:{ 
        type: String,
        required: true,
    },
    description:{ 
        type: String,
        required: true,
    },
    propertyType: {
        type: String,
        required: true,
        enum: [
            "Hotel",
            "House",
            "Flat",
            "Guest House"
        ]
    },
    image: {
        url: String,
        filename: String,
    },
    price: { 
        type: Number,
        required: true,
    },
    guest_Capacity: {
        type: Number,
        required: true
    },
    // interiorInfo: {
    //     capacity: {
    //         type: Number,
    //         default: 2
    //     },
    //     rooms: {
    //         size: {
    //             type: String,
    //             enum: ["small", "medium", "big"]
    //         },
    //         quantity: {
    //             type: Number,
    //             default: 2
    //         },
    //     },
    //     bathroom: {
    //         size: {
    //             type: String,
    //             enum: ["small", "medium", "big"]
    //         },
    //         quantity: {
    //             type: Number,
    //             default: 2
    //         },
    //     }
    // },
    location:{ 
        type: String,
        required: true,
    },
    country:{ 
        type: String,
        required: true,
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    amenities: [
        {
            type: String,
            enum: [
                "WiFi",
                "Swimming Pool",
                "Air Conditioning",
                "Mountains & Hills",
                "Beach & Tent",
                "Lake & Rivers",
                "Boat House",
                "Personal Bar",
                "Guest Favourite",
                "Saved"
            ],
            default: []
        }
    ],
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true,
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    isSaved: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: "User"
        }],
        default: [],
    },
    bookedUsers: { 
        type: [{
            type: Schema.Types.ObjectId,
            ref: "Booking"
        }]
    }
})

// mongoose middleware
listingSchema.post("findOneAndDelete", async(listing) => {
    if(listing) {
        await Review.deleteMany({_id: {$in: listing.reviews}});
    }
})

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;