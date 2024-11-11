//user details
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String },
  name: { type: String },
  companyName: { type: String },
  phoneNumber: { type: String},
  countryCode: { type: String },
  portalID: { type: Number, require: true, unique: true },
  accountType: { type: String },
  timeZone: { type: String },
  companyCurrency: { type: String },
  uiDomain: { type: String },
  dataHostingLocation: { type: String },
  additionalCurrencies: {
    type: [ String ],
  },
  refreshToken: { type: String },
  accessToken: { type: String },
  expiresIn: { type: Number },
},
  {
    timestamps: true,
  });

module.exports = mongoose.model('User', UserSchema);