import { db } from './firebase-config.js';
import { collection, getDocs, query, where, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import * as UI from './ui.js';
import { getPurchasedItemIds, getUsedFreeHackIds } from './user-actions.js';

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

export async function showMarketplaceView(title, icon, searchTerm = '') {
    UI.showBackButton('home');
    UI.setContentTitleHTML(title, icon);
    UI.contentArea.innerHTML = UI.renderSpinner();
    try {
        const [hacksSnap, accountsSnap, freeHacksSnap] = await Promise.all([
            getDocs(collection(db, 'gamePosts')),
            getDocs(query(collection(db, 'accountsForSale'), where('status', '==', 'available'))),
            getDocs(collection(db, 'freeHacks'))
        ]);
        let items = [];
        hacksSnap.docs.forEach(doc => items.push({ doc, type: 'hack' }));
        accountsSnap.docs.forEach(doc => items.push({ doc, type: 'account' }));
        freeHacksSnap.docs.forEach(doc => items.push({ doc, type: 'freeHack' }));

        if (searchTerm) {
            items = items.filter(({ doc }) =>
                (doc.data().name || doc.data().gameName || '').toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (items.length === 0) {
            UI.contentArea.innerHTML = `<p class="text-center content-load-animation">No items found.</p>`;
            return;
        }

        let html = '<div class="row content-load-animation">';
        items.forEach(({ doc, type }) => html += renderProductCard(doc, type, 'grid'));
        html += '</div>';
        UI.contentArea.innerHTML = html;
    } catch (error) {
        console.error("Error searching items:", error);
        UI.showToast("Could not perform search.", "error");
    }
}

export async function showItemDetail(itemId, itemType) {
    UI.showBackButton('home');
    UI.contentArea.innerHTML = UI.renderSpinner();
    try {
        const collectionName = itemType === 'account' ? 'accountsForSale' : (itemType === 'freeHack' ? 'freeHacks' : 'gamePosts');
        const itemDoc = await getDoc(doc(db, collectionName, itemId));
        if (!itemDoc.exists()) throw new Error("Item not found");

        const item = itemDoc.data();
        let name = item.name || `${item.gameName} Account`;
        let price = item.price !== undefined ? item.price : 0;
        let imageUrl = item.imageUrl || `https://via.placeholder.com/800x400.png/1F2333/FFFFFF?text=${name.replace(/\s/g, '+')}`;
        let description = item.info || `A high-quality ${name}.`;
        let buttonHtml = '';

        const purchasedIds = await getPurchasedItemIds();
        const usedFreeHackIds = await getUsedFreeHackIds();

        if (purchasedIds.has(itemId)) {
            buttonHtml = `<button class="btn btn-success w-100" onclick="G_Market.user_showLibrary()"><i class="bi bi-check-circle me-2"></i>View in Library</button>`;
        } else if (usedFreeHackIds.has(itemId)) {
            buttonHtml = `<button class="btn btn-info w-100" disabled><i class="bi bi-check-circle me-2"></i>Free Trial Claimed</button>`;
        } else {
            if (itemType === 'freeHack') {
                buttonHtml = `<button class="btn btn-info w-100" onclick="G_Market.user_getFreeHack(this, '${itemId}', '${item.downloadUrl}')"><i class="bi bi-gift me-2"></i>Get Free Trial</button>`;
            } else {
                buttonHtml = `<button id="buy-button-${itemId}" class="btn btn-primary w-100" onclick="G_Market.user_buyItem(this, '${itemId}', ${price}, '${itemType}')"><i class="bi bi-cart-plus me-2"></i>Buy for ₹${price}</button>`;
            }
        }

        UI.setContentTitleHTML(name, 'bi-joystick');
        UI.contentArea.innerHTML = `<div class="content-load-animation">
            <div class="card overflow-hidden mb-4"><img src="${imageUrl}" class="card-img-top" alt="${name}"></div>
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${name}</h5>
                    <p class="text-muted">${description}</p>
                    <div class="d-grid mt-4">${buttonHtml}</div>
                </div>
            </div>
        </div>`;
    } catch (error) {
        UI.showToast(`Error: ${error.message}`, 'error');
        G_Market.showHomeView();
    }
}