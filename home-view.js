import { db } from './firebase-config.js';
import { collection, getDocs, query, limit, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import * as UI from './ui.js';

let currentUserData;
export const setCurrentUser = (user) => {
    currentUserData = user;
};

function renderProductCard(doc, type, layout) {
    const item = doc.data();
    const id = doc.id;
    const wrapperClass = layout === 'horizontal' ? 'product-card-wrapper' : 'col-lg-4 col-md-6 mb-4';
    let name = item.name || `${item.gameName} Account`;
    let price = item.price !== undefined ? item.price : 0;
    let imageUrl = item.imageUrl || `https://via.placeholder.com/400x225.png/1F2333/FFFFFF?text=${name.replace(/\s/g, '+')}`;
    
    return `<div class="${wrapperClass}">
        <div class="product-card h-100" onclick="G_Market.showItemDetail('${id}','${type}')">
            <img src="${imageUrl}" class="product-card-img" alt="${name}">
            <div class="card-body p-3">
                <h6 class="card-title text-truncate">${name}</h6>
                <div class="d-flex justify-content-between align-items-center">
                    <span class="fw-bold" style="color: var(--secondary-color)">${price > 0 ? `₹${price}` : 'Free'}</span>
                </div>
            </div>
        </div>
    </div>`;
}

function populateCarousel(docs) {
    const container = document.getElementById('carousel-items-container');
    if (!container) return;
    if (!docs || docs.length === 0) {
        container.parentElement.style.display = "none";
        return;
    }
    let html = '';
    docs.slice(0, 3).forEach((doc, index) => {
        const post = doc.data();
        html += `<div class="carousel-item ${index === 0 ? 'active' : ''}" onclick="G_Market.showItemDetail('${doc.id}','hack')">
            <img src="${post.imageUrl || `https://via.placeholder.com/800x400.png/1F2333/FFFFFF?text=${post.name.replace(' ', '+')}`}" class="d-block w-100 product-card-img" alt="${post.name}">
            <div class="carousel-caption d-none d-md-block" style="background:rgba(0,0,0,0.5);border-radius:8px;">
                <h5>${post.name}</h5>
                <p>Available for ₹${post.price}</p>
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

function populateHorizontalSection(containerId, docs, type) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!docs || docs.length === 0) {
        container.innerHTML = "<p class='text-muted small ps-2'>No items yet.</p>";
        return;
    }
    let html = '';
    docs.forEach(doc => {
        html += renderProductCard(doc, type, 'horizontal');
    });
    container.innerHTML = html;
}

function populateGridSection(containerId, docs, type) {
    const container = document.getElementById(containerId);
     if (!container) return;
    if (!docs || docs.length === 0) {
        container.innerHTML = "<div class='col-12'><p class='text-muted small'>No free items.</p></div>";
        return;
    }
    let html = '';
    docs.forEach(doc => {
        html += renderProductCard(doc, type, 'grid');
    });
    container.innerHTML = html;
}

function handleHomeSearch(event) {
    if (event.key === 'Enter') {
        const term = document.getElementById('home-search-input').value.trim();
        if (term) {
            G_Market.showMarketplaceView(`Search: "${term}"`, 'bi-search', term);
        }
    }
}

export async function showHomeView() {
    UI.setActiveNav('nav-home');
    UI.contentTitle.style.display = 'none';
    UI.subNavArea.innerHTML = '';
    UI.showLoader();

    const walletBalanceHTML = `<div class="card p-2 mb-4" style="background-color: var(--bg-content);">
        <div class="d-flex justify-content-between align-items-center px-2">
            <span><i class="bi bi-wallet2 me-2 text-muted"></i>Wallet Balance</span>
            <span id="home-wallet-balance" class="fw-bold fs-5" style="color: var(--secondary-color);">₹${(currentUserData.walletBalance || 0).toFixed(2)}</span>
        </div>
    </div>`;

    UI.contentArea.innerHTML = `<div class="content-load-animation">
        <h4 class="fw-light">Welcome, <span class="fw-semibold" style="color:var(--primary-color)">${currentUserData.email.split('@')[0]}</span></h4>
        ${walletBalanceHTML}
        <div class="search-bar-wrapper my-3 position-relative">
            <i class="bi bi-search position-absolute top-50 translate-middle-y" style="left: 1rem; opacity: 0.5;"></i>
            <input type="text" id="home-search-input" class="form-control" placeholder="Search for hacks & games..." style="padding-left: 2.5rem;">
        </div>
        <div id="featured-carousel" class="carousel slide mb-4" data-bs-ride="carousel">
            <div class="carousel-inner" id="carousel-items-container">${UI.renderSpinner()}</div>
            <button class="carousel-control-prev" type="button" data-bs-target="#featured-carousel" data-bs-slide="prev"><span class="carousel-control-prev-icon"></span></button>
            <button class="carousel-control-next" type="button" data-bs-target="#featured-carousel" data-bs-slide="next"><span class="carousel-control-next-icon"></span></button>
        </div>
        <h5 class="mb-3 section-heading">Featured Hacks</h5>
        <div class="horizontal-scroll-wrapper" id="featured-hacks-container">${UI.renderSpinner()}</div>
        <h5 class="mb-3 mt-4 section-heading">Fresh Accounts</h5>
        <div class="horizontal-scroll-wrapper" id="fresh-accounts-container">${UI.renderSpinner()}</div>
        <h5 class="mb-3 mt-4 section-heading">Try for Free</h5>
        <div class="row" id="free-hacks-grid">${UI.renderSpinner()}</div>
    </div>`;
    document.getElementById('home-search-input').addEventListener('keyup', handleHomeSearch);

    try {
        const [hacksSnap, accountsSnap, freeHacksSnap] = await Promise.all([
            getDocs(query(collection(db, 'gamePosts'), limit(10))),
            getDocs(query(collection(db, 'accountsForSale'), where('status', '==', 'available'), limit(10))),
            getDocs(query(collection(db, 'freeHacks'), limit(6)))
        ]);

        populateCarousel(hacksSnap.docs);
        populateHorizontalSection('featured-hacks-container', hacksSnap.docs, 'hack');
        populateHorizontalSection('fresh-accounts-container', accountsSnap.docs, 'account');
        populateGridSection('free-hacks-grid', freeHacksSnap.docs, 'freeHack');
    } catch (error) {
        console.error("Error fetching homepage data:", error);
        UI.contentArea.innerHTML = "<p class='text-danger'>Could not load items. Please try again.</p>";
    } finally {
        UI.showLoader(false);
    }
}