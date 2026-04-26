const mongoose = require("mongoose");

const testimonialSchema = new mongoose.Schema(
  {
    namaPelanggan: { type: String, required: true },
    foto: { type: String, default: "" },
    pesan: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    produk: { type: String, default: "" }, // produk yang dibeli
    tampil: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Testimonial", testimonialSchema);
