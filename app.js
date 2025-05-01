if(process.env.NODE_ENV != "production") {
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");

const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/expressError.js");

// routes requiring
const listingsRouter = require("./routes/listings.js");
const reviewsRouter = require("./routes/reviews.js");
const usersRouter = require("./routes/users.js");

// flash and sessions
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");

// passport (authentication & authorization)
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const DB_URL = process.env.ATLASDB_URL;
main()
    .then(() => {
        console.log("connected to db.");
    })
    .catch((err) => {
        console.log(err);
    });

async function main() {
    await mongoose.connect(DB_URL);
}

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "public")));

const store = MongoStore.create({
    mongoUrl: DB_URL,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24 * 3600,
});

store.on("error", () => {
    console.log("ERROR in MONGO SESSION STORE", err);
})

const sessionOptions = { 
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

// flash messages
app.use(session(sessionOptions));
app.use(flash());

// using passport methods for authentication & authorization
app.use(passport.initialize()); // middleware that initializes passport
app.use(passport.session()); // to identify that user is same all time
passport.use(new LocalStrategy(User.authenticate())); // .authenticate() generates a func used in LocalStrategy
passport.serializeUser(User.serializeUser()); // used to save user info in session
passport.deserializeUser(User.deserializeUser()); // used to remove user info after session

/* middleware for pop-ups(flash) */
app.use((req, res, next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

// app.get("/register", (req, res) => {
//     let { name = "anonymous" } = req.query;
//     req.session.name = name;
//     res.redirect("/hello");
// });

// app.get("/hello", (req, res) => {
//     res.send(`hello ${req.session.name}`);
// });

// logger middleware
// app.use((req, res, next) => {
//     req.time = new Date(Date.now());
//     console.log(req.method, req.hostname, req.time);
//     next();
// });

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use("/", usersRouter);

app.get("/", (req, res) => {
    res.redirect("/listings"); // Redirects to the listings page
});

/* error middlewares */
// ExpressError class 
app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

// alternate of try-catch
app.use((err, req, res, next) => {
    let { status = 500, message = "Something went wrong!" } = err;
    res.render("error.ejs", { message });
});

app.listen(8080, () => {
    console.log("server is listening at port 8080");
});
