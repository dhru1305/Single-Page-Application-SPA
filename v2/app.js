// Main app container
const app = document.getElementById('web-app');

// Overall app state
let state = {
  user: null,
  posts: [],
  lastBackup: null
};

// Arrays to store posts/pages data
let webPostsData = [];
let webPagesData = [];

// SPA route mapping
const ROUTES = {
  '#/home': renderHome,
  '#/posts': renderPosts,
  '#/admin': renderAdmin,
  '#/settings': renderSettings
};

// Admin login credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: '1234'
};

// Utility: clear the entire app container #helper
function clearApp() {
  while (app.firstChild) app.removeChild(app.firstChild);
}

// Backup webPostsData to localStorage #helper
function backup() {
  state.lastBackup = new Date().toISOString();
  localStorage.setItem('web-posts-data', JSON.stringify(webPostsData));
  console.log('💾 Backup completed:', state.lastBackup);
}

// Load initial state from storage on app start #helper
function loadBackup() {
  const saved = localStorage.getItem('web-posts-data');
  const user = localStorage.getItem('user');
  const settings = loadSettings();

  if (saved) state.posts = JSON.parse(saved);
  if (user) state.user = user;

  if (settings.theme) {
    document.body.dataset.theme = settings.theme;
  }
}

// Load webPostsData and webPagesData from localStorage #helper
function loadWebContentData() {
  const posts = localStorage.getItem('web-posts-data');
  const pages = localStorage.getItem('web-pages-data');

  webPostsData = posts ? JSON.parse(posts) : [];
  webPagesData = pages ? JSON.parse(pages) : [];
}



// Authentication: handle login based on credentials #helper
function login(username, password) {
  const errorMsg = document.getElementById('login-error');
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
  state.user = 'admin';
  localStorage.setItem('user', 'admin');
  closeLoginModal();
  location.hash = '#/admin';
 notifyUser('success', {
  title: 'Admin Logged In',
  body: 'Welcome back, Admin!'
});

} else {
    if (errorMsg) errorMsg.innerHTML = '<span class="material-icons">close</span> Incorrect Username/Password';
    showToast("Login failed: incorrect Username/Password", "warning");
  }
}

// Logout current user #helper
function logout() {
  state.user = null;
  localStorage.removeItem('user');
  location.hash = '#/home';
}

// Show login modal #helper
function openLoginModal() {
  document.getElementById('login-modal').classList.remove('hidden');
}

// Hide login modal and reset form #helper
function closeLoginModal() {
  const modal = document.getElementById('login-modal');
  modal.classList.add('hidden');
  document.getElementById('login-error').textContent = '';
  document.getElementById('login-username').value = '';
  document.getElementById('login-password').value = '';
}

// Generate the site's navigation bar #helper
function createNavbar() {
  const nav = document.createElement('nav');
  let navContent = `
    <a href="#/home"><span class="material-icons">home</span> Home</a>
    <a href="#/posts"><span class="material-icons">description</span> Posts</a>
  `;

  if (state.user === 'admin') {
    navContent += `
      <a href="#/admin"><span class="material-icons">admin_panel_settings</span> Admin</a>
      <a href="#/settings"><span class="material-icons">settings</span> Settings</a>
      <a href="#" onclick="logout()"><span class="material-icons">logout</span> Logout</a>
    `;
  } else {
    navContent += `<button onclick="openLoginModal()"><span class="material-icons">login</span> Login</button>`;
  }

  nav.innerHTML = navContent;
  return nav;
}

// Generate footer showing last backup timestamp #helper
function createFooter() {
  const footer = document.createElement('footer');
  footer.innerHTML = `<small>Dynamic Site | Last Backup: ${state.lastBackup || 'Never'}</small>`;
  return footer;
}

// Render home page content #helper
function renderHome() {
  clearApp();
  const fragment = document.createDocumentFragment();
  fragment.appendChild(createNavbar());

  const section = document.createElement('section');
  section.id = 'page-home';
  section.innerHTML = `
    <h2>Welcome to the Dynamic WebApp</h2>
    <p>This is a one-page site with admin and SPA support.</p>
  `;

  fragment.appendChild(section);
  fragment.appendChild(createFooter());
  app.appendChild(fragment);
}

