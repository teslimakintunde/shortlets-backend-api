// routes/googleApi.js
const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

// Test route to check if proxy is working
router.get("/test", (req, res) => {
  res.json({ message: "Google API proxy is working!" });
});

// Google Maps API proxy endpoint
router.get("/places/autocomplete", async (req, res) => {
  try {
    const { input, types, components } = req.query;
    const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    if (!API_KEY) {
      return res
        .status(500)
        .json({ error: "Google Maps API key not configured" });
    }

    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&key=${API_KEY}`;

    if (types) url += `&types=${types}`;
    if (components) url += `&components=${components}`;

    console.log("Fetching from Google API:", url);

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Google API proxy error:", error);
    res.status(500).json({ error: "Failed to fetch autocomplete data" });
  }
});

// Geocoding proxy endpoint
router.get("/geocode", async (req, res) => {
  try {
    const { address, latlng } = req.query;
    const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

    if (!API_KEY) {
      return res
        .status(500)
        .json({ error: "Google Maps API key not configured" });
    }

    let url = `https://maps.googleapis.com/maps/api/geocode/json?key=${API_KEY}`;

    if (address) {
      url += `&address=${encodeURIComponent(address)}`;
    } else if (latlng) {
      url += `&latlng=${latlng}`;
    }

    if (req.query.components) {
      url += `&components=${req.query.components}`;
    }

    console.log("Fetching geocode from:", url);

    const response = await fetch(url);
    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Geocoding proxy error:", error);
    res.status(500).json({ error: "Failed to fetch geocoding data" });
  }
});

module.exports = router;
