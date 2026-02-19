/* Module for handling specific requests/routes for artist data  */
const provider = require("./data-provider.js");
const artists = provider.data;

// error messages need to be returned in JSON format
const jsonMessage = (msg) => {
  return { message: msg };
};

// return all artists when a root request arrives
const handleAllArtists = (artists, app) => {
  app.get("/api/artists", (req, resp) => {
    resp.json(artists);
  });
};

// return just the requested artist by ID
const handleSingleArtist = (artists, app) => {
  app.get("/api/artists/:id", (req, resp) => {
    const artistId = parseInt(req.params.id);
    // search the array of objects for a match
    const matches = artists.filter((a) => artistId == a.ArtistID);
    // return the matching artist
    if (matches.length > 0) {
      resp.json(matches);
    } else {
      resp.json(jsonMessage(`Artist with ID ${artistId} not found`));
    }
  });
};

// return all artists with the specified nationality
const handleNationalitySearch = (artists, app) => {
  app.get("/api/artists/nationality/:value", (req, resp) => {
    // change user supplied nationality to lower case for comparison
    const nationality = req.params.value.toLowerCase();
    // search the array of objects for a match
    const matches = artists.filter(
      (a) => a.Nationality && a.Nationality.toLowerCase().includes(nationality),
    );
    // return the matching artists
    if (matches.length > 0) {
      resp.json(matches);
    } else {
      resp.json(
        jsonMessage(`No artists found with nationality ${req.params.value}`),
      );
    }
  });
};

// return all artists whose LastName starts with the specified value
const handleNameSearch = (artists, app) => {
  app.get("/api/artists/name/:value", (req, resp) => {
    // change user supplied name to lower case for comparison
    const lastName = req.params.value.toLowerCase();
    // search the array of objects for artists whose LastName starts with the value
    const matches = artists.filter(
      (a) => a.LastName && a.LastName.toLowerCase().startsWith(lastName),
    );
    // return the matching artists
    if (matches.length > 0) {
      resp.json(matches);
    } else {
      resp.json(
        jsonMessage(
          `No artists found with LastName starting with ${req.params.value}`,
        ),
      );
    }
  });
};

module.exports = {
  handleAllArtists,
  handleNationalitySearch,
  handleNameSearch,
  handleSingleArtist,
};
