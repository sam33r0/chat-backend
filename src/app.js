import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import { Strategy as OAuth2Strategy } from "passport-google-oauth2";
import { User } from "./models/user.model.js";
const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
}));
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
app.use(express.json({ limit: "32kb" }))
app.use(express.urlencoded({ extended: true, limit: "32kb" }))
app.use(express.static("public"))
app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
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
            console.log(profile);
            try {
                let user = await User.findOne({
                    email: profile.emails[0].value
                })
                if (!user) {
                    user= new User({
                        email: profile.emails[0].value,
                        fullName: profile.fullName,
                        avatar: profile.photos[0].value,
                    })
                    await user.save();
                }
                return done(null,user);
            } catch (error) {
                return done(error, null)
            }
        }
    )
)
passport.serializeUser((user,done)=>{
    done(null,user);
})
passport.deserializeUser((user,done)=>{
    done(null,user)
})

app.get('/auth/google',passport.authenticate("google",{scope:["profile", "email"]}))
app.get('/auth/google/callback',passport.authenticate("google",{
    successRedirect: "http://localhost:5173/dashboard",
    failureRedirect:"http://localhost:5173/login"
}))
app.get('/', (req, res) => {
    res.json({ "message": "It is live" })
});
export { app };