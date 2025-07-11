import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import * as UI from './ui.js';

let currentUserData;
export const setCurrentUser = (user) => {
    currentUserData = user;
};

export function admin_showSection(section) {
    UI.showBackButton('profile');
    if (section === 'create-post') {
        UI.setContentTitleHTML('Create New Post', 'bi-plus-square');
        UI.contentArea.innerHTML = `<div class="card content-load-animation"><div class="card-body"><form id="create-post-form"><input type="text" id="post-name" placeholder="Game/Hack Name" class="form-control mb-3" required><textarea id="post-info" placeholder="Information" class="form-control mb-3"></textarea><input type="number" id="post-price" placeholder="Price (0 for Free/Demo)" class="form-control mb-3" required><input type="text" id="post-image-url" placeholder="Image URL" class="form-control mb-3"><input type="text" id="post-download-url" placeholder="Download URL" class="form-control mb-3" required><select id="post-type" class="form-select mb-3"><option value="gamePosts">Paid Game/Hack</option><option value="freeHacks">Free/Demo Hack</option></select><button type="button" onclick="G_Market.admin_handlePostUpload(this)" class="btn btn-primary">Upload Post</button></form></div></div>`;
    }
    if (section === 'my-posts') {
        UI.setContentTitleHTML('My Posts', 'bi-list-task');
        G_Market.admin_viewMyPosts();
    }
    if (section === 'request-id') {
        UI.setContentTitleHTML('Sell Account', 'bi-tag');
        UI.contentArea.innerHTML = `<div class="card content-load-animation"><div class="card-body"><form id="request-id-form"><p class="text-muted small">Submit an account for sale. The owner will review it.</p><input type="text" id="req-game-name" placeholder="Game Name" class="form-control mb-2" required><input type="text" id="req-id" placeholder="Game ID / Username" class="form-control mb-2" required><input type="text" id="req-pass" placeholder="Password" class="form-control mb-2" required><input type="text" id="req-image-url" placeholder="Image URL (optional)" class="form-control mb-2"><input type="number" id="req-price" placeholder="Asking Price" class="form-control mb-2" required><select id="sell-status" class="form-select mb-3"><option value="Fresh">Fresh</option><option value="Reuse">Re-used</option></select><button type="button" onclick="G_Market.admin_handleIdRequest(this)" class="btn btn-primary">Send Request</button></form></div></div>`;
    }
}

export async function admin_handlePostUpload(btn) {
    btn.disabled = true;
    UI.showLoader();
    const data = { name: document.getElementById('post-name').value, info: document.getElementById('post-info').value, imageUrl: document.getElementById('post-image-url').value, downloadUrl: document.getElementById('post-download-url').value, price: parseFloat(document.getElementById('post-price').value) || 0, postedBy: currentUserData.uid, createdAt: serverTimestamp() };
    if (!data.name || !data.downloadUrl) { UI.showToast('Name and URL required!', 'error'); UI.showLoader(false); btn.disabled = false; return; };
    try {
        await addDoc(collection(db, document.getElementById('post-type').value), data);
        UI.showToast('Post uploaded!', 'success');
        G_Market.showProfileView();
    } catch (e) {
        UI.showToast(e.message, 'error');
        btn.disabled = false;
    } finally {
        UI.showLoader(false);
    }
}

export async function admin_viewMyPosts() {
    UI.contentArea.innerHTML = UI.renderSpinner();
    const postsSnap = await getDocs(query(collection(db, 'gamePosts'), where('postedBy', '==', currentUserData.uid)));
    const hacksSnap = await getDocs(query(collection(db, 'freeHacks'), where('postedBy', '==', currentUserData.uid)));
    let html = '<div class="content-load-animation">';
    const render = (snap, type, coll) => {
        if (snap.empty) return;
        html += `<h5 class="mt-3 section-heading">${type} Posts</h5><div class="list-group list-group-flush mb-3">`;
        snap.forEach(docSnap => {
            const post = docSnap.data();
            html += `<div class="list-group-item d-flex justify-content-between align-items-center bg-transparent">${post.name} - ₹${post.price}<button class="btn btn-sm btn-danger" onclick="G_Market.admin_deletePost(this,'${coll}','${docSnap.id}')"><i class="bi bi-trash"></i></button></div>`;
        });
        html += '</div>';
    };
    render(postsSnap, 'Paid', 'gamePosts');
    render(hacksSnap, 'Free', 'freeHacks');
    html += '</div>';
    UI.contentArea.innerHTML = html.length > 50 ? `<div class="card">${html}</div>` : '<p class="text-muted content-load-animation">You have no posts.</p>';
}

export function admin_deletePost(btn, coll, id) {
    UI.showConfirmModal('Confirm Deletion', 'Are you sure? This is permanent.', async () => {
        btn.disabled = true;
        UI.showLoader();
        try {
            await deleteDoc(doc(db, coll, id));
            UI.showToast('Post deleted!', 'success');
            G_Market.admin_viewMyPosts();
        } catch (e) {
            UI.showToast(e.message, 'error');
        } finally {
            UI.showLoader(false);
        }
    });
}

export async function admin_handleIdRequest(btn) {
    btn.disabled = true;
    UI.showLoader();
    const data = { type: 'accountSell', userId: currentUserData.uid, userEmail: currentUserData.email, accountDetails: { gameName: document.getElementById('req-game-name').value, id: document.getElementById('req-id').value, password: document.getElementById('req-pass').value, imageUrl: document.getElementById('req-image-url').value, price: parseFloat(document.getElementById('req-price').value), accountStatus: document.getElementById('sell-status').value }, status: 'pending', createdAt: serverTimestamp() };
    if (!data.accountDetails.gameName || !data.accountDetails.id || !data.accountDetails.password || isNaN(data.accountDetails.price)) { UI.showToast('Please fill required fields.', 'error'); UI.showLoader(false); btn.disabled = false; return; }
    try {
        await addDoc(collection(db, 'requests'), data);
        UI.showToast('Sell request sent!', 'success');
        G_Market.showProfileView();
    } catch (e) {
        UI.showToast(e.message, 'error');
    } finally {
        UI.showLoader(false);
    }
}