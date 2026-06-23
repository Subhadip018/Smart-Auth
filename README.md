# Smart Auth System — MERN Stack
OTP Email Auth + Google OAuth + Forgot Password | 100% Free

---

## Features
- ✅ Continue with Google (OAuth2)
- ✅ Email OTP login / auto-register (no password needed for new users)
- ✅ Forgot password flow: Email → OTP verify → Reset
- ✅ JWT session management
- ✅ Works in production, sends to ALL email addresses

---

## Setup Guide

### Step 1 — Google Cloud Console (5 min)

1. Go to https://console.cloud.google.com
2. Create a new project (or use existing)
3. Go to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add Authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
7. Copy your **Client ID** and **Client Secret**
8. Go to **APIs & Services → OAuth consent screen**
   - Add your email as a test user (until you publish the app)

### Step 2 — Get Gmail Refresh Token (for sending emails to everyone)

This is the key step that makes emails work in production for ALL recipients.

1. Go to https://developers.google.com/oauthplayground
2. Click the ⚙️ gear icon (top right) → check **"Use your own OAuth credentials"**
3. Enter your Client ID and Client Secret from Step 1
4. In the left panel, find **Gmail API v1** → select `https://mail.google.com/`
5. Click **Authorize APIs** → sign in with your Gmail account
6. Click **Exchange authorization code for tokens**
7. Copy the **Refresh Token** — paste it in `.env` as `GMAIL_REFRESH_TOKEN`

> ⚠️ Important: The refresh token is shown once. Copy it immediately.

### Step 3 — Enable Gmail API

1. In Google Cloud Console → **APIs & Services → Library**
2. Search for **Gmail API** → Enable it

### Step 4 — Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in all values in .env
npm install
npm run dev
```

### Step 5 — Frontend Setup

```bash
cd frontend
# Create .env file:
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm install
npm run dev
```

---

## .env Values Reference

| Variable | Where to get it |
|---|---|
| `MONGO_URI` | MongoDB Atlas (free tier) or local MongoDB |
| `SESSION_SECRET` | Any random 32+ char string |
| `JWT_SECRET` | Any random 32+ char string |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials |
| `GMAIL_USER` | Your Gmail address |
| `GMAIL_REFRESH_TOKEN` | OAuth2 Playground (Step 2 above) |

---

## Why not plain SMTP?

Gmail blocks plain SMTP (`smtp.gmail.com`) in production environments for security reasons. OAuth2 is Google's official way to send email from your app and:
- Works from Render, Railway, Vercel, Heroku, etc.
- Sends to ANY email address (not just your own like Resend free tier)
- Uses the same credentials as your Google Login button
- No monthly limits for a college project

## Resend Free Tier Limitation

Resend's free plan restricts sending to only verified domains/email addresses you own. To send to any user, you'd need a paid plan ($20/mo) or a verified domain. Gmail OAuth2 has no such restriction.

---

## Project Structure

```
auth-system/
├── backend/
│   ├── server.js           # Express app entry
│   ├── routes/auth.js      # All auth endpoints
│   ├── models/User.js      # User schema with OTP fields
│   ├── services/emailService.js  # Gmail OAuth2 sender
│   ├── config/passport.js  # Google OAuth strategy
│   └── .env.example
└── frontend/
    └── src/
        ├── pages/Login.jsx          # Email + Google login
        ├── pages/ForgotPassword.jsx # 3-step reset flow
        ├── pages/AuthCallback.jsx   # Google OAuth redirect handler
        ├── pages/Dashboard.jsx      # Protected page
        ├── components/OTPInput.jsx  # 6-box OTP input
        ├── context/AuthContext.jsx  # Global auth state
        ├── api/axios.js             # Axios with auth header
        └── index.css               # All styles
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/send-otp` | Send OTP (auto-detects login vs register) |
| POST | `/api/auth/verify-otp` | Verify OTP → returns JWT |
| POST | `/api/auth/forgot-password` | Send password reset OTP |
| POST | `/api/auth/verify-reset-otp` | Verify reset OTP → returns resetToken |
| POST | `/api/auth/reset-password` | Set new password using resetToken |
| GET  | `/api/auth/google` | Initiate Google OAuth |
| GET  | `/api/auth/google/callback` | Google OAuth callback |
| GET  | `/api/auth/me` | Get current user (requires JWT) |
