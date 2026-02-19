const path = require("path");
const express = require("express");
const provider = require("./scripts/data-provider.js");

const app = express();
const artists = provider.data;

// handle requests for static resources
app.use("/static", express.static(path.join(__dirname, "public")));

// set up route handling
const router = require("./scripts/artist-router.js");
router.handleAllArtists(artists, app);
router.handleNationalitySearch(artists, app); // Specific routes first
router.handleNameSearch(artists, app); // Specific routes first
router.handleSingleArtist(artists, app); // Generic :id route last

// Use express to listen to port
let port = 8080;
app.listen(port, () => {
  console.log("Server running at port= " + port);
});
