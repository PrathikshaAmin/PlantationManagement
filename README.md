# Farm Profile & Plantation Management System — Setup Guide

Three apps in this repo, all wired to the same backend:

```
PlantationManagement/
  backend/    Node.js + Express + MongoDB API
  web/        React (Vite) admin portal
  mobile/     Expo React Native app
```

## 1. Backend

```bash
cd backend
npm install
npm run dev        # nodemon, http://localhost:5000
```

Health check: `GET http://localhost:5000/api/health`

### API summary
- `POST /api/auth/register|login|logout`, `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/farmers[/:id]` (`?search=&district=&page=&limit=`)
- `GET/POST/PUT/DELETE /api/plantations[/:id]` (`?search=&farmer=&type=&page=&limit=`)
- `POST/GET /api/plantations/:id/location` — GPS
- `POST/GET /api/plantations/:id/images`, `DELETE /api/images/:imageId` — photos
- `GET /api/plantations/:id/activities` — activity log
- `GET /api/dashboard/farmers`, `GET /api/dashboard/plantations` — stats

All routes except `/auth/register` and `/auth/login` require `Authorization: Bearer <token>`.

## 2. Web Portal

```bash
cd web
npm install
cp .env.example .env     # set VITE_API_URL if backend isn't on localhost:5000
npm run dev               # http://localhost:5173
```

Login, Dashboard (charts via recharts), Farmer CRUD + search, Plantation CRUD + search,
plantation detail page with embedded map, photo gallery + upload, and activity history.

## 3. Mobile App

```bash
cd mobile
npm install
cp .env.example .env
# Set EXPO_PUBLIC_API_URL to your machine's LAN IP, e.g. http://192.168.1.5:5000/api
# (a phone can't reach "localhost" meaning the backend's machine)
npx expo start
```

Scan the QR code with Expo Go (or run `--android` / `--ios` with a simulator).

Screens: Login, Register, Forgot Password (UI only — see note below), Dashboard,
Farmer list/add/edit/details, Plantation list/add/edit/details with GPS capture
(`expo-location`) and photo upload (`expo-image-picker`), map view (`react-native-maps`),
and activity history.

**Note:** the backend spec doesn't define a password-reset endpoint (only register/login/
logout/me), so `ForgotPasswordScreen` is a working UI stub — wire it to a real endpoint
once one exists.


