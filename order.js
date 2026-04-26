const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // Data Pembeli
    namaPembeli: { type: String, required: true },
    email: { type: String, required: true },
    telepon: { type: String, required: true },
    alamat: { type: String, required: true },
    kota: { type: String, required: true },
    provinsi: { type: String, required: true },
    kodePos: { type: String, required: true },

    // Isi Pesanan
    items: [
      {
        produkId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        namaProduk: String,
        harga: Number,
        warna: String,
        jumlah: Number,
        subtotal: Number,
      },
    ],

    // Pengiriman
    kurirPengiriman: { type: String }, // contoh: "JNE", "J&T", "SiCepat"
    ongkir: { type: Number, default: 0 },

    // Pembayaran
    metodePembayaran: {
      type: String,
      enum: ["Transfer BCA", "Transfer BRI", "Transfer BNI", "QRIS", "COD"],
      required: true,
    },
    buktiPembayaran: { type: String }, // URL foto bukti transfer

    // Total
    totalHarga: { type: Number, required: true },
    totalBayar: { type: Number, required: true }, // totalHarga + ongkir

    // Status
    status: {
      type: String,
      enum: [
        "Menunggu Pembayaran",
        "Pembayaran Dikonfirmasi",
        "Diproses",
        "Dikirim",
        "Selesai",
        "Dibatalkan",
      ],
      default: "Menunggu Pembayaran",
    },
    nomorResi: { type: String, default: "" },
    catatan: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", orderSchema);
