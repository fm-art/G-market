import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAJEdWi6ewE4yE7NR4Oj5KsZ1ONGlxArDk",
    authDomain: "sell-83e46.firebaseapp.com",
    databaseURL: "https://sell-83e46-default-rtdb.firebaseio.com",
    projectId: "sell-83e46",
    storageBucket: "sell-83e46.appspot.com",
    messagingSenderId: "628130759724",
    appId: "1:628130759724:web:a7eafeb41a548f70b6bd89",
    measurementId: "G-XS1PL4H8MV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };