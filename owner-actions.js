import { db } from './firebase-config.js';
import { collection, query, where, orderBy, onSnapshot, doc, runTransaction, increment, getDocs, updateDoc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import * as UI from './ui.js';

let currentUserData;
export const setCurrentUser = (user) => {
    currentUserData = user;
};

export function owner_viewRequests() {
    UI.showBackButton('profile');
    UI.setContentTitleHTML('Pending Requests', 'bi-bell');
    UI.contentArea.innerHTML = UI.renderSpinner();
    const requestsQuery = query(collection(db, 'requests'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
    onSnapshot(requestsQuery, (snapshot) => {
        if (snapshot.empty) {
            UI.contentArea.innerHTML = `<div class="card content-load-animation"><div class="card-body text-muted">No pending requests.</div></div>`;
            return;
        }
        let html = '<div class="list-group list-group-flush content-load-animation">';
        snapshot.docs.forEach(docSnap => {
            const request = docSnap.data();
            html += `<div class="list-group-item d-md-flex justify-content-between align-items-center bg-transparent"><div><strong>Type:</strong> <span class="badge" style="background-color:var(--warning-color);">${request.type.toUpperCase()}</span> | <strong>User:</strong> ${request.userEmail || request.userId}<br>${request.amount ? `<strong>Amount:</strong> ₹${request.amount}` : ''}${request.utrNumber ? ` | <strong>UTR:</strong> ${request.utrNumber}` : ''}${request.accountDetails ? `<strong>Game:</strong> ${request.accountDetails.gameName} | <strong>Price:</strong> ₹${request.accountDetails.price}` : ''}${request.withdrawalDetails ? `<strong>To:</strong> ${request.withdrawalDetails.method} - ${request.withdrawalDetails.details}` : ''}</div><div class="mt-2 mt-md-0"><button class="btn btn-sm btn-success" onclick="G_Market.owner_handleRequest(this,'${docSnap.id}','approved')">Approve</button><button class="btn btn-sm btn-danger ms-2" onclick="G_Market.owner_handleRequest(this,'${docSnap.id}','rejected')">Reject</button></div></div>`;
        });
        html += '</div>';
        UI.contentArea.innerHTML = `<div class="card">${html}</div>`;
    }, (error) => {
        console.error("Error listening to requests: ", error);
        UI.showToast("Failed to load requests. Ensure DB indexes are set.", "error");
        UI.contentArea.innerHTML = "<p class='text-danger text-center'>Could not load requests. The database may need to be configured. Please contact the owner.</p>"
    });
}

export async function owner_handleRequest(btn, reqId, status) {
    btn.disabled = true;
    UI.showLoader();
    const reqRef = doc(db, 'requests', reqId);
    try {
        await runTransaction(db, async t => {
            const reqDoc = await t.get(reqRef);
            if (!reqDoc.exists()) throw new Error("Request not found.");
            const reqData = reqDoc.data();
            const userRef = doc(db, 'users', reqData.userId);
            if (status === 'approved') {
                if (reqData.type === 'deposit') {
                    t.update(userRef, { walletBalance: increment(reqData.amount) });
                } else if (reqData.type === 'withdrawal') {
                    const userDoc = await t.get(userRef);
                    if (userDoc.data().walletBalance < reqData.amount) throw new Error("User has insufficient balance.");
                    t.update(userRef, { walletBalance: increment(-reqData.amount) });
                } else if (reqData.type === 'accountSell') {
                    t.set(doc(collection(db, 'accountsForSale')), { ...reqData.accountDetails, sellerId: reqData.userId, status: 'available', createdAt: serverTimestamp() });
                }
            }
            t.update(reqRef, { status: status });
        });
        UI.showToast(`Request has been ${status}.`, 'success');
    } catch (e) {
        UI.showToast(`Error: ${e.message || e}`, 'error');
        btn.disabled = false;
    } finally {
        UI.showLoader(false);
    }
}

export async function owner_viewUsers() {
    UI.showBackButton('profile');
    UI.setContentTitleHTML('Manage Users', 'bi-people');
    UI.contentArea.innerHTML = UI.renderSpinner();
    const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'user')));
    let html = '<div class="list-group list-group-flush content-load-animation">';
    if (usersSnap.empty) {
        html += '<div class="list-group-item bg-transparent text-muted">No users found.</div>';
    } else {
        usersSnap.forEach(docSnap => {
            const user = docSnap.data(), userId = docSnap.id;
            html += `<div class="list-group-item d-md-flex justify-content-between align-items-center bg-transparent"><div>${user.email}<br><small class="text-muted">Wallet: ₹${(user.walletBalance || 0).toFixed(2)}</small></div><div class="d-flex align-items-center mt-2 mt-md-0"><input type="number" id="money-${userId}" class="form-control form-control-sm" style="width: 100px;" placeholder="Amt"><button class="btn btn-sm btn-success ms-2" onclick="G_Market.owner_updateWallet(this,'${userId}','add')">+</button><button class="btn btn-sm btn-warning ms-1" onclick="G_Market.owner_updateWallet(this,'${userId}','minus')">-</button><button class="btn btn-sm btn-info ms-2" onclick="G_Market.owner_changeUserRole('${userId}', 'admin')">Promote</button></div></div>`;
        });
    }
    html += '</div>';
    UI.contentArea.innerHTML = `<div class="card">${html}</div>`;
}

