const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});


// ========================================
// EMAIL CREDENTIALS
// ========================================

const EMAIL_USER =
    process.env.EMAIL_USER;

const EMAIL_APP_PASSWORD =
    process.env.EMAIL_APP_PASSWORD;


// ========================================
// APPLICATION URL
// ========================================

const APP_URL =
    process.env.CLIENT_URL || "http://localhost:3000";


// ========================================
// MONGODB
// ========================================

const MONGO_URI =
    process.env.MONGODB_URI;


// ========================================
// EXPRESS APP
// ========================================

const app =
    express();


// ========================================
// MIDDLEWARE
// ========================================

app.use(
    cors()
);

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);


// ========================================
// PUBLIC FOLDER
// ========================================

const PUBLIC =
    path.join(
        __dirname,
        "..",
        "frontend"
    );

app.use(
    express.static(PUBLIC)
);


// ========================================
// MONGODB CONNECTION
// ========================================

async function db() {

    try {

        if (!MONGO_URI) {
            throw new Error("MONGODB_URI is missing from backend/.env");
        }

        if (
            mongoose.connection.readyState === 1
        ) {
            return;
        }

        console.log(
            "Connecting to MongoDB..."
        );

        await mongoose.connect(
            MONGO_URI,
            {
                serverSelectionTimeoutMS: 8000
            }
        );

        console.log(
            "MongoDB connected successfully!"
        );

    } catch (error) {

        console.error(
            "========== MONGODB ERROR =========="
        );

        console.error(
            error.message
        );

        console.error(
            "==================================="
        );

        throw error;
    }
}


// ========================================
// USER SCHEMA
// ========================================


const userSchema = new mongoose.Schema({

    fullName: {
        type: String,
        required: false,
        trim: true
    },

    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    email: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    // ====================================
    // PASSWORD RESET - VERIFICATION CODE
    // ====================================

    resetCodeHash: {
        type: String,
        default: null
    },

    resetCodeExpires: {
        type: Date,
        default: null
    },

    resetCodeAttempts: {
        type: Number,
        default: 0
    },

    // ====================================
    // PASSWORD RESET - RESET TOKEN
    // ====================================

    resetTokenHash: {
        type: String,
        default: null
    },

    resetTokenExpires: {
        type: Date,
        default: null
    }

});

    


// ========================================
// USER MODEL
// ========================================

const User =
    mongoose.models.User ||
    mongoose.model(
        "User",
        userSchema
    );


// ========================================
// NODEMAILER
// ========================================

const transporter =
    nodemailer.createTransport({

    service: process.env.EMAIL_SERVICE || "gmail",

        auth: {

            user:
                EMAIL_USER,

            pass:
                EMAIL_APP_PASSWORD

        }

    });


// ========================================
// RESET TOKEN GENERATOR
// ========================================

function generateResetToken() {

    return crypto
        .randomBytes(32)
        .toString("hex");

}


// ========================================
// HASH FUNCTION
// ========================================

function hashValue(value) {

    return crypto
        .createHash("sha256")
        .update(value)
        .digest("hex");

}


// ========================================
// REGISTER
// ========================================

