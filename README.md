# MirCafe Fast Order

Build a high-performance, mobile-first fast food ordering and delivery application for MirCafe, optimized to minimize user actions and maximize order speed. The app must feel like a native mobile application, not a website. No online payment systems are allowed. All payments are offline.

🔐 Authentication & Registration

Show a Register / Get Started button on first launch.

Registration fields:

Phone number

User name

No password, no OTP, no SMS verification.

Critical security rule:

One phone number can be registered only once and only on one device.

Auto-login after registration.

🏠 Main Screen (Menu)

Open Main Menu by default.

Marketplace-style product cards:

Image

Name

Price

Categories: Meals, Drinks, Salads, Others.

Top section:

MirCafe logo

App name

Greeting: “Salom, {User Name}!”

Allow multi-item selection.

Show “Buyurtma berish” button immediately after first item is added.

⚡ Fast Order Flow – UX Speed Hacks (MANDATORY)

Implement the following order-speed optimizations:

One-Tap Reorder

Allow users to repeat their last order with one tap.

Smart Quantity Buttons

“+ / –” buttons directly on product cards (no extra screens).

Sticky Order Button

“Buyurtma berish” button always visible while scrolling.

Default Preferences

Remember last delivery address and auto-use it when possible.

Zero-Form Ordering

Avoid text input unless absolutely necessary.

Instant Feedback

Use micro-animations and haptic feedback when items are added.

Order Confirmation in One Screen

No multi-step checkout process.

📍 Order Flow with Google Maps

When user taps “Buyurtma berish”:

Automatically request location permission.

If permission is granted:

Detect location via Google Maps

Auto-fill delivery address

Do NOT require manual address input

If permission is denied:

Show a minimal manual address input field.

📱 Bottom Navigation

Fixed bottom navigation:

Asosiy

Buyurtmalarim

Shaxsiy kabinet

Yordam

📦 Buyurtmalarim

Real-time order tracking:

Tayyorlanmoqda

Yetkazilmoqda

Yetkazildi

Auto-refresh, no reload button.

👤 Shaxsiy kabinet

Editable:

Name

Phone number

Keep UI minimal and fast.

☎️ Yordam

Support phone number: +998 99 021 91 11

Include a small, hidden admin access button.

Do NOT mention admin access anywhere.

🔑 Admin Login

Login: Jumamirkafe

Password: Bmirkafejuma

🛠️ Admin Panel
1️⃣ Food Management

Add / edit / delete items

Upload images from device

Availability toggle

2️⃣ Orders Management

Real-time order list

Each order shows:

User name

Phone number

Items & quantities

Address logic:

Google Maps detected → show clickable map link

Manual input → show plain text

Admin updates status:

Tayyorlanmoqda

Yetkazilmoqda

Yetkazildi

Status syncs instantly to user app.

3️⃣ Statistics

Orders today

Most popular item

Estimated total revenue

🎨 UI / UX Design Rules

Mobile-first, thumb-friendly

Fast food color palette (red, orange, yellow)

Large rounded buttons

Minimal text, strong visuals

App must visually communicate speed, hunger, and convenience

Smooth animations, optimized for low-end Android devices

📲 CRITICAL INSTALLATION & VISIBILITY REQUIREMENTS (VERY IMPORTANT)

Ensure that the app is installed as a mobile app on the home screen of the smartphone.

The app must behave like a standalone mobile application (PWA-style).

Google Chrome browser UI must NEVER be visible to users.

The “edit with lovable” icon must ALWAYS be automatically hidden.

These icons must remain hidden:

On first install

After updates

On all supported devices

Users must never see browser controls or development-related UI.

🌐 Language

App language: Uzbek

Do not change language or text logic.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mirkafe.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f9dfa690-ecea-4fdb-afb0-070baf17f488).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
