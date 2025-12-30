# Mahali POS - محلي

**Live App:** https://pos-app-five-blond.vercel.app

A modern Point of Sale system for Moroccan grocery stores.

---

# Testing Guide

## 📱 How to Test on Your Phone

### Method 1: Using Node.js (Recommended)

1. **Start the server:**
   ```bash
   cd pos-app
   node server.js
   ```

2. **You'll see output like:**
   ```
   🚀 Server is running!

   📱 Test on your phone:
      http://192.168.1.100:8080

   💻 Test on this computer:
      http://localhost:8080
   ```

3. **On your phone:**
   - Make sure your phone is on the **same WiFi** as your computer
   - Open the browser (Chrome or Safari)
   - Type the IP address shown (e.g., `http://192.168.1.100:8080`)
   - The app will load!

4. **To stop the server:**
   - Press `Ctrl+C` in the terminal

---

### Method 2: Using Python (If you have Python)

1. **Start the server:**
   ```bash
   cd pos-app
   python3 -m http.server 8080
   ```

2. **Find your computer's IP address:**
   - **Mac:** System Preferences → Network → Your WiFi → IP Address
   - **Or run:** `ipconfig getifaddr en0`

3. **On your phone:**
   - Open browser and go to: `http://YOUR_IP:8080`
   - Example: `http://192.168.1.100:8080`

---

### Method 3: Using npx (No installation needed)

1. **Start the server:**
   ```bash
   cd pos-app
   npx http-server -p 8080
   ```

2. **Follow the same steps as Method 1**

---

## 🧪 Testing Checklist

When testing on your phone, verify:

- [ ] The app displays in RTL (right-to-left)
- [ ] Arabic text renders correctly
- [ ] Greeting shows correct time-based message
- [ ] All buttons are easy to tap (48px minimum)
- [ ] The big green "بيع" button is prominent
- [ ] Summary card shows sales and profit
- [ ] Design looks good on small screen
- [ ] Page loads quickly
- [ ] No scrolling issues

---

## 🔧 Troubleshooting

**Can't connect from phone?**
- Make sure both devices are on the same WiFi
- Check if your firewall is blocking port 8080
- Try disabling VPN on either device
- Try using your computer's IP address instead of localhost

**Greeting not changing?**
- Wait up to 1 minute (it updates every minute)
- Or change your system time to test different greetings

**Arabic text looks weird?**
- Make sure you're using a modern browser (Chrome, Safari, Firefox)
- Update your phone's OS if it's very old

---

## 🚀 Next Steps

Once tested, you're ready for:
- **Day 2:** Add product management
- **Day 3:** Barcode scanning
- **Day 4:** Quick sale flow

Keep the server running while developing for live updates!
