import * as UI from './ui.js';
import { auth } from './firebase-config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

let currentUserData;
export const setCurrentUser = (user) => {
    currentUserData = user;
};

export function showProfileView() {
    UI.setActiveNav('nav-profile');
    UI.contentTitle.style.display = 'none';
    UI.subNavArea.innerHTML = '';

    let adminToolsHTML = '', ownerToolsHTML = '';
    
    if (currentUserData.role === 'admin' || currentUserData.role === 'owner') {
        adminToolsHTML = `<h4 class="mt-5 mb-3 section-heading">Admin Tools</h4>
        <div class="d-grid gap-3">
            <a href="#" class="text-decoration-none" onclick="event.preventDefault(); G_Market.admin_showSection('create-post')"><div class="menu-list-item"><i class="bi bi-plus-square"></i><h5>Create Post</h5></div></a>
            <a href="#" class="text-decoration-none" onclick="event.preventDefault(); G_Market.admin_showSection('my-posts')"><div class="menu-list-item"><i class="bi bi-list-task"></i><h5>My Posts</h5></div></a>
        </div>`;
    }

    if (currentUserData.role === 'owner') {
        ownerToolsHTML = `<h4 class="mt-5 mb-3 section-heading">Owner Tools</h4>
        <div class="d-grid gap-3">
            <a href="#" class="text-decoration-none" onclick="event.preventDefault(); G_Market.owner_viewRequests()"><div class="menu-list-item"><i class="bi bi-bell"></i><h5>View Requests</h5></div></a>
            <a href="#" class="text-decoration-none" onclick="event.preventDefault(); G_Market.owner_viewUsers()"><div class="menu-list-item"><i class="bi bi-people"></i><h5>Manage Users</h5></div></a>
            <a href="#" class="text-decoration-none" onclick="event.preventDefault(); G_Market.owner_viewAdmins()"><div class="menu-list-item"><i class="bi bi-person-gear"></i><h5>Manage Admins</h5></div></a>
            <a href="#" class="text-decoration-none" onclick="event.preventDefault(); G_Market.owner_paymentSettings()"><div class="menu-list-item"><i class="bi bi-credit-card"></i><h5>Payment Settings</h5></div></a>
        </div>`;
    }

    UI.contentArea.innerHTML = `<div class="content-load-animation">
        <h2 class="section-heading mb-4">My Account</h2>
        <div class="d-grid gap-3">
            <a href="#" class="text-decoration-none" onclick="event.preventDefault(); G_Market.user_showWallet()"><div class="menu-list-item"><i class="bi bi-wallet2"></i><h5>My Wallet</h5></div></a>
            <a href="#" class="text-decoration-none" onclick="event.preventDefault(); G_Market.user_showLibrary()"><div class="menu-list-item"><i class="bi bi-collection-play"></i><h5>My Library</h5></div></a>
            <a href="#" class="text-decoration-none" onclick="event.preventDefault(); G_Market.admin_showSection('request-id')"><div class="menu-list-item"><i class="bi bi-tag"></i><h5>Sell an Account</h5></div></a>
            <a href="#" class="text-decoration-none" onclick="event.preventDefault(); G_Market.user_viewMySellRequests()"><div class="menu-list-item"><i class="bi bi-card-list"></i><h5>My Sell Requests</h5></div></a>
            <a href="#" class="text-decoration-none" onclick="event.preventDefault(); G_Market.user_showContact()"><div class="menu-list-item"><i class="bi bi-telephone"></i><h5>Contact</h5></div></a>
        </div>
        ${adminToolsHTML}
        ${ownerToolsHTML}
        <div class="d-grid mt-5">
            <button class="btn btn-danger" id="logout-btn-profile"><i class="bi bi-box-arrow-right me-2"></i> Logout</button>
        </div>
    </div>`;

    document.getElementById('logout-btn-profile').addEventListener('click', () => signOut(auth));
}