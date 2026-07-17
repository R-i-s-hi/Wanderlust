require("dotenv").config();
const Razorpay = require("razorpay");
const Listing = require("../models/listing");
const Booking = require("../models/booking");
const {v4: uuidv4} = require("uuid");
const crypto = require("crypto");

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const razorpay = new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET })


module.exports.createOrder = async(req, res) => {

    const {id} = req.params;
    
    try {
        const listing = await Listing.findById(id);

        if(!listing) {
            return res.status(404).json({message: "can't find listing!"});
        }

        const receipt_id = uuidv4();

        const options = {
            amount: listing.price * 100,
            currency: "INR",
            receipt: receipt_id,
        };

        const order = await razorpay.orders.create(options);

        const booking = await Booking.create({
            listing: id,
            user: req.user._id,
            order_id: order.id,
            status: "pending"
        });

        
        res.json(order);

    } catch (e) {
        res.status(500).json({success: false, error: e});
    }
};

module.exports.verifyPayment = async (req, res) => {

    const {id} = req.params;
    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        const secret = process.env.RAZORPAY_KEY_SECRET;

        const generatedSignature = crypto
            .createHmac("sha256", secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");
            
        const booking = await Booking.findOne({ order_id: razorpay_order_id });
        if (generatedSignature === razorpay_signature) {
            
            booking.status = "confirmed";
            booking.payment_id = razorpay_payment_id;
            booking.signature = razorpay_signature;
            await booking.save();
            
            await Listing.findByIdAndUpdate(id, { $push: { bookedUsers: booking.user } });
            
            req.flash("success", "Booking Successful");
            res.redirect(`/listings/${id}`);

        } else {
            booking.status = "failed";
            await booking.save();

            req.flash("error", "Booking failed");
            res.redirect(`/listings/${id}`);
        }


    } catch (err) {

        res.status(500).json({
            success: false,
            error: err
        });

    }

};


module.exports.markFailure = async (req, res) => {
  const { order_id } = req.body;
  const booking = await Booking.findOne({ order_id: order_id });
  if (booking) {
    booking.status = "failed";
    await booking.save();
  }
  res.json({ success: true });
}