export async function owner_updateWallet(btn, userId, operation) {
    btn.disabled = true;
    UI.showLoader();
    let amount = parseFloat(document.getElementById(`money-${userId}`).value);
    if (isNaN(amount) || amount <= 0) { UI.showToast('Enter valid amount.', 'error'); UI.showLoader(false); btn.disabled = false; return; }
    const userRef = doc(db, 'users', userId);
    try {
        await runTransaction(db, async t => {
            const finalAmount = operation === 'minus' ? -amount : amount;
            t.update(userRef, { walletBalance: increment(finalAmount) });
            t.set(doc(collection(userRef, 'transactions')), { type: 'adjustment', amount: finalAmount, reason: 'Owner adjustment', date: serverTimestamp() });
        });
        UI.showToast('Wallet updated!', 'success');
        G_Market.owner_viewUsers();
    } catch (e) {
        UI.showToast(e.message, 'error');
        btn.disabled = false;
    } finally {
        UI.showLoader(false);
    }
}

export async function owner_viewAdmins() {
    UI.showBackButton('profile');
    UI.setContentTitleHTML('Manage Admins', 'bi-person-gear');
    UI.contentArea.innerHTML = UI.renderSpinner();
    const adminsSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
    let html = '<ul class="list-group list-group-flush content-load-animation">';
    if (adminsSnap.empty) {
        html += '<li class="list-group-item text-muted bg-transparent">No admins found.</li>';
    } else {
        adminsSnap.forEach(docSnap => {
            html += `<li class="list-group-item bg-transparent d-flex justify-content-between align-items-center">${docSnap.data().email}<button class="btn btn-sm btn-warning" onclick="G_Market.owner_changeUserRole('${docSnap.id}', 'user')">Demote to User</button></li>`;
        });
    }
    html += '</ul>';
    UI.contentArea.innerHTML = `<div class="card">${html}</div>`;
}

export function owner_changeUserRole(userId, newRole) {
    const friendlyRole = newRole.charAt(0).toUpperCase() + newRole.slice(1);
    UI.showConfirmModal(`Change Role to ${friendlyRole}?`, `Are you sure you want to change this user's role to ${friendlyRole}?`, async () => {
        UI.showLoader();
        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            UI.showToast('User role updated successfully!', 'success');
            if (newRole === 'admin') {
                G_Market.owner_viewUsers();
            } else {
                G_Market.owner_viewAdmins();
            }
        } catch (e) {
            UI.showToast(`Error: ${e.message}`, 'error');
        } finally {
            UI.showLoader(false);
        }
    });
}

export async function owner_paymentSettings() {
    UI.showBackButton('profile');
    UI.setContentTitleHTML('Payment & Contact Details', 'bi-credit-card');
    const docSnap = await getDoc(doc(db, 'ownerDetails', 'config'));
    const details = docSnap.exists() ? docSnap.data() : {};
    UI.contentArea.innerHTML = `<div class="card content-load-animation"><div class="card-body"><div class="mb-3"><label class="form-label">UPI ID</label><input id="upi-input" class="form-control" value="${details.upiId || ''}" placeholder="your-upi@ybl"></div><div class="mb-3"><label class="form-label">PhonePe Number</label><input id="phonepe-input" class="form-control" value="${details.phonePe || ''}" placeholder="9123456789"></div><div class="mb-3"><label class="form-label">GPay Number</label><input id="gpay-input" class="form-control" value="${details.gPay || ''}" placeholder="9123456789"></div><div class="mb-3"><label class="form-label">Paytm Number</label><input id="paytm-input" class="form-control" value="${details.paytm || ''}" placeholder="9123456789"></div><button class="btn btn-primary" onclick="G_Market.owner_savePaymentDetails(this)">Save Details</button></div></div>`;
}

export async function owner_savePaymentDetails(btn) {
    btn.disabled = true;
    UI.showLoader();
    const data = { upiId: document.getElementById('upi-input').value, phonePe: document.getElementById('phonepe-input').value, gPay: document.getElementById('gpay-input').value, paytm: document.getElementById('paytm-input').value };
    try {
        await setDoc(doc(db, 'ownerDetails', 'config'), data);
        UI.showToast('Details updated successfully!', 'success');
    } catch (e) {
        UI.showToast(`Error: ${e.message}`, 'error');
    } finally {
        UI.showLoader(false);
        btn.disabled = false;
    }
}