async function register(
    req,
    res
) {

    try {

        await db();


        const {
            fullName,
            username,
            email,
            password
        } = req.body || {};


        // ====================================
        // REQUIRED FIELDS
        // ====================================

        if (
            !fullName ||
            !username ||
            !email ||
            !password
        ) {

            return res.status(400).json({
                message:
                    "Please fill in all fields."
            });

        }


        // ====================================
        // PASSWORD LENGTH
        // ====================================

        if (
            String(password).length < 6
        ) {

            return res.status(400).json({
                message:
                    "Password must be at least 6 characters."
            });

        }


        const cleanUsername =
            String(username)
                .trim();


        const cleanEmail =
            String(email)
                .trim()
                .toLowerCase();


        // ====================================
        // CHECK USERNAME
        // ====================================

        const existingUsername =
            await User.findOne({
                username:
                    cleanUsername
            });


        if (existingUsername) {

            return res.status(400).json({
                message:
                    "Username already exists."
            });

        }


        // ====================================
        // CHECK EMAIL
        // ====================================

        const existingEmail =
            await User.findOne({
                email:
                    cleanEmail
            });


        if (existingEmail) {

            return res.status(400).json({
                message:
                    "Email is already registered."
            });

        }


        // ====================================
        // HASH PASSWORD
        // ====================================

        const hashedPassword =
            await bcrypt.hash(
                String(password),
                10
            );


        // ====================================
        // CREATE USER
        // ====================================

        await User.create({

            fullName:
                String(fullName).trim(),

            username:
                cleanUsername,

            email:
                cleanEmail,

            password:
                hashedPassword

        });


        return res.json({
            message:
                "Registered successfully."
        });


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );

        return res.status(500).json({
            message:
                "Server error during registration."
        });

    }
}


// ========================================
// LOGIN
// ========================================

async function login(
    req,
    res
) {

    try {

        console.log(
            "LOGIN REQUEST RECEIVED"
        );


        await db();


        const {
            username,
            password
        } = req.body || {};


        if (
            !username ||
            !password
        ) {

            return res.status(400).json({
                message:
                    "Username and password are required."
            });

        }


        const cleanUsername =
            String(username).trim();


        const user =
            await User.findOne({
                username:
                    cleanUsername
            });


        console.log(
            "User found:",
            user ? "YES" : "NO"
        );


        if (!user) {

            return res.status(401).json({
                message:
                    "Invalid username or password."
            });

        }


        // ====================================
        // CHECK PASSWORD FIELD
        // ====================================

        if (
            !user.password ||
            typeof user.password !== "string"
        ) {

            console.error(
                "User has no valid password."
            );

            return res.status(500).json({
                message:
                    "This account has an invalid password record. Please register again."
            });

        }


        // ====================================
        // CHECK PASSWORD
        // ====================================

        const passwordCorrect =
            await bcrypt.compare(
                String(password),
                user.password
            );


        console.log(
            "Password correct:",
            passwordCorrect
        );


        if (!passwordCorrect) {

            return res.status(401).json({
                message:
                    "Invalid username or password."
            });

        }


        console.log(
            "LOGIN SUCCESS"
        );


        return res.json({
            message:
                "Login success"
        });


    } catch (error) {

        console.error(
            "========== LOGIN ERROR =========="
        );

        console.error(
            error
        );

        console.error(
            "================================="
        );


        return res.status(500).json({
            message:
                "Server error during login."
        });

    }
}


function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashValue(value) {
    return crypto
        .createHash("sha256")
        .update(value)
        .digest("hex");
}

