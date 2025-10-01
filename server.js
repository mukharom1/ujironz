const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const wdio = require('webdriverio');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Fungsi generate username random
function generateUsername() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let username = '';
  for(let i=0; i<10; i++) {
    username += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return username;
}

// Fungsi generate domain random 5 karakter
function generateRandomDomain() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let domain = '';
  for(let i=0; i<5; i++) {
    domain += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return domain + '.com';
}

// Fungsi automasi Appium untuk buat 1 akun CapCut
async function createCapcutAccount(email, password) {
  const opts = {
    path: '/wd/hub',
    port: 4723,
    capabilities: {
      platformName: "Android",
      platformVersion: "11", // sesuaikan versi emulator Anda
      deviceName: "emulator-5554", // cek dengan adb devices
      appPackage: "com.lemon.lvoverseas", // package CapCut (update jika berubah)
      appActivity: ".MainActivity",
      automationName: "UiAutomator2",
      noReset: true,
      newCommandTimeout: 300,
    }
  };

  const client = await wdio.remote(opts);

  try {
    await client.pause(5000);

    // Contoh klik tombol "Daftar" (ubah selector sesuai UI CapCut)
    const daftarBtn = await client.$('android=new UiSelector().textContains("Daftar")');
    if (await daftarBtn.isDisplayed()) {
      await daftarBtn.click();
      await client.pause(2000);
    }

    // Isi email
    const emailInput = await client.$('android=new UiSelector().resourceId("com.lemon.lvoverseas:id/email_input")');
    await emailInput.setValue(email);
    await client.pause(1000);

    // Isi password
    const passwordInput = await client.$('android=new UiSelector().resourceId("com.lemon.lvoverseas:id/password_input")');
    await passwordInput.setValue(password);
    await client.pause(1000);

    // Submit form pendaftaran
    const submitBtn = await client.$('android=new UiSelector().textContains("Daftar")');
    await submitBtn.click();

    await client.pause(10000); // tunggu proses selesai

    // TODO: Tangani captcha/verifikasi manual

    console.log(`Akun dibuat: ${email} / ${password}`);

  } catch (err) {
    console.error("Error automasi:", err);
  } finally {
    await client.deleteSession();
  }
}

app.post('/api/create-accounts', async (req, res) => {
  const { password, countryCode, totalAccount } = req.body;

  if (!password || !countryCode || !totalAccount) {
    return res.status(400).json({ error: 'Missing parameters' });
  }
  if (typeof totalAccount !== 'number' || totalAccount < 1 || totalAccount > 10) {
    return res.status(400).json({ error: 'totalAccount must be number between 1 and 10' });
  }
  if (!/^[A-Za-z]{2}$/.test(countryCode)) {
    return res.status(400).json({ error: 'countryCode must be 2 letters' });
  }

  const accounts = [];

  for(let i=0; i<totalAccount; i++) {
    const username = generateUsername();
    const domain = generateRandomDomain();
    const email = `${username}@${domain}`;

    try {
      await createCapcutAccount(email, password);
      accounts.push({ email, password });
    } catch(e) {
      console.error('Gagal buat akun:', email, e);
    }
  }

  res.json({ accounts });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://loclhost:${PORT}`);
});
