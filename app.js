import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { doc, onSnapshot, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

import * as UI from './ui.js';
import * as Home from './home-view.js';
import * as Item from './item-view.js';
import * as Profile from './profile-view.js';
import * as User from './user-actions.js';
import * as Admin from './admin-actions.js';
import * as Owner from './owner-actions.js';

let currentUserData = null;

const updateDynamicUI = () => {
    if (!currentUserData) return;
    const walletDisplayHome = document.querySelector('#home-wallet-balance');
    if (walletDisplayHome) walletDisplayHome.textContent = `₹${(currentUserData.walletBalance || 0).toFixed(2)}`;
    
    const walletDisplayPage = document.querySelector('#wallet-page-balance');
    if(walletDisplayPage) walletDisplayPage.textContent = `₹${(currentUserData.walletBalance || 0).toFixed(2)}`;
};

onAuthStateChanged(auth, user => {
    if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const firstLoad = !currentUserData;
                currentUserData = { uid: user.uid, ...docSnap.data() };
                
                // Provide current user data to all modules that need it
                User.setCurrentUser(currentUserData);
                Admin.setCurrentUser(currentUserData);
                Owner.setCurrentUser(currentUserData);
                Home.setCurrentUser(currentUserData);
                Item.setCurrentUser(currentUserData);
                Profile.setCurrentUser(currentUserData);

                if (firstLoad) {
                    initPanels();
                } else {
                    updateDynamicUI();
                }
            } else { 
                signOut(auth); 
            }
        });
    } else {
        currentUserData = null;
        UI.showPanel(UI.loginSection);
        UI.showLoader(false);
    }
});

function handleSignup() { 
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    if (!email || !pass) return UI.showToast('Email and Password are required.', 'error');
    UI.showLoader();
    createUserWithEmailAndPassword(auth, email, pass)
        .then(cred => setDoc(doc(db, 'users', cred.user.uid), { email: cred.user.email, role: 'user', walletBalance: 0, createdAt: serverTimestamp() }))
        .then(() => { UI.showToast('Signup successful! Please login.', 'success'); })
        .catch(err => { UI.showToast(err.message, 'error'); })
        .finally(() => UI.showLoader(false));
}

function handleLogin() { 
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value;
    if (!email || !pass) return UI.showToast('Email and Password are required.', 'error');
    UI.showLoader();
    signInWithEmailAndPassword(auth, email, pass).catch(err => { 
        UI.showToast(err.message, 'error'); 
        UI.showLoader(false); 
    });
}

const initPanels = () => {
    UI.showPanel(UI.panelsWrapper);
    Home.showHomeView();
};

document.addEventListener('DOMContentLoaded', () => {
    // Expose all module functions globally under a single namespace
    window.G_Market = {
        ...Home, ...Item, ...Profile, ...User, ...Admin, ...Owner
    };

    document.getElementById('nav-home').addEventListener('click', () => Home.showHomeView());
    document.getElementById('nav-profile').addEventListener('click', () => Profile.showProfileView());

    document.getElementById('signup-btn').addEventListener('click', handleSignup);
    document.getElementById('login-btn').addEventListener('click', handleLogin);
});