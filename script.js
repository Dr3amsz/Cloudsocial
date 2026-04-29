// Database simulation using localStorage
const DB = {
    users: 'cloudsocial_users',
    posts: 'cloudsocial_posts',
    currentUser: 'cloudsocial_current_user'
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

function initializeApp() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        showAuthenticatedUI();
        loadFeed();
        loadProfile();
    } else {
        showUnauthenticatedUI();
        showPage('landing');
    }
}

function setupEventListeners() {
    // Register Form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // Login Form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Create Post Form
    const createPostForm = document.getElementById('createPostForm');
    if (createPostForm) {
        createPostForm.addEventListener('submit', handleCreatePost);
    }

    // Edit Profile Form
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', handleEditProfile);
    }

    // Post Image Preview
    const postImageInput = document.getElementById('postImage');
    if (postImageInput) {
        postImageInput.addEventListener('change', previewPostImage);
    }
}

// Page Navigation
function showPage(pageName) {
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.remove('active'));

    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // Close mobile menu if open
    const navbarCollapse = document.querySelector('.navbar-collapse');
    if (navbarCollapse && navbarCollapse.classList.contains('show')) {
        const bsCollapse = new bootstrap.Collapse(navbarCollapse);
        bsCollapse.hide();
    }

    // Scroll to top
    window.scrollTo(0, 0);
}

// UI State Management
function showAuthenticatedUI() {
    document.getElementById('navHome').classList.remove('d-none');
    document.getElementById('navProfile').classList.remove('d-none');
    document.getElementById('navLogout').classList.remove('d-none');
    document.getElementById('navLogin').classList.add('d-none');
    document.getElementById('navRegister').classList.add('d-none');

    const user = getCurrentUser();
    updateUserUI(user);
    showPage('feed');
}

function showUnauthenticatedUI() {
    document.getElementById('navHome').classList.add('d-none');
    document.getElementById('navProfile').classList.add('d-none');
    document.getElementById('navLogout').classList.add('d-none');
    document.getElementById('navLogin').classList.remove('d-none');
    document.getElementById('navRegister').classList.remove('d-none');
}

function updateUserUI(user) {
    // Update sidebar
    const sidebarImg = document.getElementById('sidebarProfileImg');
    const sidebarName = document.getElementById('sidebarUserName');
    const sidebarEmail = document.getElementById('sidebarUserEmail');
    const createPostImg = document.getElementById('createPostProfileImg');

    const profileImg = user.profilePhoto || generateAvatar(user.name);
    
    if (sidebarImg) sidebarImg.src = profileImg;
    if (sidebarName) sidebarName.textContent = user.name;
    if (sidebarEmail) sidebarEmail.textContent = user.email;
    if (createPostImg) createPostImg.src = profileImg;

    // Update post count
    const posts = getUserPosts(user.id);
    const postCount = document.getElementById('postCount');
    if (postCount) postCount.textContent = posts.length;
}

// Authentication Functions
function handleRegister(e) {
    e.preventDefault();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim().toLowerCase();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    // Validation
    if (password.length < 6) {
        showNotification('Password minimal 6 karakter!', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Password tidak cocok!', 'error');
        return;
    }

    // Check if email already exists
    const users = getUsers();
    if (users.find(u => u.email === email)) {
        showNotification('Email sudah terdaftar!', 'error');
        return;
    }

    // Create new user
    const newUser = {
        id: generateId(),
        name: name,
        email: email,
        password: password, // In production, hash this!
        profilePhoto: generateAvatar(name),
        bio: '',
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);

    showNotification('Registrasi berhasil! Silakan login.', 'success');
    document.getElementById('registerForm').reset();
    showPage('login');
}

function handleLogin(e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        setCurrentUser(user);
        showNotification('Selamat datang, ' + user.name + '! 🎉', 'success');
        document.getElementById('loginForm').reset();
        showAuthenticatedUI();
        loadFeed();
    } else {
        showNotification('Email atau password salah!', 'error');
    }
}

