require("dotenv").config();
const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // your Gmail app password
  },
  tls: {
    rejectUnauthorized: false, // allow self-signed certs
  },
});


transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP Error:", error);
  } else {
    console.log("Server is ready to take messages");
  }
});

module.exports.sendBookingEmail = async(booking) => {

  try {
    
    const [lng, lat] = booking.listing.geometry.coordinates;
    const subject = `Booking Confirmation - Ref #${booking._id}`;
const text = `Hi ${booking.name},

Thank you for booking with Wanderlust!
Here are your booking details:

Booking Reference: ${booking._id}
Guest Name: ${booking.name}
Check-in: ${booking.checkin}
Check-out: ${booking.checkout}
Guests: 2 Adults, 1 Child
Hotel: ${booking.listing.title}
Address: ${booking.listing.location}, ${booking.listing.country}
Maps: https://www.google.com/maps?q=${lat},${lng}
Contact: +91-9876543210

Price Summary:
Room Charges: ₹${booking.listing.price}
Taxes & Fees: ₹500
Total: ₹${booking.listing.price + 500} (Pending Payment)

Special Requests: Airport Pickup

Cancellation Policy: Free cancellation until 48 hours before check-in.

Next Step: Please complete your payment to finalize your booking. Once payment is confirmed, you will receive your official receipt.

We look forward to hosting you!

Wanderlust Hotels Team`; 
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: booking.email,
      subject,
      text,
    });

  } catch (e) {
    console.log("sendBookEmailError: ", e);
  }


}

module.exports.sendBookingAbandonEmail = async(booking) => {
  
  try {

    const subject = `Booking Cancelled – Payment Not Completed || Ref #${booking._id}`;
const text = `

Hi ${booking.name},

We noticed you started a booking for ${booking.listing.title} but did not complete the payment. 
Your booking reference ${booking._id} has been cancelled automatically.

If you still wish to stay with us, please re‑book at your convenience.

Wanderlust Hotels Team
`; 

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: booking.email,
      subject,
      text,
    });

  } catch (e) {
    console.log("sendBookEmailError: ", e);
  }
}

module.exports.sendBookingCancelledEmail = async(booking) => {
  
  try {

    const subject = `Booking Cancelled – Refund Initiated || Ref #${booking._id}`;
const text = `Hi ${booking.name},

Your booking ${booking._id} at ${booking.listing.title} has been cancelled as requested. 
We have initiated a refund of ₹${booking.listing.price + 500} to your original payment method. 
Refunds are processed by Razorpay and may take 5–7 business days to reflect.

We hope to welcome you again in the future.

Wanderlust Hotels Team
`; 

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: booking.email,
      subject,
      text,
    });

  } catch (e) {
    console.log("sendBookEmailError: ", e);
  }
}

module.exports.sendReceiptEmail =  async (payment, booking) => {
  try{
    const subject = `Payment Receipt - Ref #${booking._id}`;
const text = `Hi ${booking.name},

We have received your payment successfully.

Booking Reference: ${booking._id}
Booking Status: ${booking.status}
Amount Paid: ₹${booking.listing.price + 500}
Payment ID: ${booking.payment_id}
Date: ${new Date(payment.created_at).toLocaleDateString()}

Your booking is now finalized. We look forward to hosting you!

Wanderlust Hotels Team`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: booking.email,
      subject,
      text,
    });

  } catch (e) {
    console.log("sendBookEmailError: ", e);
  }
}
