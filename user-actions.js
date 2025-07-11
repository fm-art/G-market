import { db } from './firebase-config.js';
import { doc, getDoc, getDocs, collection, query, where, orderBy, addDoc, serverTimestamp, runTransaction, increment, deleteDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import * as UI from './ui.js';

let currentUserData;
export const setCurrentUser = (user) => {
    currentUserData = user;
};

export async function getPurchasedItemIds() {
    const ids = new Set();
    if (!currentUserData) return ids;
    const snap = await getDocs(collection(db, 'users', currentUserData.uid, 'library'));
    snap.forEach(doc => {
        if (doc.data().originalId) ids.add(doc.data().originalId);
    });
    return ids;
}

export async function getUsedFreeHackIds() {
    const ids = new Set();
    if (!currentUserData) return ids;
    const snap = await getDocs(collection(db, 'users', currentUserData.uid, 'usedFreeHacks'));
    snap.forEach(doc => ids.add(doc.id));
    return ids;
}

export async function user_showWallet() {
    UI.showBackButton('profile');
    UI.setContentTitleHTML('My Wallet', 'bi-wallet2');
    UI.contentArea.innerHTML = UI.renderSpinner();
    const ownerDoc = await getDoc(doc(db, 'ownerDetails', 'config'));
    const details = ownerDoc.exists() ? ownerDoc.data() : {};
    let payOpts = '', withdrawOpts = '';
    if(details.upiId){payOpts+=`<option value="UPI: ${details.upiId}">UPI</option>`;withdrawOpts+=`<option value="UPI">UPI</option>`;} if(details.phonePe){payOpts+=`<option value="PhonePe: ${details.phonePe}">PhonePe</option>`;withdrawOpts+=`<option value="PhonePe">PhonePe</option>`;} if(details.gPay){payOpts+=`<option value="GPay: ${details.gPay}">GPay</option>`;withdrawOpts+=`<option value="GPay">GPay</option>`;} if(details.paytm){payOpts+=`<option value="Paytm: ${details.paytm}">Paytm</option>`;}
    UI.contentArea.innerHTML = `<div class="content-load-animation"><div class="card text-center p-3 mb-5" style="background:linear-gradient(90deg,var(--primary-color),var(--secondary-color));border:none;"><div class="card-body"><p class="text-white-50 mb-1">CURRENT BALANCE</p><h1 id="wallet-page-balance" class="display-4 fw-bold text-white">₹${currentUserData.walletBalance.toFixed(2)}</h1></div></div><div class="row"><div class="col-lg-6 mb-4"><div class="card h-100"><div class="card-body p-4"><h4 class="mb-4" style="color:var(--text-light)"><i class="bi bi-arrow-down-circle me-2 text-success"></i>Deposit</h4><div class="mb-3"><input type="number" id="deposit-amount" class="form-control" placeholder="Amount"></div><div class="mb-3"><select id="deposit-method-select" class="form-select">${payOpts}</select></div><div id="payment-details-display" class="alert small" style="background-color:var(--bg-dark);border:none;color:var(--text-light);"></div><div class="mb-3"><input type="text" id="utr-number" class="form-control" placeholder="Enter UTR/Transaction ID"></div><div class="d-grid"><button class="btn btn-primary" onclick="G_Market.user_handleDeposit(this)">Request Deposit</button></div></div></div></div><div class="col-lg-6 mb-4"><div class="card h-100"><div class="card-body p-4"><h4 class="mb-4" style="color:var(--text-light)"><i class="bi bi-arrow-up-circle me-2 text-warning"></i>Withdraw</h4><div class="mb-3"><input type="number" id="withdraw-amount" class="form-control" placeholder="Amount"></div><div class="mb-3"><select id="withdraw-method" class="form-select">${withdrawOpts}</select></div><div class="mb-3"><input type="text" id="withdraw-details" class="form-control" placeholder="Your UPI ID / PhonePe Number"></div><div class="d-grid"><button class="btn btn-warning" onclick="G_Market.user_handleWithdrawal(this)">Request Withdrawal</button></div></div></div></div></div></div>`;
    const sel=document.getElementById('deposit-method-select'), disp=document.getElementById('payment-details-display');
    if(sel){
        const update=()=>{
            if(disp && sel.value) disp.textContent=`Pay to: ${sel.value.split(': ')[1]}`;
        };
        sel.onchange=update;
        if(sel.options.length>0) update();
        else if(disp) disp.textContent='Owner has not configured payment methods.';
    }
}

export async function user_handleWithdrawal(btn) {
    btn.disabled=true; UI.showLoader();
    const amount=parseFloat(document.getElementById('withdraw-amount').value),method=document.getElementById('withdraw-method').value,details=document.getElementById('withdraw-details').value;
    if(isNaN(amount)||amount<=0||!details){UI.showToast('Enter valid amount and details.','error');btn.disabled=false;UI.showLoader(false);return;}
    if(amount>currentUserData.walletBalance){UI.showToast('Insufficient balance.','error');btn.disabled=false;UI.showLoader(false);return;}
    try {
        await addDoc(collection(db,'requests'),{type:'withdrawal',userId:currentUserData.uid,userEmail:currentUserData.email,amount:amount,status:'pending',withdrawalDetails:{method:method,details:details},createdAt:serverTimestamp()});
        UI.showToast('Withdrawal request sent!','success');
        document.getElementById('withdraw-amount').value='';document.getElementById('withdraw-details').value='';
    } catch(e) { UI.showToast(`Error: ${e.message}`,'error'); }
    finally { UI.showLoader(false);btn.disabled=false; }
}

export async function user_handleDeposit(btn) {
    btn.disabled=true; UI.showLoader();
    const amount=parseFloat(document.getElementById('deposit-amount').value),utr=document.getElementById('utr-number').value;
    if(isNaN(amount)||amount<=0||!utr){UI.showToast('Enter valid amount and UTR.','error');btn.disabled=false;UI.showLoader(false);return;}
    try {
        await addDoc(collection(db,'requests'),{type:'deposit',userId:currentUserData.uid,userEmail:currentUserData.email,amount:amount,utrNumber:utr,status:'pending',createdAt:serverTimestamp()});
        UI.showToast('Deposit request sent!','success');
        document.getElementById('deposit-amount').value='';document.getElementById('utr-number').value='';
    } catch(e) { UI.showToast(`Error: ${e.message}`,'error'); }
    finally { UI.showLoader(false);btn.disabled=false; }
}

export async function user_showLibrary() {
    UI.showBackButton('profile');
    UI.setContentTitleHTML('My Library', 'bi-collection-play');
    UI.contentArea.innerHTML = UI.renderSpinner();
    const snapshot = await getDocs(query(collection(db, 'users', currentUserData.uid, 'library'), orderBy('purchaseDate', 'desc')));
    let html = '<div id="library-list-container" class="list-group list-group-flush">';
    if (snapshot.empty) {
        html += '<div class="list-group-item text-muted bg-transparent">No items purchased yet.</div>';
    } else {
        snapshot.forEach(docSnap => {
            const item = docSnap.data(), libraryDocId = docSnap.id;
            let details = item.downloadUrl ? `Download: <a href="${item.downloadUrl}" target="_blank" class="text-decoration-none" style="color:var(--secondary-color)">Click Here</a>` : `ID: ${item.id || 'N/A'}, Pass: ${item.password || 'N/A'}`;
            html += `<div id="library-item-${libraryDocId}" class="list-group-item bg-transparent d-flex justify-content-between align-items-center"><div><strong>${item.name || item.gameName}</strong><br><small class="text-muted">Type: ${item.type} | Price: ₹${item.price}</small><br><small>${details}</small></div><button class="btn btn-sm btn-outline-danger" onclick="G_Market.user_deleteLibraryItem('${libraryDocId}')"><i class="bi bi-trash-fill"></i></button></div>`;
        });
    }
    html += '</div>';
    UI.contentArea.innerHTML = `<div class="card content-load-animation"><div class="card-body">${html}</div></div>`;
}

export function user_deleteLibraryItem(libraryItemId) {
    UI.showConfirmModal('Delete From Library?', 'This will permanently remove this item from your library. Are you sure?', async () => {
        UI.showLoader();
        try {
            await deleteDoc(doc(db, 'users', currentUserData.uid, 'library', libraryItemId));
            const itemElement = document.getElementById(`library-item-${libraryItemId}`);
            if (itemElement) itemElement.remove();
            const listContainer = document.getElementById('library-list-container');
            if (listContainer && listContainer.children.length === 0) {
                listContainer.innerHTML = '<div class="list-group-item text-muted bg-transparent">No items purchased yet.</div>';
            }
            UI.showToast('Item removed from library.', 'success');
        } catch (e) {
            UI.showToast(`Error: ${e.message}`, 'error');
        } finally {
            UI.showLoader(false);
        }
    });
}

export async function user_showContact() {
    UI.showBackButton('profile');
    UI.setContentTitleHTML('Contact Owner','bi-telephone');
    const docSnap=await getDoc(doc(db,'ownerDetails','config'));
    const details=docSnap.exists()?docSnap.data():{};
    UI.contentArea.innerHTML=`<div class="card content-load-animation"><div class="list-group list-group-flush"><div class="list-group-item bg-transparent"><strong>UPI:</strong> ${details.upiId||'Not Available'}</div><div class="list-group-item bg-transparent"><strong>PhonePe:</strong> ${details.phonePe||'Not Available'}</div><div class="list-group-item bg-transparent"><strong>GPay:</strong> ${details.gPay||'Not Available'}</div><div class="list-group-item bg-transparent"><strong>Paytm:</strong> ${details.paytm||'Not Available'}</div></div></div>`;
}

export function user_getFreeHack(btn, id, url) {
    btn.disabled = true;
    UI.showConfirmModal('Get Free Trial?', 'This will start your free trial.', async () => {
        UI.showLoader();
        try {
            await setDoc(doc(db, 'users', currentUserData.uid, 'usedFreeHacks', id), { timestamp: serverTimestamp() });
            UI.showToast('Trial started!', 'success');
            window.open(url, '_blank');
            G_Market.showItemDetail(id, 'freeHack');
        } catch (e) {
            UI.showToast(`Error: ${e.message}`, 'error');
            btn.disabled = false;
        } finally {
            UI.showLoader(false);
        }
    });
    // Re-enable button if modal is dismissed without confirming
    const modalElement = document.getElementById('confirmModal');
    const onModalHidden = () => {
        if (!btn.classList.contains('btn-success')) { // check if purchase was successful
            btn.disabled = false;
        }
        modalElement.removeEventListener('hidden.bs.modal', onModalHidden);
    };
    modalElement.addEventListener('hidden.bs.modal', onModalHidden);
}

export function user_buyItem(btn, id, price, type) {
    btn.disabled = true;
    UI.showConfirmModal('Confirm Purchase', `Buy for ₹${price}?`, async () => {
        UI.showLoader();
        if (currentUserData.walletBalance < price) {
            UI.showToast('Insufficient balance.', 'error'); UI.showLoader(false); btn.disabled = false; return;
        }
        const userRef = doc(db, 'users', currentUserData.uid);
        const collectionName = type === 'account' ? 'accountsForSale' : 'gamePosts';
        const itemRef = doc(db, collectionName, id);
        try {
            await runTransaction(db, async t => {
                const userDoc = await t.get(userRef);
                const itemDoc = await t.get(itemRef);
                if (!userDoc.exists() || !itemDoc.exists()) throw new Error("User/item not found.");
                if (userDoc.data().walletBalance < price) throw new Error("Insufficient balance.");
                if (type === 'account' && itemDoc.data().status !== 'available') throw new Error("Item unavailable.");
                const itemData = itemDoc.data();
                
                t.update(userRef, { walletBalance: increment(-price) });
                
                const libraryItem = { originalId: id, type: type, price: price, purchaseDate: serverTimestamp(), name: itemData.name, gameName: itemData.gameName, info: itemData.info, imageUrl: itemData.imageUrl, downloadUrl: itemData.downloadUrl, id: itemData.id, password: itemData.password };
                Object.keys(libraryItem).forEach(key => libraryItem[key] === undefined && delete libraryItem[key]);
                
                t.set(doc(collection(userRef, 'library')), libraryItem);
                t.set(doc(collection(userRef, 'transactions')), { type: 'purchase', amount: -price, itemName: itemData.name || itemData.gameName, date: serverTimestamp() });
                if (type === 'account') t.update(itemRef, { status: 'sold', purchasedBy: currentUserData.uid });
            });
            UI.showToast('Purchase successful!', 'success');
            
            btn.classList.remove('btn-primary'); btn.classList.add('btn-success');
            btn.innerHTML = '<i class="bi bi-check-circle me-2"></i>View in Library';
            btn.onclick = () => G_Market.user_showLibrary();
            btn.disabled = false;

        } catch (e) {
            UI.showToast(`Purchase failed: ${e.message || e}`, 'error'); btn.disabled = false;
        } finally {
            UI.showLoader(false);
        }
    });
    // Re-enable button if modal is dismissed without confirming
    const modalElement = document.getElementById('confirmModal');
    const onModalHidden = () => {
        if (!btn.classList.contains('btn-success')) { // check if purchase was successful
            btn.disabled = false;
        }
        modalElement.removeEventListener('hidden.bs.modal', onModalHidden);
    };
    modalElement.addEventListener('hidden.bs.modal', onModalHidden);
}

export async function user_viewMySellRequests() {
    UI.showBackButton('profile');
    UI.setContentTitleHTML('My Sell Requests', 'bi-card-list');
    UI.contentArea.innerHTML = UI.renderSpinner();
    const requestsQuery = query(collection(db, 'requests'), where('userId', '==', currentUserData.uid), where('type', '==', 'accountSell'), orderBy('createdAt', 'desc'));
    try {
        const snapshot = await getDocs(requestsQuery);
        let html = '<div id="sell-requests-list" class="list-group list-group-flush">';
        if (snapshot.empty) {
            html += '<div class="list-group-item bg-transparent text-muted">You have not submitted any accounts for sale.</div>';
        } else {
            snapshot.forEach(docSnap => {
                const request = docSnap.data(), requestId = docSnap.id;
                let statusBadge;
                switch (request.status) {
                    case 'pending': statusBadge = `<span class="badge bg-warning text-dark">Pending</span>`; break;
                    case 'approved': statusBadge = `<span class="badge bg-success">Approved</span>`; break;
                    case 'rejected': statusBadge = `<span class="badge bg-danger">Rejected</span>`; break;
                    default: statusBadge = `<span class="badge bg-secondary">${request.status}</span>`; break;
                }
                html += `<div id="request-item-${requestId}" class="list-group-item bg-transparent d-md-flex justify-content-between align-items-center"><div><strong>${request.accountDetails.gameName}</strong> - <span style="color:var(--secondary-color)">₹${request.accountDetails.price}</span><br><small class="text-muted">Status: ${statusBadge}</small></div><button class="btn btn-sm btn-outline-danger mt-2 mt-md-0" onclick="G_Market.user_clearRequestFromHistory('${requestId}')"><i class="bi bi-trash-fill"></i></button></div>`;
            });
        }
        html += '</div>';
        UI.contentArea.innerHTML = `<div class="card content-load-animation"><div class="card-body">${html}</div></div>`;
    } catch (error) {
        console.error("Error fetching sell requests: ", error);
        UI.showToast("Failed to load requests. Ensure DB indexes are set.", "error");
        UI.contentArea.innerHTML = "<p class='text-danger text-center'>Could not load requests. The database may need to be configured. Please contact the owner.</p>"
    }
}

export function user_clearRequestFromHistory(requestId) {
    UI.showConfirmModal('Clear From History?', 'Are you sure you want to remove this request from your history? This cannot be undone.', async () => {
        UI.showLoader();
        try {
            await deleteDoc(doc(db, 'requests', requestId));
            const itemElement = document.getElementById(`request-item-${requestId}`);
            if (itemElement) itemElement.remove();
            const listContainer = document.getElementById('sell-requests-list');
            if (listContainer && listContainer.children.length === 0) {
                listContainer.innerHTML = '<div class="list-group-item bg-transparent text-muted">You have not submitted any accounts for sale.</div>';
            }
            UI.showToast('Request removed from history.', 'success');
        } catch (e) {
            UI.showToast(`Error: ${e.message}`, 'error');
        } finally {
            UI.showLoader(false);
        }
    });
}