async function forgotPassword(req, res) {
    try {
        await db();

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                ok: false,
                error: "Email is required."
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        // Don't reveal whether an account exists
        if (!user) {
            return res.json({
                ok: true,
                message: "If that email is registered, a verification code has been sent."
            });
        }

        const code = generateVerificationCode();

        user.resetCodeHash = hashValue(code);
        user.resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.resetCodeAttempts = 0;

        await user.save();

        await transporter.sendMail({
            from: EMAIL_USER,
            to: user.email,
            subject: "CinnamonRoll Password Reset Code",
            text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif;">
                    <h2>CinnamonRoll Password Reset</h2>

                    <p>Your verification code is:</p>

                    <h1 style="letter-spacing: 8px;">
                        ${code}
                    </h1>

                    <p>This code expires in 10 minutes.</p>

                    <p>If you did not request a password reset, you can ignore this email.</p>
                </div>
            `
        });

        console.log("Reset code sent to:", user.email);

        res.json({
            ok: true,
            message: "A verification code has been sent to your email."
        });

    } catch (error) {
        console.error("Forgot password error:", error);

        res.status(500).json({
            ok: false,
            error: "Failed to send verification code."
        });
    }
}

async function verifyResetCode(req, res) {
    try {
        await db();

        const { email, code } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                ok: false,
                error: "Email and verification code are required."
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(400).json({
                ok: false,
                error: "Invalid verification code."
            });
        }

        if (
            !user.resetCodeHash ||
            !user.resetCodeExpires ||
            user.resetCodeExpires < new Date()
        ) {
            return res.status(400).json({
                ok: false,
                error: "Verification code has expired."
            });
        }

        const codeHash = hashValue(code);

        if (codeHash !== user.resetCodeHash) {
            user.resetCodeAttempts = (user.resetCodeAttempts || 0) + 1;
            await user.save();

            return res.status(400).json({
                ok: false,
                error: "Invalid verification code."
            });
        }

        // Create a temporary reset token after successful verification
        const resetToken = crypto.randomBytes(32).toString("hex");

        user.resetTokenHash = hashValue(resetToken);
        user.resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

        user.resetCodeHash = undefined;
        user.resetCodeExpires = undefined;
        user.resetCodeAttempts = 0;

        await user.save();

        res.json({
            ok: true,
            message: "Code verified.",
            resetToken
        });

    } catch (error) {
        console.error("Verify code error:", error);

        res.status(500).json({
            ok: false,
            error: "Failed to verify code."
        });
    }
}


// ========================================
// RESET PASSWORD
// ========================================

async function resetPassword(req, res) {
    try {
        await db();

        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({
                ok: false,
                error: "Reset token and new password are required."
            });
        }

        const tokenHash = hashValue(resetToken);

        const user = await User.findOne({
            resetTokenHash: tokenHash,
            resetTokenExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({
                ok: false,
                error: "Reset session is invalid or expired."
            });
        }

        user.password = await bcrypt.hash(newPassword, 10);

        user.resetTokenHash = undefined;
        user.resetTokenExpires = undefined;

        await user.save();

        res.json({
            ok: true,
            message: "Password changed successfully."
        });

    } catch (error) {
        console.error("Reset password error:", error);

        res.status(500).json({
            ok: false,
            error: "Failed to reset password."
        });
    }
}

// ========================================
// ROUTES
// ========================================


// REGISTER

app.post("/register", register);
app.post("/api/register", register);

app.post("/login", login);
app.post("/api/login", login);

app.post("/forgot-password", forgotPassword);
app.post("/api/forgot-password", forgotPassword);

app.post("/verify-reset-code", verifyResetCode);
app.post("/api/verify-reset-code", verifyResetCode);

app.post("/reset-password", resetPassword);
app.post("/api/reset-password", resetPassword);


// ========================================
// HEALTH CHECK
// ========================================

app.get(
    "/api/health",
    async (req, res) => {

        try {

            await db();

            return res.json({
                ok: true
            });

        } catch (error) {

            console.error(
                "Health check error:",
                error
            );

            return res.status(500).json({
                ok: false,
                error:
                    error.message
            });

        }
    }
);


// ========================================
// HOME PAGE
// ========================================

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                PUBLIC,
                "home.html"
            )
        );

    }
);


// ========================================
// HTML PAGES
// ========================================

app.get(
    "/:page.html",
    (req, res) => {

        res.sendFile(

            path.join(
                PUBLIC,
                req.params.page +
                ".html"
            ),

            error => {

                if (error) {

                    res
                        .status(404)
                        .send(
                            "Page not found"
                        );

                }

            }

        );

    }
);


// ========================================
// EXPORT
// ========================================

module.exports =
    app;


// ========================================
// LOCAL SERVER
// ========================================

if (
    require.main === module
) {

    const PORT =
        process.env.PORT ||
        3000;


    db()
        .then(() => {

            app.listen(
                PORT,
                () => {

                    console.log(
                        "Running on http://localhost:" +
                        PORT
                    );

                }
            );

        })
        .catch(error => {

            console.error("");
            console.error(
                "================================"
            );
            console.error(
                "MONGODB CONNECTION FAILED"
            );
            console.error(
                "================================"
            );
            console.error(
                error.message
            );
            console.error("");

            process.exit(1);

        });

}