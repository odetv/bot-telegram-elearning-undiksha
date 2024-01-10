const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");

const token = "TOKEN_BOT_TELEGRAM";
const bot = new TelegramBot(token, { polling: true });

// Simpan informasi login pengguna
const userCredentials = {};

// Menambahkan perintah untuk memulai proses login
bot.onText(/\/login/, (msg) => {
  const chatId = msg.chat.id;

  // Kirim pesan untuk meminta username
  bot.sendMessage(chatId, "Silakan masukkan username Anda:");
  bot.once("text", (msg) => {
    const username = msg.text;

    // Simpan username dalam userCredentials
    userCredentials[chatId] = { username };

    // Kirim pesan untuk meminta password
    bot.sendMessage(chatId, "Silakan masukkan password Anda:");
    bot.once("text", async (msg) => {
      const password = msg.text;

      // Simpan password dalam userCredentials
      userCredentials[chatId].password = password;

      // Lakukan login menggunakan informasi yang dimasukkan pengguna
      await doLogin(chatId);
    });
  });
});

// Fungsi untuk melakukan login ke elearning
async function doLogin(chatId) {
  // Ambil username dan password dari userCredentials
  const { username, password } = userCredentials[chatId];

  // Konfigurasi Puppeteer
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Buka halaman login SSO
    await page.goto(
      "https://sso.undiksha.ac.id/cas/login?service=https%3A%2F%2Felearning.undiksha.ac.id%2Flogin%2Findex.php",
      { timeout: 60000 }
    );

    // Isi formulir login dengan username dan password
    await page.type("#username", username);
    await page.type("#password", password);
    await page.click(".gradient-45deg-green-teal.btn-large");

    // Tunggu hingga halaman elearning dimuat
    await page.waitForNavigation({ waitUntil: "domcontentloaded" });

    // Buka halaman elearning setelah login berhasil
    await page.goto("https://elearning.undiksha.ac.id/my");

    // Tunggu hingga elemen user-description muncul
    await page.waitForSelector(".user-description");

    // Ambil teks dari elemen user-description
    const userInfo = await page.$eval(".user-description strong", (element) =>
      element.textContent.trim()
    );

    // Kirim nama pengguna sebagai pesan ke bot Telegram
    bot.sendMessage(chatId, `Login berhasil!\n\nNama Pengguna:\n${userInfo}`);
  } catch (error) {
    // Tangani kesalahan jika login gagal atau ada masalah lain
    console.error(error);
    bot.sendMessage(chatId, "Login atau akses Elearning gagal.");
  } finally {
    // Tutup browser Puppeteer
    await browser.close();
  }
}

// Mulai bot
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    "Selamat datang! Untuk login ke elearning, silakan gunakan perintah /login."
  );
});
