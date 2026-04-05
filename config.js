const firebaseConfig = {
    apiKey: "AIzaSyCRLd-2PXRjkL6f59dEplWadvsRuUBHDmY",
    authDomain: "support-network-33699.firebaseapp.com",
    projectId: "support-network-33699",
    storageBucket: "support-network-33699.firebasestorage.app",
    messagingSenderId: "541408271881",
    appId: "1:541408271881:web:588b8eb4e93b102a0de2d8"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const { useState, useEffect } = React;
