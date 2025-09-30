const allowedOrigine = require("./allowedOringin");

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigine.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("cors are not allowed"));
    }
  },
  optionsSuccessStatus: 200,
  credentials: true,
};
module.exports = corsOptions;
