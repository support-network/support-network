// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCrLD-2PXRjkL6f59deplWadvsRuUBHDmY",
  authDomain: "support-network-33699.firebaseapp.com",
  projectId: "support-network-33699",
  storageBucket: "support-network-33699.firebasestorage.app",
  messagingSenderId: "541408271881",
  appId: "1:541408271881:web:588b8eb4e93b102a0de2d8"
};

// Инициализация
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Делаем переменные глобальными (window), чтобы другие файлы их видели
window.auth = firebase.auth();
window.db = firebase.firestore();
window.appId = 'support-net-v2';