function logout() {
    if (confirm('Yakin ingin keluar?')) {
        localStorage.removeItem(DB.currentUser);
        showNotification('Berhasil keluar. Sampai jumpa! 👋', 'success');
        showUnauthenticatedUI();
        showPage('landing');
    }
}

// Post Functions
function openCreatePostModal(type) {
    const modal = new bootstrap.Modal(document.getElementById('createPostModal'));
    modal.show();
    
    document.getElementById('postContent').focus();
}

function handleCreatePost(e) {
    e.preventDefault();

    const content = document.getElementById('postContent').value.trim();
    const imageFile = document.getElementById('postImage').files[0];

    if (!content && !imageFile) {
        showNotification('Postingan tidak boleh kosong!', 'error');
        return;
    }

    const currentUser = getCurrentUser();
    const post = {
        id: generateId(),
        userId: currentUser.id,
        userName: currentUser.name,
        userPhoto: currentUser.profilePhoto,
        content: content,
        image: null,
        likes: 0,
        comments: [],
        createdAt: new Date().toISOString()
    };

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            post.image = e.target.result;
            savePost(post);
            finishCreatePost();
        };
        reader.readAsDataURL(imageFile);
    } else {
        savePost(post);
        finishCreatePost();
    }
}

function finishCreatePost() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('createPostModal'));
    modal.hide();
    document.getElementById('createPostForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    showNotification('Postingan berhasil dibuat! 🎉', 'success');
    loadFeed();
    loadProfile();
    updateUserUI(getCurrentUser());
}

