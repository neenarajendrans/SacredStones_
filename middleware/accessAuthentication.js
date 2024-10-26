const User = require("../model/userModel");

const isBlocked = async (req, res, next) => {
    try {

        const userData = await User.findById({ _id: req.session.user_id });

        if (userData.is_blocked === true) {

            req.session.user_id = null;
            res.render("user/signup", { message: "Access Restricted" });

        } else {
            next();
        }

    } catch (error) {
        console.log(error.message);
    }
}



module.exports = {
    isBlocked
}