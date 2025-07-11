export const loaderOverlay = document.getElementById('loader-overlay');
export const loginSection = document.getElementById('login-section');
export const panelsWrapper = document.getElementById('panels-wrapper');
export const contentTitle = document.getElementById('content-title');
export const contentArea = document.getElementById('content-area');
export const subNavArea = document.getElementById('sub-nav-area');
export const bottomNav = document.getElementById('bottom-nav');

let confirmModalInstance = null; // To hold the modal instance

export const showLoader = (show = true) => { loaderOverlay.style.display = show ? 'flex' : 'none'; };
export const showPanel = (panel) => { 
    document.querySelectorAll('.panel').forEach(p => p.style.display = 'none'); 
    bottomNav.style.display = 'none'; 
    if (panel) { 
        panel.style.display = 'block'; 
        if (panel.id === 'panels-wrapper') { 
            bottomNav.style.display = 'flex'; 
        } 
    } 
};
export const setActiveNav = (activeBtnId) => { 
    document.querySelectorAll('#bottom-nav .nav-btn').forEach(btn => btn.classList.remove('active')); 
    document.getElementById(activeBtnId)?.classList.add('active'); 
};
export const setContentTitleHTML = (title, icon) => { 
    contentTitle.innerHTML = `<h2 class="section-heading"><i class="bi ${icon} me-3" style="color:var(--primary-color)"></i>${title}</h2>`; 
    contentTitle.style.display = 'block'; 
};
export const renderSpinner = () => { 
    return '<div class="text-center mt-5"><div class="spinner-border" style="color:var(--primary-color); width: 3rem; height: 3rem;" role="status"></div></div>'; 
};
export const showBackButton = (targetView) => { 
    const backText = targetView === 'home' ? 'Home' : 'Profile'; 
    const backFunction = targetView === 'home' ? 'G_Market.showHomeView()' : 'G_Market.showProfileView()'; 
    subNavArea.innerHTML = `<button class="btn btn-sm btn-outline-secondary mb-3" onclick="${backFunction}"><i class="bi bi-arrow-left me-2"></i>Back to ${backText}</button>`; 
};
export const showToast = (message, type = 'info') => { 
    const container = document.getElementById('toast-container'); 
    const toast = document.createElement('div'); 
    toast.className = `toast-item ${type}`; 
    toast.innerHTML = `<i class="bi ${type === 'success' ? 'bi-check-circle-fill' : type === 'error' ? 'bi-x-octagon-fill' : 'bi-info-circle-fill'} me-2"></i> ${message}`; 
    container.appendChild(toast); 
    setTimeout(() => { 
        toast.style.animation = 'none'; 
        toast.style.opacity = '0'; 
        setTimeout(() => toast.remove(), 500); 
    }, 3500); 
};
export const showConfirmModal = (title, body, onConfirm) => {
    if (!confirmModalInstance) {
        confirmModalInstance = new bootstrap.Modal(document.getElementById('confirmModal'));
    }
    document.getElementById('confirmModalTitle').textContent = title; 
    document.getElementById('confirmModalBody').textContent = body; 
    const confirmBtn = document.getElementById('confirmModalBtn'); 
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    newConfirmBtn.addEventListener('click', () => { 
        onConfirm(); 
        confirmModalInstance.hide(); 
    }); 
    confirmModalInstance.show(); 
};