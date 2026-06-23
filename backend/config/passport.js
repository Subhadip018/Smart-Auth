const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`,
  
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let user = await User.findOne({ email });

    if (user) {
      // Link Google account to existing email user, or just update
      if (!user.googleId) user.googleId = profile.id;
      user.isVerified = true;
      if (!user.name) user.name = profile.displayName;
      await user.save();
    } else {
      // New Google user — create account
      user = await User.create({
        email,
        name: profile.displayName,
        googleId: profile.id,
        isVerified: true,
      });
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));
console.log(
  "Google Callback URL:",
  `${process.env.SERVER_URL}/api/auth/google/callback`
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
