const bcrypt = require("bcrypt")
const express = require("express")
const dotenv = require("dotenv")
const multer = require("multer")
const jwt = require("jsonwebtoken")

// Connecting to server
dotenv.config();

const app = express();
app.use(express.json());

app.listen(process.env.PORT, () => {
    console.log("Server Connected")
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage })

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "No token provided" });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({ error: "Malformed token" });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error("JWT Error:", error.message);
        return res.status(401).json({ error: "Invalid token" });
    }
}


let user = {}

// home route
app.get("/", async (req, res) => {
    res.json({
        message: "Welcome to User Authentication API",
        endpoints: {
            signup: "POST /signup",
            login: "POST /login",
            upload: "POST /upload (requires token)",
            profile: "GET /profile (requires token)"
        }
    });
});


// signup 
app.post("/signup", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        user = {
            username: username,
            password: hashedPassword
        }

        console.log('User Registered: ', username);
        console.log('Hashed Password: ', hashedPassword);

        res.status(201).json({ message: "User Registered Successfully" })

    } catch (error) {
        res.status(500).json({ error: "Error registering user" });
    }
})


// login
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        if (!user.username) {
            return res.status(400).json({ error: "Please signup first" });
        }

        if (user.username !== username) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const token = jwt.sign(
            { userId: 1, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        console.log("User logged in:", user.username);
        console.log("Token generated:", token);
        res.json({
            message: "Login successful!",
            token: token
        });

    } catch (error) {
        res.status(500).json({ error: "Error logging in" });
    }
});


// get profile data
app.get("/profile", verifyToken, (req, res) => {
    res.json({
        message: "Welcome to your profile!",
        user: req.user
    });
});


// uploading photos
app.post("/upload", verifyToken, upload.single("photo"), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File uploaded:", req.file);

    res.json({
        message: "Profile photo uploaded successfully!",
        filename: req.file.filename,
        path: req.file.path
    });
});