// Render list of posts page #helper
function renderPosts() {
  clearApp();
  const fragment = document.createDocumentFragment();
  fragment.appendChild(createNavbar());

  const section = document.createElement('section');
  section.id = 'page-posts';
  section.innerHTML = `<h2>Posts</h2>`;

  if (webPostsData.length === 0) {
    section.innerHTML += `<p>No posts yet.</p>`;
  } else {
    webPostsData.forEach(post => {
      const div = document.createElement('div');
      div.className = 'post';
      div.innerHTML = `<h3>${post.title}</h3><p>${post.content}</p>`;
      section.appendChild(div);
    });
  }

  fragment.appendChild(section);
  fragment.appendChild(createFooter());
  app.appendChild(fragment);
}

// Render settings page (admin only) #helper
function renderSettings() {
  if (state.user !== 'admin') return renderHome();

  clearApp();
  const fragment = document.createDocumentFragment();
  fragment.appendChild(createNavbar());

  const settings = loadSettings();
  const section = document.createElement('section');
  section.id = 'page-settings';
  section.innerHTML = `
    <h2><span class="material-icons">settings</span> Settings</h2>
    <label>App Title: <input id="app-title" type="text" value="${settings.title}" /></label><br><br>
    <label>
      Theme:
      <select id="theme-select">
        <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
        <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
      </select>
    </label><br><br>
    <label>
      <input type="checkbox" id="auto-backup" ${settings.autoBackup ? 'checked' : ''} />
      Enable Auto Backup
    </label><br><br>
    <button onclick="saveSettings()"><span class="material-icons">save</span> Save Settings</button>
  `;

  fragment.appendChild(section);
  fragment.appendChild(createFooter());
  app.appendChild(fragment);
}

// Load app settings from localStorage or use defaults #helper
function loadSettings() {
  const saved = localStorage.getItem('settings');
  return saved
    ? JSON.parse(saved)
    : { title: 'Dynamic WebApp', theme: 'light', autoBackup: false };
}

// Save settings and apply theme #helper
function saveSettings() {
  const settings = {
    title: document.getElementById('app-title').value,
    theme: document.getElementById('theme-select').value,
    autoBackup: document.getElementById('auto-backup').checked
  };
  localStorage.setItem('settings', JSON.stringify(settings));
  document.body.dataset.theme = settings.theme;
  showToast('Settings saved', 'success');
}


function renderAdmin() {
  if (state.user !== 'admin') return renderLogin();

  loadWebContentData();
  clearApp();

  const fragment = document.createDocumentFragment();
  fragment.appendChild(createNavbar());

  const section = document.createElement('section');
  section.id = 'page-admin';

  const tabSelector = document.createElement('div');
  tabSelector.className = 'admin-tabs';
  tabSelector.innerHTML = `
    <button onclick="renderAdminView('post')" id="tab-post">📝 Posts</button>
    <button onclick="renderAdminView('page')" id="tab-page">📄 Pages</button>
    <button onclick="openNewContentMenu()" class="new-content-btn">➕ New Content</button>
  `;
  section.appendChild(tabSelector);

  const adminList = createAdminSection('post');
  section.appendChild(adminList);

  fragment.appendChild(section);
  fragment.appendChild(createFooter());
  app.appendChild(fragment);
}

function renderAdminView(type) {
  const section = document.querySelector('#admin-list-section');
  if (section) section.remove();

  const newSection = createAdminSection(type);
  document.querySelector('#page-admin').appendChild(newSection);

  document.getElementById('tab-post').classList.toggle('active', type === 'post');
  document.getElementById('tab-page').classList.toggle('active', type === 'page');
}

function createAdminSection(type) {
  const dataArray = type === 'post' ? webPostsData : webPagesData;
  const section = document.createElement('div');
  section.id = 'admin-list-section';
  section.innerHTML = `<h2>${capitalize(type)}s</h2>`;

  if (!dataArray.length) {
    section.innerHTML += `<p>No ${type}s yet.</p>`;
  } else {
    dataArray.forEach((entry, index) => {
      section.appendChild(createPostBlock(entry, index, type));
    });
  }

  return section;
}

function createPostBlock(entry, index, type) {
  const div = document.createElement('div');
  div.className = 'post';
  div.innerHTML = `
    <h3>${entry.title}</h3>
    <p>${entry.content}</p>
    <small>📅 ${entry.date || 'N/A'} | Priority: ${entry.priority} | By: ${entry.createdBy}</small><br>
    <button onclick="editContent('${type}', ${index})"><span class="material-icons">edit</span> Edit</button>
    <button onclick="deleteContent('${type}', ${index})"><span class="material-icons">delete</span> Delete</button>
  `;
  return div;
}

