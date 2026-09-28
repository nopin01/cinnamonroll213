require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const env = require("./config/env");
const connectDatabase = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: env.CLIENT_URL }));
app.use(express.json({ limit: "32kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "..", "frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "frontend", "home.html"));
});

app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "API is running." });
});

app.use("/api/auth", authRoutes);
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found." });
});
app.use(errorHandler);

async function startServer() {
    try {
        await connectDatabase(env.MONGODB_URI);
        return app.listen(env.PORT, () => {
            console.log(`Server listening on http://localhost:${env.PORT}`);
        });
    } catch (error) {
        console.error("Unable to connect to MongoDB; server startup aborted:", error.message);
        process.exitCode = 1;
        return null;
    }
}

if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
