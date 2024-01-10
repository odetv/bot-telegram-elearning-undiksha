const TelegramBot = require("node-telegram-bot-api");
const puppeteer = require("puppeteer");

const token = "TOKEN_BOT_TELEGRAM";
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/login/, async (msg) => {
  const chatId = msg.chat.id;

  // Konfigurasi Puppeteer
  const browser = await puppeteer.launch({ headless: true }); // Headless true agar tidak tampil peramban
  const page = await browser.newPage();

  try {
    // Buka halaman login SSO
    await page.goto(
      "https://sso.undiksha.ac.id/cas/login?service=https%3A%2F%2Felearning.undiksha.ac.id%2Flogin%2Findex.php"
    );

    // Isi formulir login (ganti selector dan data sesuai dengan halaman Anda)
    await page.type("#username", "USERNAME");
    await page.type("#password", "PASSWORD");

    // Mengklik tombol "Login" berdasarkan kelas CSS
    await page.click(".gradient-45deg-green-teal.btn-large");

    // Tunggu hingga berhasil login di SSO
    await page.waitForNavigation();

    // Buka halaman elearning setelah login SSO berhasil
    await page.goto("https://elearning.undiksha.ac.id/my");

    // Tunggu hingga elemen user-description muncul
    await page.waitForSelector(".user-description");

    // Ambil teks dari elemen user-description
    const userInfo = await page.$eval(".user-description strong", (element) =>
      element.textContent.trim()
    );

    // Kirim nama pengguna sebagai pesan ke bot Telegram
    bot.sendMessage(chatId, `Informasi Login:\n${userInfo}`);
  } catch (error) {
    // Tangani kesalahan jika login gagal atau ada masalah lain
    console.error(error);
    bot.sendMessage(chatId, "Login atau akses Elearning gagal.");
  } finally {
    // Tutup browser Puppeteer
    await browser.close();
  }
});

// Cek apakah login berhasil dengan memeriksa halaman setelah login
// if (page.url() === "https://elearning.undiksha.ac.id/my/") {
//   const profileInfo = await page.evaluate(() => {
//     const fullName = document
//       .querySelector(".myprofileitem.fullname")
//       .innerText.trim();
//     const country = document
//       .querySelector(".myprofileitem.country")
//       .textContent.trim()
//       .replace("Negara:", "")
//       .trim();
//     const city = document
//       .querySelector(".myprofileitem.city")
//       .textContent.trim()
//       .replace("Kota:", "")
//       .trim();
//     const email = document
//       .querySelector(".myprofileitem.city a")
//       .textContent.trim();
//     const institution = document
//       .querySelector(".myprofileitem.institution")
//       .textContent.trim()
//       .replace("Institusi:", "")
//       .trim();
//     const idNumber = document
//       .querySelector(".myprofileitem.idnumber")
//       .textContent.trim()
//       .replace("Nomor ID:", "")
//       .trim();
//     const firstAccess = document
//       .querySelector(".myprofileitem.firstaccess")
//       .textContent.trim()
//       .replace("Akses pertama:", "")
//       .trim();
//     const lastAccess = document
//       .querySelector(".myprofileitem.lastaccess")
//       .textContent.trim()
//       .replace("Terakhir akses:", "")
//       .trim();
//     const currentLogin = document
//       .querySelector(".myprofileitem.currentlogin")
//       .textContent.trim()
//       .replace("Masuk:", "")
//       .trim();
//     const lastLogin = document
//       .querySelector(".myprofileitem.lastlogin")
//       .textContent.trim()
//       .replace("Log masuk terakhir:", "")
//       .trim();
//     const lastIP = document
//       .querySelector(".myprofileitem.lastip")
//       .textContent.trim()
//       .replace("IP:", "")
//       .trim();

//     return {
//       fullName,
//       country,
//       city,
//       email,
//       institution,
//       idNumber,
//       firstAccess,
//       lastAccess,
//       currentLogin,
//       lastLogin,
//       lastIP,
//     };
//   });

//       // Kirim informasi sebagai pesan ke bot Telegram
//       bot.sendMessage(
//         chatId,
//         `Informasi Profil:\n\n${JSON.stringify(profileInfo, null, 2)}`
//       );
//     } else {
//       bot.sendMessage(
//         chatId,
//         "Login gagal. Cek kembali username dan password Anda."
//       );
//     }
//   } catch (error) {
//     console.error(error);
//     bot.sendMessage(chatId, "Terjadi kesalahan saat login.");
//   } finally {
//     await browser.close();
//   }
// });
