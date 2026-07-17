const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
    listing: { 
        type: Schema.Types.ObjectId,
        ref: "Listing"
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    order_id: String,
    payment_id: String,
    signature: String,
    status: {
        type: String,
        enum: ["pending", "confirmed", "failed"],
        default: "pending"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Booking", bookingSchema);
