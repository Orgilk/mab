const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const cors = require("cors");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all origins (you can customize this if needed)
app.use(cors());

// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mock user data (for simplicity, we would usually fetch this from a database)
const users = [
    {
        email: "orgio.a11@gmail.com",
        password: "password123" // In real applications, store hashed passwords (e.g., bcrypt)
    },
    {
        email: "oyukaau@gmail.com",
        password: "123" // In real applications, store hashed passwords (e.g., bcrypt)
    },
];

// Store the verification code and timestamp for each user temporarily
let verificationCodes = {};

// Setup nodemailer for email verification
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "orgio.a11@gmail.com",
        pass: "ulsb cicq tekt fnof" // You should use environment variables to store sensitive credentials!
    }
});

// Function to generate a random 6-digit number
function generateRandomCode() {
    return Math.floor(100000 + Math.random() * 900000); // Generates a number between 100000 and 999999
}

// POST route to handle login
app.post("/login", async (req, res) => {
    const { email, password, captcha } = req.body;

    // Google reCAPTCHA Secret Key
    const secretKey = '6Lf0nZUqAAAAAIgrVJeDc60U_OReqWJMDOZ6-RCJ'; // Replace with your reCAPTCHA secret key

    // Step 1: Validate the reCAPTCHA response with Google API
    try {
        const captchaVerification = await axios.post(
            `https://www.google.com/recaptcha/api/siteverify`, 
            null, 
            {
                params: {
                    secret: secretKey,
                    response: captcha
                }
            }
        );

        if (!captchaVerification.data.success) {
            return res.json({ success: false, message: "Please complete the CAPTCHA." });
        }

        // Step 2: Basic login validation (email and password)
        const user = users.find(user => user.email === email);
        if (!user) {
            return res.json({ success: false, message: "Email not found!" });
        }

        if (user.password !== password) {
            return res.json({ success: false, message: "Invalid password!" });
        }

        // Step 3: Generate and send the verification code
        const verificationCode = generateRandomCode();
        verificationCodes[email] = {
            code: verificationCode,
            timestamp: Date.now()
        };

        const mailOptions = {
            from: "orgio.a11@gmail.com",
            to: email,
            subject: "Login verification",
            text: `Verification кодыг оруулна уу: ${verificationCode}`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.json({ success: false, message: "Error sending verification email." });
            }
            console.log("Email sent: " + info.response);
            res.json({ success: true, message: "Login successful! A verification email has been sent." });
        });

    } catch (error) {
        console.log("Error during CAPTCHA validation:", error);
        return res.json({ success: false, message: "Error verifying CAPTCHA. Please try again." });
    }
});

// POST route to verify the code
app.post("/verify-code", (req, res) => {
    const { email, code } = req.body;

    if (!verificationCodes[email]) {
        return res.json({ success: false, message: "No verification code found for this email." });
    }

    const storedCode = verificationCodes[email].code;
    const timestamp = verificationCodes[email].timestamp;

    if (storedCode !== parseInt(code)) {
        return res.json({ success: false, message: "Invalid verification code." });
    }

    const expirationTime = 1 * 30 * 1000; // 1 minute in milliseconds
    if (Date.now() - timestamp > expirationTime) {
        return res.json({ success: false, message: "Verification code has expired." });
    }

    delete verificationCodes[email];
    res.json({ success: true, message: "Verification successful! You are now logged in." });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
