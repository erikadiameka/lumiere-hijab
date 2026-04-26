require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");
const Product = require("./Product");
const Order = require("./order");
const Testimonial = require("./Testimonial");
const app = express();

const uri = process.env.MONGODB_URI;

// 1. SETTING UTAMA
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("publik"));

app.use(
  session({
    secret: "lumiere_secret_key",
    resave: false,
    saveUninitialized: true,
  }),
);

// 2. KONEKSI DATABASE
mongoose
  .connect(uri)
  .then(() => console.log("Database Konek, Boss!"))
  .catch((err) => console.error("Database Gagal Konek:", err));

// 3. MIDDLEWARE
const isAdmin = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/login");
  }
};

// =====================
// ROUTES PUBLIK
// =====================

// Halaman Utama
app.get("/", async (req, res) => {
  try {
    const produkUnggulan = await Product.find({
      unggulan: true,
      aktif: true,
    }).limit(8);
    const testimoni = await Testimonial.find({ tampil: true }).limit(6);
    res.render("publik/beranda", { produkUnggulan, testimoni });
  } catch (err) {
    res.render("publik/beranda", { produkUnggulan: [], testimoni: [] });
  }
});

// Halaman Katalog
app.get("/katalog", async (req, res) => {
  try {
    const { cari, kategori } = req.query;
    let filter = { aktif: true };
    if (cari) filter.nama = { $regex: cari, $options: "i" };
    if (kategori) filter.kategori = kategori;
    const produk = await Product.find(filter);
    res.render("publik/katalog", {
      produk,
      cari: cari || "",
      kategori: kategori || "",
    });
  } catch (err) {
    res.render("publik/katalog", { produk: [], cari: "", kategori: "" });
  }
});

// Halaman Detail Produk
app.get("/produk/:id", async (req, res) => {
  try {
    const produk = await Product.findById(req.params.id);
    const produkLain = await Product.find({
      aktif: true,
      _id: { $ne: produk._id },
    }).limit(4);
    res.render("publik/detail", { produk, produkLain });
  } catch (err) {
    res.redirect("/katalog");
  }
});

// Halaman Keranjang
app.get("/keranjang", (req, res) => {
  const keranjang = req.session.keranjang || [];
  const total = keranjang.reduce((acc, item) => acc + item.subtotal, 0);
  res.render("publik/keranjang", { keranjang, total });
});

// Tambah ke Keranjang
app.post("/keranjang/tambah", async (req, res) => {
  try {
    const { produkId, warna, jumlah } = req.body;
    const produk = await Product.findById(produkId);
    if (!req.session.keranjang) req.session.keranjang = [];

    const harga = produk.hargaDiskon > 0 ? produk.hargaDiskon : produk.harga;
    const qty = parseInt(jumlah) || 1;

    const indexAda = req.session.keranjang.findIndex(
      (i) => i.produkId === produkId && i.warna === warna,
    );

    if (indexAda > -1) {
      req.session.keranjang[indexAda].jumlah += qty;
      req.session.keranjang[indexAda].subtotal =
        req.session.keranjang[indexAda].jumlah * harga;
    } else {
      req.session.keranjang.push({
        produkId,
        namaProduk: produk.nama,
        foto: produk.foto[0] || "",
        harga,
        warna,
        jumlah: qty,
        subtotal: qty * harga,
      });
    }
    res.redirect("/keranjang");
  } catch (err) {
    res.redirect("/katalog");
  }
});

// Hapus dari Keranjang
app.post("/keranjang/hapus", (req, res) => {
  const { index } = req.body;
  if (req.session.keranjang) {
    req.session.keranjang.splice(parseInt(index), 1);
  }
  res.redirect("/keranjang");
});

// Halaman Checkout
app.get("/checkout", (req, res) => {
  const keranjang = req.session.keranjang || [];
  if (keranjang.length === 0) return res.redirect("/keranjang");
  const total = keranjang.reduce((acc, item) => acc + item.subtotal, 0);
  res.render("publik/checkout", { keranjang, total });
});

// Proses Checkout
app.post("/checkout", async (req, res) => {
  try {
    const keranjang = req.session.keranjang || [];
    if (keranjang.length === 0) return res.redirect("/keranjang");

    const total = keranjang.reduce((acc, item) => acc + item.subtotal, 0);
    const ongkir = parseInt(req.body.ongkir) || 0;

    const orderBaru = new Order({
      namaPembeli: req.body.namaPembeli,
      email: req.body.email,
      telepon: req.body.telepon,
      alamat: req.body.alamat,
      kota: req.body.kota,
      provinsi: req.body.provinsi,
      kodePos: req.body.kodePos,
      items: keranjang,
      kurirPengiriman: req.body.kurirPengiriman,
      ongkir,
      metodePembayaran: req.body.metodePembayaran,
      totalHarga: total,
      totalBayar: total + ongkir,
      catatan: req.body.catatan || "",
    });

    await orderBaru.save();

    // Update stok & terjual
    for (const item of keranjang) {
      await Product.findByIdAndUpdate(item.produkId, {
        $inc: { stok: -item.jumlah, terjual: item.jumlah },
      });
    }

    req.session.keranjang = [];
    res.render("publik/sukses", { order: orderBaru });
  } catch (err) {
    console.error(err);
    res.redirect("/checkout");
  }
});

