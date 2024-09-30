const express = require('express');
const passport = require('./config/passport')
const userRoute = require("./route/userRoute")
const adminRoute = require("./route/adminRoute")
const orderRoute = require("./route/orderRoute")
const cartRoute = require("./route/cartRoute")
const dotenv = require('dotenv').config();
const path = require('path');
const dbConnection = require('./config/dbConnection');
const session = require('express-session');
const morgan = require('morgan');
const colors = require('colors');
const {disableCacheMiddleware} = require("./middleware/authenticationMiddleware");
const fetchCartData = require('./middleware/fetchCart');

const app = express();
const port = process.env.PORT || 5001;
dbConnection();



app.use(session({
    secret: process.env.SESSIONSECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,//(7hr === 7 x 60 x 60 x 1000)
    }
}));
app.use((req, res, next) => {
    console.log('Session Data:', req.session);
    next();
});
app.use(passport.initialize());
app.use(passport.session());
app.use(disableCacheMiddleware);
app.use(express.json());
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname,"./public")))

          
app.set("view engine","ejs");
app.set("views","./views")

app.use(fetchCartData);

app.use("/", userRoute);
app.use("/admin", adminRoute); 
app.use("/order", orderRoute);
app.use("/cart", cartRoute);


app.listen(port,()=>{
    console.log(`Development server running on http://localhost:${port}`.magenta)
})