function previewPostImage(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('imagePreview');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 100%; border-radius: 12px;">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

function savePost(post) {
    const posts = getPosts();
    posts.unshift(post);
    localStorage.setItem(DB.posts, JSON.stringify(posts));
}

function loadFeed() {
    const postsContainer = document.getElementById('postsContainer');
    if (!postsContainer) return;

    const posts = getPosts();

    if (posts.length === 0) {
        postsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h5>Belum ada postingan</h5>
                <p class="text-muted">Jadilah yang pertama membuat postingan!</p>
            </div>
        `;
        return;
    }

    postsContainer.innerHTML = posts.map(post => createPostHTML(post)).join('');
}

function createPostHTML(post) {
    const timeAgo = getTimeAgo(post.createdAt);
    const currentUser = getCurrentUser();
    const isOwnPost = currentUser && post.userId === currentUser.id;

    return `
        <div class="post-card" data-post-id="${post.id}">
            <div class="post-header">
                <img src="${post.userPhoto}" alt="${post.userName}" class="profile-img-small">
                <div class="flex-grow-1">
                    <h6 class="mb-0">${post.userName}</h6>
                    <small class="text-muted post-time">${timeAgo}</small>
                </div>
                ${isOwnPost ? `<button class="btn btn-sm btn-light" onclick="deletePost('${post.id}')">🗑️</button>` : ''}
            </div>
            <div class="post-content">
                <p>${escapeHtml(post.content)}</p>
            </div>
            ${post.image ? `<img src="${post.image}" alt="Post image" class="post-image">` : ''}
            <div class="post-actions">
                <button class="post-action-btn" onclick="likePost('${post.id}')">
                    ❤️ ${post.likes} Suka
                </button>
                <button class="post-action-btn">
                    💬 ${post.comments.length} Komentar
                </button>
                <button class="post-action-btn">
                    🔄 Bagikan
                </button>
            </div>
        </div>
    `;
}

function likePost(postId) {
    const posts = getPosts();
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.likes++;
        localStorage.setItem(DB.posts, JSON.stringify(posts));
        loadFeed();
        showNotification('❤️', 'success');
    }
}

function deletePost(postId) {
    if (confirm('Hapus postingan ini?')) {
        let posts = getPosts();
        posts = posts.filter(p => p.id !== postId);
        localStorage.setItem(DB.posts, JSON.stringify(posts));
        loadFeed();
        loadProfile();
        updateUserUI(getCurrentUser());
        showNotification('Postingan dihapus', 'success');
    }
}

// Profile Functions
function loadProfile() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Update profile page
    const profileImg = document.getElementById('profileImg');
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profileBio = document.getElementById('profileBio');

    if (profileImg) profileImg.src = currentUser.profilePhoto || generateAvatar(currentUser.name);
    if (profileName) profileName.textContent = currentUser.name;
    if (profileEmail) profileEmail.textContent = currentUser.email;
    if (profileBio) profileBio.textContent = currentUser.bio || 'Belum ada bio';

    // Load user's posts
    const profilePostsContainer = document.getElementById('profilePostsContainer');
    if (!profilePostsContainer) return;

    const userPosts = getUserPosts(currentUser.id);

    if (userPosts.length === 0) {
        profilePostsContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📝</div>
                <h5>Belum ada postingan</h5>
                <p class="text-muted">Mulai berbagi cerita Anda!</p>
            </div>
        `;
        return;
    }

    profilePostsContainer.innerHTML = userPosts.map(post => createPostHTML(post)).join('');
}

function openEditProfileModal() {
    const currentUser = getCurrentUser();
    document.getElementById('editName').value = currentUser.name;
    document.getElementById('editBio').value = currentUser.bio || '';

    const modal = new bootstrap.Modal(document.getElementById('editProfileModal'));
    modal.show();
}

function handleEditProfile(e) {
    e.preventDefault();

    const name = document.getElementById('editName').value.trim();
    const bio = document.getElementById('editBio').value.trim();

    const currentUser = getCurrentUser();
    const users = getUsers();
    const userIndex = users.findIndex(u => u.id === currentUser.id);

    if (userIndex !== -1) {
        users[userIndex].name = name;
        users[userIndex].bio = bio;
        saveUsers(users);
        setCurrentUser(users[userIndex]);

        // Update all posts with new name
        const posts = getPosts();
        posts.forEach(post => {
            if (post.userId === currentUser.id) {
                post.userName = name;
            }
        });
        localStorage.setItem(DB.posts, JSON.stringify(posts));

        const modal = bootstrap.Modal.getInstance(document.getElementById('editProfileModal'));
        modal.hide();

        showNotification('Profil berhasil diperbarui! ✨', 'success');
        loadProfile();
        loadFeed();
        updateUserUI(users[userIndex]);
    }
}

function uploadProfilePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const currentUser = getCurrentUser();
        const users = getUsers();
        const userIndex = users.findIndex(u => u.id === currentUser.id);

        if (userIndex !== -1) {
            users[userIndex].profilePhoto = event.target.result;
            saveUsers(users);
            setCurrentUser(users[userIndex]);

            // Update all posts with new photo
            const posts = getPosts();
            posts.forEach(post => {
                if (post.userId === currentUser.id) {
                    post.userPhoto = event.target.result;
                }
            });
            localStorage.setItem(DB.posts, JSON.stringify(posts));

            showNotification('Foto profil berhasil diperbarui! 📷', 'success');
            loadProfile();
            loadFeed();
            updateUserUI(users[userIndex]);
        }
    };
    reader.readAsDataURL(file);
}

// Helper Functions
function getUsers() {
    const users = localStorage.getItem(DB.users);
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem(DB.users, JSON.stringify(users));
}

function getCurrentUser() {
    const user = localStorage.getItem(DB.currentUser);
    return user ? JSON.parse(user) : null;
}

function setCurrentUser(user) {
    localStorage.setItem(DB.currentUser, JSON.stringify(user));
}

function getPosts() {
    const posts = localStorage.getItem(DB.posts);
    return posts ? JSON.parse(posts) : [];
}

function getUserPosts(userId) {
    const posts = getPosts();
    return posts.filter(p => p.userId === userId);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateAvatar(name) {
    // Generate a colorful avatar with initials
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substr(0, 2);
    const colors = ['#5AADCE', '#7FC3DC', '#4A9FC4', '#B8E0ED'];
    const bgColor = colors[Math.floor(Math.random() * colors.length)];
    
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 200, 200);
    
    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, 100, 100);
    
    return canvas.toDataURL();
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Baru saja';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' menit lalu';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' jam lalu';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' hari lalu';
    
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? '#4A9FC4' : type === 'error' ? '#e74c3c' : '#5AADCE'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.2);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        font-weight: 500;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
