# Setup Guide — Farm Profile & Plantation Management System

This project has three parts in one repo: `backend/` (Express + MongoDB API), `web/` (React admin portal), `mobile/` (Expo/React Native app).

## Prerequisites
- Node.js 18+ and npm
- A MongoDB instance (local `mongod`, or a free MongoDB Atlas cluster)
- Expo Go app on your phone (for testing the mobile app), or an Android/iOS simulator
- Git

## 1. Clone the repo
```bash
git clone https://github.com/PrathikshaAmin/PlantationManagement.git
cd PlantationManagement
```

## 2. Backend setup
```bash
cd backend
npm install
```
Create a `.env` file in `backend/` with:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/plantation_management
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
MAX_UPLOAD_SIZE_MB=10
NODE_ENV=development
```
Run it:
```bash
npm run dev      # nodemon, auto-restarts on changes
# or
npm start        # plain node
```
Confirm it's up: `GET http://localhost:5000/api/health` should return `{ "success": true, "message": "API is running" }`.

Uploaded images are written to `backend/uploads/plantations/` and served at `http://localhost:5000/uploads/plantations/<filename>`.

## 3. Web portal setup
```bash
cd web
npm install
```
If the portal needs to know the API URL, create a `.env` file in `web/` with:
```
VITE_API_URL=http://localhost:5000/api
```
Run it:
```bash
npm run dev
```
Open the printed local URL (Vite default: `http://localhost:5173`).

## 4. Mobile app setup
```bash
cd mobile
npm install
```
Create a `.env` file in `mobile/` (Expo picks up `EXPO_PUBLIC_*` variables automatically):
```
EXPO_PUBLIC_API_URL=http://<your-computer-LAN-IP>:5000/api
```
> Use your machine's LAN IP (not `localhost`) so a phone on the same Wi-Fi can reach the backend — e.g. `http://192.168.1.42:5000/api`. Find it with `ipconfig` (Windows) or `ifconfig`/`ip a` (Mac/Linux).

Run it:
```bash
npx expo start
```
Scan the QR code with Expo Go (Android) or the Camera app (iOS), or press `a` / `i` to launch an emulator/simulator.

## 5. First-time data
There's no admin user or seed data by default. Either:
- Register the first user through the mobile app's Registration screen or via `POST /api/auth/register`, or
- Run the seed script described in `docs/SEED_DATA.md` (see below) to populate demo farmers, plantations, locations, and images in one go.

## 6. Common issues
| Symptom | Fix |
|---|---|
| Backend won't connect to MongoDB | Check `MONGO_URI` and that `mongod` is running (if local) |
| Mobile app can't reach the API | Use your LAN IP, not `localhost`, in `EXPO_PUBLIC_API_URL`; make sure phone and computer are on the same network |
| Image upload fails with "Only JPG and PNG images are allowed" | Expected — the API only accepts `image/jpeg` and `image/png` |
| Image upload fails with a file-not-found error | The `backend/uploads/plantations/` folder must exist before the first upload — `config/multer.js` creates it automatically on startup, so restart the server if it was deleted |
| 401 on every request after login | Confirm the token is sent as `Authorization: Bearer <token>`, and that `JWT_SECRET` matches between requests (don't change it and expect old tokens to keep working) |
