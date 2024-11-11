//Details of our packages, for now there will be 4 records here
const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
    index: { type: Number },
    packageName: { type: String, required: true },
    price: { type: Number, required: true },
    Limit: { type: Number },
    duration: { type: Number },
    subscription:  { type: String},
},
    {
        timestamps: true,
    });

module.exports = mongoose.model('Package', PackageSchema);