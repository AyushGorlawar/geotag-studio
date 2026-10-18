# GeoTag Studio

A polished, mobile-first React photo geotag editor. Edit any portrait or landscape photo, add a custom location/time/coordinate stamp and an optional QR code, and export a full-resolution PNG. Image processing is local to your browser.

## Windows quick start

1. Install **Node.js LTS** from https://nodejs.org/ if not already installed.
2. Unzip this project.
3. Double-click **START-WINDOWS.bat**. It installs dependencies on first launch and starts the local website.
4. Visit **http://localhost:5173** in your browser. Keep the terminal open while using the app.

## Mac / Linux / manual Windows

```sh
npm install
npm run dev
```

Open http://localhost:5173 . To create a production bundle: `npm run build` (output in `dist/`).

## Using it on your phone

Connect phone and laptop to the same Wi-Fi. Run the app on the laptop, find your laptop's local IPv4 address (`ipconfig` on Windows), and visit `http://YOUR_LAPTOP_IP:5173` on the phone. Windows Firewall may ask you to allow Node.js on private networks. Most mobile browsers require HTTPS or localhost for **Current location** access; the map picker still works over a local HTTP connection. QR map links and online map tiles need internet.

## Features

- JPG / PNG / WebP and browser-supported image formats, portrait or landscape
- Location name, address, latitude, longitude, date and time
- Interactive OpenStreetMap map picker, current location permission button
- Live on-image preview, light / dark overlay, position/size/opacity sliders
- Auto-generated QR code from manually entered coordinate values
- Full original-resolution PNG export (subject to browser memory limits)
- No backend and no photo uploads; compatible with laptop and mobile browsers

## Important

This tool creates **user-specified graphical overlays**. It does **not** edit the photo's EXIF metadata or prove where/when a photograph was taken. For records or audits, retain the original file and distinguish edited versions. It intentionally does not spoof the Google camera application or its branding.

## Troubleshooting

- If the Windows launcher closes, open Command Prompt in the extracted folder and run `npm install` followed by `npm run dev` to see the error.
- If port 5173 is occupied, Vite may choose a different port and print the new URL in the terminal.
- iPhone HEIC support depends on the browser and operating system; export a JPG first if necessary.
- Large images may exceed memory limits on older phones; reduce the image dimensions if PNG export fails.
