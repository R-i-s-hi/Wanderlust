const User = require("../models/user.js");

// sign up
// get
module.exports.signUpPg = (req, res) => {
    res.render("users/signup.ejs");
};
// post
module.exports.signUpPost = async (req, res, next) => {
    try {
        let {username, email, password} = req.body;
        const newUser = new User({email, username});
        const registeredUser = await User.register(newUser, password);
        console.log(registeredUser);
        // .login() func login automatically after signup
        req.login(registeredUser, (err) => {
            if(err) {
                return next(err);
            }
            req.flash("success", "Welcome to Wanderlust!");
            res.redirect("/listings");
        });
    } catch(e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

// login
// get
module.exports.loginPg = (req, res) => {
    res.render("users/login.ejs");
};
// post
module.exports.loginPost =  async (req, res) => {
    req.flash("success", "Welcome back to Wanderlust");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

// logout
module.exports.logOut = (req, res, next) => {
    req.logout((err) => {
        if(err) {
            return next(err);
        } 
        req.flash("success", "Logged Out Successfully!");
        res.redirect("/listings");
    })
};