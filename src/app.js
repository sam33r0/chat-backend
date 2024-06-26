import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import session from "express-session";
import passport from "passport";
import { Strategy as OAuth2Strategy } from "passport-google-oauth2";
import { User } from "./models/user.model.js";
import { Connection } from "./models/connections.model.js";
import mongoose from "mongoose";
const app = express();
app.use(cors({

    origin: true,
    credentials: true,
}));
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
app.use(express.json({ limit: "32kb" }))
app.use(express.urlencoded({ extended: true, limit: "32kb" }))
app.use(express.static("public"))
app.use(cookieParser());
app.use(bodyParser.json())

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { sameSite: 'strict' },
}))

app.use(passport.initialize());
app.use(passport.session())

passport.use(
    new OAuth2Strategy({
        clientID: client_id,
        clientSecret: client_secret,
        callbackURL: "/auth/google/callback",
        scope: ["profile", "email"]
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({
                    email: profile.emails[0].value
                })            
                console.log("inside the Oauth testing", user);
                if (!user) {
                    user = new User({
                        email: profile.emails[0].value,
                        fullName: profile.displayName,
                        avatar: profile.photos[0].value,
                    })
                    await user.save();
                    const connections = await Connection.create({
                        user: new mongoose.Types.ObjectId(user._id),
                        contacts: []
                    })
                }
                return done(null, user);
            } catch (error) {
                console.log("during finding user ",error);
                return done(error, null)
            }
        }
    )
)
passport.serializeUser((user, done) => {
    done(null, user);
})
passport.deserializeUser((user, done) => {
    done(null, user)
})

app.get('/auth/google', passport.authenticate("google", { scope: ["profile", "email"] }))
app.get('/auth/google/callback', passport.authenticate("google", {
    successRedirect: `${process.env.CLIENT_URI}/dashboard/google`,
    failureRedirect: `${process.env.CLIENT_URI}/login`
}))
app.get('/', (req, res) => {
    res.json({ "message": "It is live" })
});

import RoomRouter from "./routes/room.routes.js";
app.use("/api/v1/room", RoomRouter);
import messageRouter from "./routes/message.routes.js"
app.use("/api/v1/message", messageRouter);
import userRouter from "./routes/user.routes.js"
app.use("/api/v1/user", userRouter);
import connectionRouter from "./routes/connection.routes.js";
app.use("/api/v1/contact", connectionRouter)

export { app };