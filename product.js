const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true },
    harga: { type: Number, required: true },
    hargaDiskon: { type: Number, default: 0 },
    deskripsi: { type: String },
    detail: { type: String }, // deskripsi panjang untuk halaman detail
    kategori: {
      type: String,
      enum: ["Segiempat", "Pashmina", "Instan", "Bergo", "Lainnya"],
      default: "Lainnya",
    },
    warna: [String], // contoh: ["Hitam", "Putih", "Navy"]
    stok: { type: Number, default: 0 },
    terjual: { type: Number, default: 0 },
    foto: [String], // array URL foto
    unggulan: { type: Boolean, default: false }, // tampil di halaman utama
    aktif: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema);
