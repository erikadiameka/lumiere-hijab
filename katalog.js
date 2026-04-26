const mongoose = require("mongoose");
const Product = require("./Product");

const uri =
  "mongodb+srv://teskonek:aman123@cluster0.ozr8ow3.mongodb.net/lumiere_db?retryWrites=true&w=majority";

async function lihatKatalog() {
  try {
    await mongoose.connect(uri);

    // Perintah find() ini ibarat "SELECT * FROM products" di MySQL
    const daftarProduk = await Product.find();

    console.log("=== DAFTAR HIJAB LUMIÈRE ===");
    daftarProduk.forEach((p, index) => {
      console.log(
        `${index + 1}. ${p.nama} | Harga: Rp${p.harga} | Stok: ${p.stok}`,
      );
    });
    console.log("============================");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

lihatKatalog();
