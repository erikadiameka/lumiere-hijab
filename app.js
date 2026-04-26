const mongoose = require("mongoose");
const Product = require("./Product"); // Ambil model yang kita buat tadi

// Link sakti kamu yang tadi sudah berhasil konek
const uri =
  "mongodb+srv://teskonek:aman123@cluster0.ozr8ow3.mongodb.net/lumiere_db?retryWrites=true&w=majority";

async function main() {
  try {
    console.log("Menyambung ke database...");
    await mongoose.connect(uri);
    console.log("Koneksi sukses! Mencoba memasukkan produk...");

    // Contoh input produk hijab pertama
    const produkBaru = new Product({
      nama: "Pashmina Silk Premium",
      harga: 85000,
      stok: 25,
      kategori: "Pashmina",
      deskripsi: "Bahan adem, mengkilap mewah, cocok untuk pesta.",
    });

    const hasil = await produkBaru.save();
    console.log("-----------------------------------------");
    console.log("PRODUK BERHASIL DISIMPAN!");
    console.log("Nama Produk:", hasil.nama);
    console.log("-----------------------------------------");
  } catch (err) {
    console.error("Waduh error lagi:", err.message);
  } finally {
    mongoose.connection.close();
  }
}

main();
