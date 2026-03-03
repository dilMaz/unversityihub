const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Middleware to parse JSON bodies
app.use("/",(req, res, next) => {
    res.send("Hello World!");
});

// Connect to MongoDB
mongoose.connect("mongodb+srv://admin:iPTXvEiynbCydYHa@cluster0.bhaclhu.mongodb.net/")
.then(() => console.log("Connected to MongoDB"))
.then(() => {
    app.listen(5000);
})
.catch((err) => console.log((err)));   