function openNewContentMenu() {
  closeModal();
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>Create New Content</h2>
      <button class="new-post-btn" onclick="openContentForm('post')">📝 New Post</button>
      <button class="new-page-btn" onclick="openContentForm('page')">📄 New Page</button>
      <button class="new-page-cnl-btn" onclick="closeModal()">Cancel</button>
    </div>`;
  document.body.appendChild(modal);
}

function openContentForm(type) {
  closeModal();

  const modal = document.createElement('div');
  modal.className = 'form-body';

  let formHTML = '';

  if (type === 'post') {
    formHTML = `
    
   <!-- Popup Wrapper -->
<div class="popup-overlay">
  <div class="popup-modal">
    
    <!-- Modal Header -->
    <div class="top">
      <h1>Create Post</h1>
      <button type="button" onclick="closePopupModal()">Cancel</button>
    </div>

    <!-- Form -->
    <form onsubmit="submitPopupForm(event, '${type}')">
      
      <!-- Grid Body -->
      <div class="popup-body">

        <!-- Left Column -->
       <div class="left-from-cont">
         <div class="details-left">
          <h2>Create Blog Post</h2>
          <div id="top-nav-from"></div>

          <div class="details-form">
            <div class="form-title">
              <label>Title:<br>
                <input type="text" id="modal-title" required />
              </label>
            </div>

            <div class="form-description">
              <label>Description:<br>
                <input type="text" id="modal-description" required />
              </label>
            </div>

            <div class="form-thumbnail">
                <label>Thumbnail:<br>
              <h5>Set a thumbnail that stands out and draws viewers' attention.</h5>

                <input type="file" id="modal-thumbnail" />
              </label>
            </div>

            <div class="post-settings-left">
              <div class="pin-post">
                <label>Pin Post:<br>
                  <select id="modal-pin">
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </label>
              </div>

              <div class="post-category">
                <h3 class="post-setting-sub-titles">Category</h3>
                <label>Category:<br>
                  <input type="text" id="modal-category" />
                </label>
              </div>

              <div class="post-tags">
                <h3 class="post-setting-sub-titles">Tags</h3>
                <label>Tags (comma-separated):<br>
                  <input type="text" id="modal-tags" />
                </label>
              </div>

              <div class="post-author">
                <h3 class="post-setting-sub-titles">Post Author</h3>
                <label>Author:<br>
                  <input type="text" id="modal-author" />
                </label>
              </div>

              <div class="post-alt">
                <h3 class="post-setting-sub-titles">Post Alt Text</h3>
                <label>Alt Text:<br>
                  <input type="text" id="modal-alt" />
                </label>
              </div>
            </div>

            <div class="finalized-left">
              <div class="post-status">
                <label>Status:<br>
                  <select id="modal-status">
                    <option value="draft">Draft</option>
                    <option value="published" selected>Published</option>
                  </select>
                </label>
              </div>

              <div class="post-date">
                <label>Post Date:<br>
                  <input type="datetime-local" id="modal-date" required />
                </label>
              </div>
            </div>
          </div>
        </div>
       </div>

        <!-- Right Column (Preview) -->
        <div class="form-right">
  <div class="preview-cont">
    <div class="prev-cont-top">
      <img src="" alt="Thumbnail Preview" id="preview-thumbnail" />
    </div>

    <div class="prev-cont-bottom">
      <h2 class="prev-title">Post Title Preview</h2>

      <div class="titel--cont">
        <div class="prve-titel-right">
          <h5 class="sml-text">Post link</h5>

          <div class="preview-field">
            <label>Slug:</label>
            <span id="preview-slug" class="prev-slug">your-post-slug</span>
          </div>

          <div class="preview-field" style="display: none;">
            <label>ID (Unique):</label>
            <span id="preview-id" class="prev-id">generated-id-123</span>
          </div>
        </div>

        <div class="prve-titel-left">
          <button type="button" class="content-copy-btn" onclick="copyToClipboard()">
            <span class="material-icons">content_copy</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>


      </div>

      <!-- Footer Navigation -->
      <div class="form-navigation">
        <div class="form-bottom-left">
          <h2>Hello</h2>
        </div>
        <div class="form-bottom-right">
          <button id="form-submit" type="submit"">Create</button>
        </div>
      </div>

    </form>
  </div>
</div>



    `;
  } else {
    formHTML = `
      <h2>Create Page</h2>
      <form onsubmit="submitPopupForm(event, '${type}')">
        <label>Title:<br><input type="text" id="modal-title" required /></label><br>
        <label>Content:<br><textarea id="modal-content" rows="4" required></textarea></label><br>
        <label>Date:<br><input type="date" id="modal-date" required /></label><br>
        <button type="submit">✅ Save Page</button>
        <button type="button" onclick="closeModal()">Cancel</button>
      </form>
    `;
  }

  modal.innerHTML = `<div class="form-body-content">${formHTML}</div>`;
  document.body.appendChild(modal);
}

function submitPopupForm(event, type) {
  event.preventDefault();

  const title = document.getElementById('modal-title')?.value.trim();
  const date = document.getElementById('modal-date')?.value;
  const description = document.getElementById('modal-description')?.value?.trim(); // post-specific
  const content = type === 'post' ? description : document.getElementById('modal-content')?.value?.trim();

  if (!title || !content || !date) {
    showToast("All fields are required!", "warning");
    return;
  }

  if (type === 'post') {
    const newPostData = {
      id: document.getElementById('preview-id')?.textContent.trim() || `post-${Date.now()}`,
      title,
      content,
      date,
      description,
      tags: document.getElementById('modal-tags')?.value.split(',').map(t => t.trim()) || [],
      author: document.getElementById('modal-author')?.value.trim(),
      pin: document.getElementById('modal-pin')?.value === 'true',
      slug: document.getElementById('preview-slug')?.textContent.trim() || title.toLowerCase().replace(/\s+/g, '-'),
      status: document.getElementById('modal-status')?.value,
      excerpt: '',
      category: document.getElementById('modal-category')?.value.trim(),
      alt: document.getElementById('modal-alt')?.value.trim(),
      metaTitle: '',
      metaDescription: '',
      comments: true,
      createdBy: state.user || "anonymous",
      timestamp: new Date().toISOString(),
      type: "post"
    };

    const result = createPostWithUniqueID(newPostData);

    if (!result.success) {
      showToast(result.message, "error");
      return;
    }

    notifyUser('success', { title: "Post Created", body: `"${title}" added.` });

  } else {
    const newPage = {
      type,
      title,
      content,
      date,
      createdBy: state.user || "anonymous",
      timestamp: new Date().toISOString(),
      priority: "created"
    };

    webPagesData.push(newPage);
    localStorage.setItem('web-pages-data', JSON.stringify(webPagesData));
    notifyUser('success', { title: "Page Created", body: `"${title}" added.` });
  }

  closeModal();
  renderAdminView(type);
}

document.getElementById('modal-title')?.addEventListener('input', e => {
  const val = e.target.value.trim().toLowerCase().replace(/\s+/g, '-');
  document.getElementById('preview-slug').textContent = val;
  document.getElementById('preview-id').textContent = `post-${Date.now()}`;
});

function copyToClipboard() {
  const slug = document.getElementById('preview-slug').textContent;
  navigator.clipboard.writeText(slug).then(() => {
    showToast("Slug copied to clipboard!", "success");
  })
}


function editContent(type, index) {
  const entry = (type === 'post' ? webPostsData : webPagesData)[index];
  openContentForm(type);
  setTimeout(() => {
    document.getElementById('modal-title').value = entry.title;
    document.getElementById('modal-content').value = entry.content;
    document.getElementById('modal-date').value = entry.date || '';
    editState = { type, index };
  }, 0);
}

function closeModal() {
  const modal = document.querySelector('.modal');
  if (modal) modal.remove();
}
function closePopupModal() {
  const modal = document.querySelector('.popup-overlay');
  if (modal) {modal.remove();}

  const formBody = document.querySelector('.form-body');
  if (formBody) {formBody.remove();}
}




function deleteContent(type, index) {
  if (!confirm(`🗑️ Are you sure you want to delete this ${type}?`)) return;

  const targetArray = type === 'post' ? webPostsData : webPagesData;
  const storageKey = type === 'post' ? 'web-posts-data' : 'web-pages-data';

  targetArray.splice(index, 1);
  localStorage.setItem(storageKey, JSON.stringify(targetArray));
  showToast(`${capitalize(type)} deleted.`, 'error');
  renderAdminView(type);
}

function createPostWithUniqueID(postData) {
  if (!Array.isArray(webPostsData)) {
    console.error("webPostsData is not initialized.");
    return { success: false, message: "Post data store is missing." };
  }

  const { id, title, content, date } = postData;

  if (!id || !title || !content || !date) {
    return { success: false, message: "Missing required fields." };
  }

  const idExists = webPostsData.some(post => post.id === id);
  if (idExists) {
    return { success: false, message: `ID "${id}" already exists.` };
  }

  const newPost = {
    ...postData,
    createdBy: state.user || "anonymous",
    timestamp: new Date().toISOString(),
    type: "post"
  };

  webPostsData.push(newPost);
  localStorage.setItem('web-posts-data', JSON.stringify(webPostsData));

  return { success: true, message: "Post added successfully.", post: newPost };
}

// Utility: Capitalize word #helper
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}



// Global Icon HTML by Type using Google Material Icons
const ICON_MAP = {
  success: '<i class="material-icons toast-success">check_circle</i>',
  error:   '<i class="material-icons toast-error">error</i>',
  warning: '<i class="material-icons toast-warning">warning</i>',
  info:    '<i class="material-icons toast-info">info</i>',
  default: '<i class="material-icons toast-default">notifications</i>'
};

// Utility: Show desktop/mobile notification #helper
function notifyUser(type, options = {}) {
  const title = options.title || capitalize(type);
  const body = options.body || '';

  const notificationOptions = {
    body,
    icon: options.icon || null
  };

  if (!("Notification" in window)) {
    showToast(`${title} - ${body}`, type);
    return;
  }

  if (Notification.permission === "granted") {
    new Notification(title, notificationOptions);
    showToast(`${title} - ${body}`, type);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, notificationOptions);
        showToast(`${title} - ${body}`, type);
      } else {
        showToast(`${title} - ${body}`, type);
      }
    });
  } else {
    showToast(`${title} - ${body}`, type);
  }
}

// Show in-app toast notification
function showToast(message, type = 'info') {
  const containerId = 'toast-container';
  let container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  // Accessibility enhancements 🎯
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  toast.setAttribute('aria-atomic', 'true');

  toast.innerHTML = `
    <span class="toast-icon">${ICON_MAP[type] || ICON_MAP.default}</span>
    <span class="toast-msg">${message}</span>
  `;

  toast.addEventListener('click', () => toast.remove());
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

// Helper to capitalize type
function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}





// Render login fallback screen #helper
function renderLogin() {
  clearApp();
  const fragment = document.createDocumentFragment();
  fragment.appendChild(createNavbar());
  const section = document.createElement('section');
  section.innerHTML = `
    <h2>Admin Login</h2>
    <p>Please click the login button in the top menu</p>
  `;
  fragment.appendChild(section);
  fragment.appendChild(createFooter());
  app.appendChild(fragment);
}

// Handle login form submission #helper
function submitLogin(event) {
  event.preventDefault();
  const user = document.getElementById('login-username').value;
  const pass = document.getElementById('login-password').value;
  login(user, pass);
}

// Main router to switch views based on hash #helper
function router() {
  const route = location.hash || '#/home';
  const renderFn = ROUTES[route] || renderHome;
  renderFn();
}

// Inject the login modal into the page #helper
function injectLoginModal() {
  const modal = document.createElement('div');
  modal.id = 'login-modal';
  modal.className = 'hidden';

  modal.innerHTML = `
    <div class="form-cont">
      <form onsubmit="submitLogin(event)" class="login-form">
        <div class="form-close-btn">
  <button type="button" class="close-btn" onclick="closeLoginModal()">
    <span class="material-icons">close</span>
  </button>
</div>

        <div class="form-header"><h3>Admin Login</h3></div>
        <div class="form-body">
          <input type="text" id="login-username" placeholder="Username" required="required" />
          <input type="password" id="login-password" placeholder="Password" required="required" />
          <p id="login-error" class="form-error"></p>
          <div class="form-actions">
            <button type="submit"><span class="material-icons">login</span> Login</button>
            <button type="button" onclick="closeLoginModal()">
              <span class="material-icons">close</span> Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
}




// --- Init sequence ---
injectLoginModal();
window.addEventListener('hashchange', router);
loadBackup();
loadWebContentData();

router();
