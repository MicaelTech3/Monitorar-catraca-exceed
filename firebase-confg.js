// ============================================================
//  firebase-config.js
//  Lê as variáveis do .env (via bundler/Vite/Webpack) OU usa
//  os valores embutidos como fallback para servir direto no
//  browser sem build step.
// ============================================================

// Se usar Vite: import.meta.env.VITE_*
// Se usar Webpack / CRA: process.env.REACT_APP_*
// Sem bundler (HTML puro): os valores do fallback são usados.

export const firebaseConfig = {
  apiKey:            (typeof import_meta_env !== "undefined" && import_meta_env.VITE_FIREBASE_API_KEY)
                       || "AIzaSyBmefFVl9_2EMEUNnetGULfNkUrz3ojSAY",
  authDomain:        (typeof import_meta_env !== "undefined" && import_meta_env.VITE_FIREBASE_AUTH_DOMAIN)
                       || "exceed-contcatraca.firebaseapp.com",
  databaseURL:       (typeof import_meta_env !== "undefined" && import_meta_env.VITE_FIREBASE_DATABASE_URL)
                       || "https://exceed-contcatraca-default-rtdb.firebaseio.com",
  projectId:         (typeof import_meta_env !== "undefined" && import_meta_env.VITE_FIREBASE_PROJECT_ID)
                       || "exceed-contcatraca",
  storageBucket:     (typeof import_meta_env !== "undefined" && import_meta_env.VITE_FIREBASE_STORAGE_BUCKET)
                       || "exceed-contcatraca.firebasestorage.app",
  messagingSenderId: (typeof import_meta_env !== "undefined" && import_meta_env.VITE_FIREBASE_MESSAGING_SENDER_ID)
                       || "728032480821",
  appId:             (typeof import_meta_env !== "undefined" && import_meta_env.VITE_FIREBASE_APP_ID)
                       || "1:728032480821:web:b2aa69a129a6f6781f6b7c",
};