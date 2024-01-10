const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");

const token = "TOKEN_BOT_TELEGRAM";
const bot = new TelegramBot(token, { polling: true });

const userCredentials = {};

// Fungsi untuk menghapus pesan
async function deleteMessage(chatId, messageId) {
  try {
    await bot.deleteMessage(chatId, messageId);
  } catch (error) {
    console.error("Gagal menghapus pesan:", error.message);
  }
}

// Menambahkan perintah untuk memulai proses login
bot.onText(/\/login/, (msg) => {
  const chatId = msg.chat.id;

  // Kirim pesan untuk meminta username
  bot.sendMessage(chatId, "Silakan masukkan username Anda:");

  // Tangani username yang dimasukkan pengguna
  bot.once("text", async (msg) => {
    const username = msg.text;

    // Kirim pesan untuk meminta password
    const passwordMessage = await bot.sendMessage(
      chatId,
      "Silakan masukkan password Anda:"
    );

    // Tangani password yang dimasukkan pengguna
    bot.once("text", async (msg) => {
      const password = msg.text;

      // Simpan username dan password dalam userCredentials
      userCredentials[chatId] = { username, password };

      // Hapus pesan yang mengandung username dan password
      deleteMessage(chatId, msg.message_id);
      deleteMessage(chatId, passwordMessage.message_id);

      // Lakukan login menggunakan informasi yang dimasukkan pengguna
      await doLogin(chatId);
    });
  });
});

// Fungsi untuk menampilkan inline keyboard dengan tombol "Login" dan "SSO Apps"
function showMainMenu(chatId) {
  const keyboard = {
    reply_markup: {
      keyboard: [[{ text: "Login" }], [{ text: "SSO Apps" }]],
    },
  };

  bot.sendMessage(chatId, "Silakan pilih aksi:", keyboard);
}

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
    bot.sendMessage(
      chatId,
      `Login Elearning Berhasil!\n\nNama Pengguna:\n${userInfo}`
    );
  } catch (error) {
    // Tangani kesalahan jika login gagal atau ada masalah lain
    console.error(error);
    bot.sendMessage(
      chatId,
      "Login atau akses Elearning gagal. Silahkan cek kembali Username dan Password Anda!"
    );
  } finally {
    // Tutup browser Puppeteer
    await browser.close();
  }
}

// Menambahkan tombol menu pada perintah /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Tampilkan tombol "Login" dan "SSO Apps"
  showMainMenu(chatId);
});

// Tangani aksi dari tombol menu
bot.onText(/Login/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Silakan masukkan username Anda:");
});

bot.onText(/SSO Apps/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, "Daftar Aplikasi SSO:\n1. Aplikasi 1\n2. Aplikasi 2");
});

console.log("Bot sedang berjalan...");