// Halaman Tentang
app.get("/tentang", (req, res) => {
  res.render("publik/tentang");
});

// Halaman Kontak
app.get("/kontak", (req, res) => {
  res.render("publik/kontak");
});

// =====================
// ROUTES LOGIN
// =====================

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const validUsername = username === process.env.ADMIN_USERNAME;
  const validPassword = password === process.env.ADMIN_PASSWORD;

  if (validUsername && validPassword) {
    req.session.admin = true;
    res.redirect("/admin");
  } else {
    res.render("login", { error: "Username atau password salah!" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// =====================
// ROUTES ADMIN
// =====================

// Dashboard Admin
app.get("/admin", isAdmin, async (req, res) => {
  try {
    const totalProduk = await Product.countDocuments();
    const totalPesanan = await Order.countDocuments();
    const pesananBaru = await Order.countDocuments({
      status: "Menunggu Pembayaran",
    });
    const pesananTerbaru = await Order.find().sort({ createdAt: -1 }).limit(5);
    res.render("admin/dashboard", {
      totalProduk,
      totalPesanan,
      pesananBaru,
      pesananTerbaru,
    });
  } catch (err) {
    res.render("admin/dashboard", {
      totalProduk: 0,
      totalPesanan: 0,
      pesananBaru: 0,
      pesananTerbaru: [],
    });
  }
});

// Kelola Produk
app.get("/admin/produk", isAdmin, async (req, res) => {
  const produk = await Product.find().sort({ createdAt: -1 });
  res.render("admin/produk", { produk });
});

app.get("/admin/produk/tambah", isAdmin, (req, res) => {
  res.render("admin/produk-form", { produk: null });
});

app.post("/admin/produk/tambah", isAdmin, async (req, res) => {
  try {
    const data = req.body;
    data.foto = data.foto ? data.foto.split(",").map((f) => f.trim()) : [];
    data.warna = data.warna ? data.warna.split(",").map((w) => w.trim()) : [];
    data.unggulan = data.unggulan === "on";
    data.aktif = data.aktif === "on";
    await new Product(data).save();
    res.redirect("/admin/produk");
  } catch (err) {
    res.send("Gagal tambah produk: " + err.message);
  }
});

app.get("/admin/produk/edit/:id", isAdmin, async (req, res) => {
  const produk = await Product.findById(req.params.id);
  res.render("admin/produk-form", { produk });
});

app.post("/admin/produk/edit/:id", isAdmin, async (req, res) => {
  try {
    const data = req.body;
    data.foto = data.foto ? data.foto.split(",").map((f) => f.trim()) : [];
    data.warna = data.warna ? data.warna.split(",").map((w) => w.trim()) : [];
    data.unggulan = data.unggulan === "on";
    data.aktif = data.aktif === "on";
    await Product.findByIdAndUpdate(req.params.id, data);
    res.redirect("/admin/produk");
  } catch (err) {
    res.send("Gagal edit produk: " + err.message);
  }
});

app.post("/admin/produk/hapus/:id", isAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect("/admin/produk");
});

// Kelola Pesanan
app.get("/admin/pesanan", isAdmin, async (req, res) => {
  const pesanan = await Order.find().sort({ createdAt: -1 });
  res.render("admin/pesanan", { pesanan });
});

app.get("/admin/pesanan/:id", isAdmin, async (req, res) => {
  const pesanan = await Order.findById(req.params.id);
  res.render("admin/pesanan-detail", { pesanan });
});

app.post("/admin/pesanan/update/:id", isAdmin, async (req, res) => {
  await Order.findByIdAndUpdate(req.params.id, {
    status: req.body.status,
    nomorResi: req.body.nomorResi || "",
  });
  res.redirect("/admin/pesanan/" + req.params.id);
});

// Kelola Testimoni
app.get("/admin/testimoni", isAdmin, async (req, res) => {
  const testimoni = await Testimonial.find().sort({ createdAt: -1 });
  res.render("admin/testimoni", { testimoni });
});

app.post("/admin/testimoni/tambah", isAdmin, async (req, res) => {
  await new Testimonial(req.body).save();
  res.redirect("/admin/testimoni");
});

app.post("/admin/testimoni/hapus/:id", isAdmin, async (req, res) => {
  await Testimonial.findByIdAndDelete(req.params.id);
  res.redirect("/admin/testimoni");
});

// 5. JALANKAN SERVER
app.listen(3000, () => {
  console.log("Website standby di http://localhost:3000");
});
