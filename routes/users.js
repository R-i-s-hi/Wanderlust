const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const passport = require('passport');
const { saveRedirectUrl } = require("../middleware.js");

const userController = require("../controllers/users.js");

router.route("/signup")
    // signup
    .get(userController.signUpPg)
    .post(wrapAsync(userController.signUpPost));

router.route("/login")
    // login
    .get(userController.loginPg)
    .post(saveRedirectUrl, passport.authenticate("local", {failureRedirect: "/login", failureFlash: true}), userController.loginPost);

// logout
router.get("/logout", userController.logOut)

module.exports = router;