//payment information of an user
const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectId;


const PaymentSchema = new mongoose.Schema({
  user: {
    type: ObjectId,
    ref: 'User',
  },//user_.id
  email: { type: String },
  chargeId: { type: String},
  amount: { type: Number},
  totalAmount :  { type: Number},
  currency: { type: String},
  customer_id: { type: String},
  invoice_id: { type: String},
  payment_method_details: { type: Object },
  receipt_url: { type: String},
  status: { type: String, required: true },
  portalID: { type: Number, required: true, unique: true },
  previous_payment_details: { type: [mongoose.Schema.Types.Mixed], default: [] }, // Array of mixed objects
},
  {
    timestamps: true,
  });

module.exports = mongoose.model('Payment', PaymentSchema);