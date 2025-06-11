
// #1 ThemeManager: Light & Dark Mode
class ThemeManager {
  constructor(storageKey = 'theme') {
    this.storageKey = storageKey;
    this.theme = localStorage.getItem(storageKey) || 'light';
    this.apply();
  }

  toggle() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(this.storageKey, this.theme);
    this.apply();
  }

  apply() {
    document.documentElement.setAttribute('data-theme', this.theme);
  }
}

// #2 NavManager: Navigation Across Pages
class NavManager {
  constructor(app, pages = []) {
    this.app = app;
    this.pages = pages; // static and dynamic page metadata
  }

  renderNav(currentId) {
    const nav = document.createElement('nav');
    nav.className = 'main-nav';

    // Page buttons (respect showInNav if set)
    this.pages.forEach(page => {
      if (page.showInNav === false) return;

      const btn = document.createElement('button');
      btn.textContent = page.label;
      btn.onclick = () => this.app.routeManager.navigateTo(page.id);
      if (page.id === currentId) btn.disabled = true;
      nav.appendChild(btn);
    });

    // Login/Logout toggle
    const authBtn = document.createElement('button');
    const icon = document.createElement('i');
    icon.className = 'material-icons';

    if (this.app.authManager.user) {
      authBtn.textContent = 'Logout';
      icon.textContent = 'logout';
      authBtn.onclick = () => this.app.authManager.logout();
    } else {
      authBtn.textContent = 'Login';
      icon.textContent = 'login';
      authBtn.onclick = () => this.app.routeManager.navigateTo('login');
    }

    authBtn.prepend(icon);
    nav.appendChild(authBtn);

    // Theme toggle
    const themeBtn = document.createElement('button');
    themeBtn.id = 'theme-toggle';

    const themeIcon = document.createElement('i');
    themeIcon.className = 'material-icons theme-icon';

    const updateIcon = () => {
      const theme = this.app.themeManager.theme;
      themeIcon.textContent = theme === 'light' ? 'dark_mode' : 'light_mode';
      themeIcon.className = `material-icons theme-icon ${theme === 'light' ? 'moon-icon' : 'sun-icon'}`;
      themeBtn.title = theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    };

    updateIcon();

    themeBtn.appendChild(themeIcon);
    themeBtn.onclick = () => {
      this.app.themeManager.toggle();
      updateIcon();
    };

    nav.appendChild(themeBtn);

    return nav;
  }
}

// #3 AuthManager: Login & Logout Handling
class AuthManager {
  constructor(app) {
    this.app = app;
    this.user = JSON.parse(localStorage.getItem('authUser')) || null;
  }

  renderLoginPageInto(fragment = null) {
  const target = fragment || document.createDocumentFragment();

  const container = document.createElement('div');
  container.classList.add('login-container');

  const form = document.createElement('form');
  form.classList.add('login-form');

  form.innerHTML = `
    <h2>Login</h2>
    <input name="username" placeholder="Username" autocomplete="username" required />
    <input type="password" name="password" placeholder="Password" autocomplete="current-password" required />
    <div class="form-actions">
      <button type="submit">
        <i class="material-icons">login</i> Login
      </button>
    </div>
    <p class="error-msg" style="display:none;"></p>
  `;

  form.onsubmit = e => this.login(e);
  container.appendChild(form);
  target.appendChild(container);

  if (!fragment) this.app.render(target); // support legacy usage
}


  login(e) {
    e.preventDefault();
    const form = e.target;
    const username = form.username.value.trim().toLowerCase();
    const password = form.password.value;
    const errorMsg = form.querySelector('.error-msg');

    if (username === 'admin' && password === '1234') {
      this.user = { username };
      localStorage.setItem('authUser', JSON.stringify(this.user));

      // Prevent duplicate admin entry
      const hasAdmin = this.app.navManager.pages.some(p => p.id === 'admin');
      if (!hasAdmin) {
        this.app.navManager.pages.push({
          id: 'admin',
          label: 'Admin',
          renderer: 'renderAdminPage'
        });
      }

      form.reset();
      errorMsg.style.display = 'none';

      this.app.renderHomePage();
    } else {
      errorMsg.style.display = 'block';
      errorMsg.textContent = '❗ Invalid username or password';
    }
  }

  logout() {
    this.user = null;
    localStorage.removeItem('authUser');
    this.app.navManager.pages = this.app.navManager.pages.filter(p => p.id !== 'admin');
    this.app.renderHomePage();
  }
}

// #4 AdminManager: CRUD for Pages & Posts 
class AdminManager {
  constructor(app) {
    this.app = app;
  }

  renderAdminPage() {
    if (!this.app.authManager.user) return this.app.renderHomePage();

    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav('admin'));

    const title = document.createElement('h2');
    title.textContent = 'Admin Dashboard';
    frag.appendChild(title);

    const buttons = [
      { icon: 'description', label: 'Manage Pages', onClick: () => this.renderPageManager() },
      { icon: 'article', label: 'Manage Posts', onClick: () => this.renderPostManager() },
      { icon: 'edit_note', label: 'Draft Page', onClick: () => this.renderDraftPageForm() },
      { icon: 'drafts', label: 'Draft Post', onClick: () => this.renderDraftPostForm() }
    ];

    buttons.forEach(({ icon, label, onClick }) => {
      const btn = document.createElement('button');
      btn.appendChild(this.app.iconManager.icon(icon));
      btn.appendChild(document.createTextNode(` ${label}`));
      btn.onclick = onClick;
      frag.appendChild(btn);
    });

    this.app.render(frag);
  }

  renderPageManager() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav('admin'));

    const title = document.createElement('h2');
    title.textContent = 'Manage Pages';
    frag.appendChild(title);

    const list = document.createElement('div');
    this.app.pageManager.getAll().forEach((p, i) => {
      const item = document.createElement('div');
      item.innerHTML = `
        <strong>${p.title}</strong>
        <button class="edit" data-index="${i}">Edit</button>
        <button class="delete" data-index="${i}">Delete</button>
      `;
      list.appendChild(item);
    });

    const addBtn = document.createElement('button');
    addBtn.textContent = '➕ Add New Page';
    addBtn.onclick = () => this.renderPageForm();
    frag.appendChild(list);
    frag.appendChild(addBtn);

    this.app.render(frag);

    list.querySelectorAll('.edit').forEach(btn =>
      btn.onclick = () => this.renderPageForm(parseInt(btn.dataset.index))
    );
    list.querySelectorAll('.delete').forEach(btn =>
      btn.onclick = () => {
        this.app.pageManager.deletePage(parseInt(btn.dataset.index));
        this.renderPageManager();
      }
    );
  }

  renderPageForm(index = null) {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav('admin'));

    const form = document.createElement('form');
    const page = index !== null ? this.app.pageManager.getAll()[index] : { title: '', content: '', showInNav: true };

    form.innerHTML = `
      <h2>${index !== null ? 'Edit' : 'New'} Page</h2>
      <input name="title" placeholder="Title" value="${page.title}" required />
      <textarea name="content" placeholder="Content" required>${page.content}</textarea>
      <label><input type="checkbox" name="showInNav" ${page.showInNav ? 'checked' : ''}> Show in Navigation</label>
      <button type="submit">Save</button>
      <button type="button" class="cancel">Cancel</button>
    `;

    form.onsubmit = e => {
      e.preventDefault();
      const data = new FormData(form);
      const newPage = {
        title: data.get('title'),
        content: data.get('content'),
        showInNav: data.get('showInNav') === 'on',
        id: index !== null ? page.id : Date.now().toString()
      };
      this.app.pageManager.addOrUpdatePage(newPage, index);
      this.renderPageManager();
    };

    form.querySelector('.cancel').onclick = () => this.renderPageManager();
    frag.appendChild(form);
    this.app.render(frag);
  }

  renderPostManager() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav('admin'));

    const title = document.createElement('h2');
    title.textContent = 'Manage Posts';
    frag.appendChild(title);

    const list = document.createElement('div');
    this.app.postManager.getAll().forEach((p, i) => {
      const item = document.createElement('div');
      item.innerHTML = `
        <strong>${p.title}</strong>
        <button class="edit" data-index="${i}">Edit</button>
        <button class="delete" data-index="${i}">Delete</button>
      `;
      list.appendChild(item);
    });

    const addBtn = document.createElement('button');
    addBtn.textContent = '➕ Add New Post';
    addBtn.onclick = () => this.renderPostForm();
    frag.appendChild(list);
    frag.appendChild(addBtn);

    this.app.render(frag);

    list.querySelectorAll('.edit').forEach(btn =>
      btn.onclick = () => this.renderPostForm(parseInt(btn.dataset.index))
    );
    list.querySelectorAll('.delete').forEach(btn =>
      btn.onclick = () => {
        this.app.postManager.deletePost(parseInt(btn.dataset.index));
        this.renderPostManager();
      }
    );
  }

  renderPostForm(index = null) {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav('admin'));

    const form = document.createElement('form');
    const post = index !== null ? this.app.postManager.getAll()[index] : { title: '', content: '' };

    form.innerHTML = `
      <h2>${index !== null ? 'Edit' : 'New'} Post</h2>
      <input name="title" placeholder="Title" value="${post.title}" required />
      <textarea name="content" placeholder="Content" required>${post.content}</textarea>
      <button type="submit">Save</button>
      <button type="button" class="cancel">Cancel</button>
    `;

    form.onsubmit = e => {
      e.preventDefault();
      const data = new FormData(form);
      const newPost = {
        title: data.get('title'),
        content: data.get('content'),
        id: index !== null ? post.id : Date.now().toString()
      };
      this.app.postManager.addOrUpdatePost(newPost, index);
      this.renderPostManager();
    };

    form.querySelector('.cancel').onclick = () => this.renderPostManager();
    frag.appendChild(form);
    this.app.render(frag);
  }

  renderDraftPageForm() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav('admin'));

    const form = document.createElement('form');

    form.innerHTML = `
      <h2>Draft New Page</h2>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Page content..." required></textarea>
      <button type="submit">Preview</button>
      <button type="button" class="cancel">Cancel</button>
    `;

    form.onsubmit = e => {
      e.preventDefault();
      const data = new FormData(form);
      const page = {
        title: data.get('title'),
        content: data.get('content')
      };
      this.app.dynamicContentManager.addTempPage(page);
    };

    form.querySelector('.cancel').onclick = () => this.renderAdminPage();
    frag.appendChild(form);
    this.app.render(frag);
  }

  renderDraftPostForm() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav('admin'));

    const form = document.createElement('form');

    form.innerHTML = `
      <h2>Draft New Post</h2>
      <input name="title" placeholder="Title" required />
      <textarea name="content" placeholder="Post content..." required></textarea>
      <button type="submit">Preview</button>
      <button type="button" class="cancel">Cancel</button>
    `;

    form.onsubmit = e => {
      e.preventDefault();
      const data = new FormData(form);
      const post = {
        title: data.get('title'),
        content: data.get('content')
      };
      this.app.dynamicContentManager.addTempPost(post);
    };

    form.querySelector('.cancel').onclick = () => this.renderAdminPage();
    frag.appendChild(form);
    this.app.render(frag);
  }
}



// #5 PageManager: Handles static site pages (About, FAQ, etc.)
class PageManager {
  constructor(app) {
    this.app = app;
    this.pages = JSON.parse(localStorage.getItem('sitePages') || '[]');
  }

  getAll() {
    return this.pages;
  }

  saveAll() {
    localStorage.setItem('sitePages', JSON.stringify(this.pages));
    this.updateNavAndRoutes();
  }

  addOrUpdatePage(page, index = null) {
    const timestamp = new Date().toISOString();
    page.lastModified = timestamp;

    if (!page.id) {
      page.id = Date.now().toString(); // fallback if not assigned
    }

    if (index !== null) {
      this.pages[index] = page;
    } else {
      this.pages.push(page);
    }

    this.saveAll();
  }

  deletePage(index) {
    this.pages.splice(index, 1);
    this.saveAll();
  }

  updateNavAndRoutes() {
  // Include all static pages you want to persist in nav
  const staticIds = new Set(['home','post', 'about', 'contact','pages','admin', 'login',]);

  // Preserve static pages
  this.app.navManager.pages = this.app.navManager.pages.filter(p => staticIds.has(p.id));

  // Sort dynamic pages alphabetically
  const sortedPages = [...this.pages].sort((a, b) => a.title.localeCompare(b.title));

  sortedPages.forEach(page => {
    const rendererId = `renderPage_${page.id}`;

    // Add to nav if flagged
    if (page.showInNav) {
      const alreadyInNav = this.app.navManager.pages.some(p => p.id === page.id);
      if (!alreadyInNav) {
        this.app.navManager.pages.push({
          id: page.id,
          label: page.title,
          renderer: rendererId
        });
      }
    }

    // Create the renderer dynamically
    this.app[rendererId] = () => {
      const frag = document.createDocumentFragment();
      frag.appendChild(this.app.navManager.renderNav(page.id));

      const h2 = document.createElement('h2');
      h2.textContent = page.title;

      const meta = document.createElement('p');
      meta.innerHTML = `
        <small>Last modified: ${page.lastModified}</small><br>
        <small>Category: ${page.category || 'None'}</small>
      `;

      const para = document.createElement('p');
      para.textContent = page.content;

      frag.appendChild(h2);
      frag.appendChild(meta);
      frag.appendChild(para);
      frag.appendChild(this.app.footerManager.render());

      this.app.render(frag);
    };

    this.app.routeManager.register(page.id, rendererId);
  });
}

}


// #6 PostManager: Handles blog/news-like posts
class PostManager {
  constructor(app) {
    this.app = app;
    this.posts = JSON.parse(localStorage.getItem('sitePosts') || '[]');
  }

  getAll() {
    return this.posts;
  }

  saveAll() {
    localStorage.setItem('sitePosts', JSON.stringify(this.posts));
  }

  addOrUpdatePost(post, index = null) {
    if (index !== null) this.posts[index] = post;
    else this.posts.push(post);
    this.saveAll();
  }

  deletePost(index) {
    this.posts.splice(index, 1);
    this.saveAll();
  }

  renderPost(postId) {
    const post = this.posts.find(p => p.id === postId);
    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav(postId));

    if (post) {
      const h2 = document.createElement('h2');
      h2.textContent = post.title;
      const p = document.createElement('p');
      p.textContent = post.content;
      frag.appendChild(h2);
      frag.appendChild(p);
    } else {
      frag.innerHTML += `<p>Post not found</p>`;
    }

    this.app.render(frag);
  }
}

// #7 RouteManager Class (Hash Router) - Enable back/forward browser navigation
class RouteManager {
  constructor(app) {
    this.app = app;
    this.routes = {}; // { routeId: renderFunctionName }
    window.addEventListener('hashchange', () => this.resolve());
  }

  register(id, renderFn) {
    this.routes[id] = renderFn;
  }

  navigateTo(id) {
    window.location.hash = id;
  }

resolve() {
  const hash = window.location.hash.replace(/^#/, '') || 'home';

  // Use Object.hasOwn or fallback to hasOwnProperty to avoid prototype pollution issues
  const hasRoute = Object.hasOwn?.(this.routes, hash) || this.routes.hasOwnProperty(hash);

  if (hasRoute && typeof this.app[this.routes[hash]] === 'function') {
    this.app[this.routes[hash]]();
  } else {
    this.renderNotFound(hash);
  }
}


  renderNotFound(route) {
    const frag = document.createDocumentFragment();
    const heading = document.createElement('h2');
    heading.textContent = '404 - Page Not Found';
    const desc = document.createElement('p');
    desc.textContent = `No route defined for "${route}"`;
    frag.appendChild(heading);
    frag.appendChild(desc);
    this.app.render(frag);
  }
}
// #8 DynamicContentManager: Preview and Publish Pages/Posts 
class DynamicContentManager {
  constructor(app) {
    this.app = app;
    this.tempPages = []; // Not saved unless user publishes
    this.tempPosts = [];
  }

  addTempPage(pageData) {
    this.tempPages.push({
      ...pageData,
      id: `temp-${Date.now()}`,
      showInNav: false
    });
    this.renderPreviewPage(this.tempPages.length - 1);
  }

  renderPreviewPage(index) {
    const page = this.tempPages[index];
    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav());

    const h2 = document.createElement('h2');
    h2.textContent = `[Preview] ${page.title}`;
    const p = document.createElement('p');
    p.textContent = page.content;

    frag.appendChild(h2);
    frag.appendChild(p);

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Publish This Page';
    saveBtn.onclick = () => {
      this.app.pageManager.addOrUpdatePage(page);
      this.app.pageManager.updateNavAndRoutes();
      this.app.routeManager.navigateTo(page.id);
    };

    frag.appendChild(saveBtn);
    this.app.render(frag);
  }

  addTempPost(postData) {
    this.tempPosts.push({
      ...postData,
      id: `temp-${Date.now()}`
    });
    this.renderPreviewPost(this.tempPosts.length - 1);
  }

  renderPreviewPost(index) {
    const post = this.tempPosts[index];
    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav());

    const h2 = document.createElement('h2');
    h2.textContent = `[Preview] ${post.title}`;
    const p = document.createElement('p');
    p.textContent = post.content;

    frag.appendChild(h2);
    frag.appendChild(p);

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Publish This Post';
    saveBtn.onclick = () => {
      this.app.postManager.addOrUpdatePost(post);
      this.app.routeManager.navigateTo('admin');
    };

    frag.appendChild(saveBtn);
    this.app.render(frag);
  }
}

// #9 dynamically manage and render your website's footer
class FooterManager {
  constructor(app) {
    this.app = app;
  }

  render() {
    const footer = document.createElement('footer');
    footer.classList.add('site-footer');

    const year = new Date().getFullYear();

    footer.innerHTML = `
      <div class="footer-content">
        <p>&copy; ${year} F2P Website. All rights reserved.</p>
        <div class="footer-links">
          <a href="#home">Home</a>
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="https://github.com/" target="_blank" rel="noopener noreferrer">
            <i class="material-icons">code</i>
          </a>
        </div>
      </div>
    `;

    return footer;
  }
}



// #00 IconManager: Google Icons Integration 
class IconManager {
  constructor() {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  icon(name, clase = '', size = 'material-icons') {
    const i = document.createElement('i');
    i.className = size + ' ' + clase;
    i.textContent = name;
    return i;
  }
}

// #final Putting It All Together in App
class F2PApp {
  constructor(rootId) {
    this.root = document.getElementById(rootId);

    // Core managers
    this.themeManager = new ThemeManager();
    this.iconManager = new IconManager();
    this.authManager = new AuthManager(this);
    this.pageManager = new PageManager(this);
    this.postManager = new PostManager(this);
    this.adminManager = new AdminManager(this);
    this.footerManager = new FooterManager(this);
    this.dynamicContentManager = new DynamicContentManager(this);

    // Navigation and routing
    this.navManager = new NavManager(this, [
      { id: 'home', label: 'Home', renderer: 'renderHomePage' },
      { id: 'post', label: 'Post', renderer: 'renderPostPage' },
      { id: 'about', label: 'About', renderer: 'renderAboutPage' },
      { id: 'pages', label: 'Pages', renderer: 'renderNavPagesPage' },
      { id: 'contact', label: 'Contact', renderer: 'renderContactPage' },

    ]);

    this.routeManager = new RouteManager(this);

    // Register core routes
    this.routeManager.register('home', 'renderHomePage');
    this.routeManager.register('post', 'renderPostPage');
    this.routeManager.register('login', 'renderLoginPage');
    this.routeManager.register('about', 'renderAboutPage');
    this.routeManager.register('contact', 'renderContactPage');
    this.routeManager.register('terms', 'renderTermsPage');
    this.routeManager.register('privacy', 'renderPrivacyPage');
    this.routeManager.register('pages', 'renderNavPagesPage');

    // Add admin page if already logged in
    if (this.authManager.user) {
      this.navManager.pages.push({
        id: 'admin',
        label: 'Admin',
        renderer: 'renderAdminPage'
      });
      this.routeManager.register('admin', 'renderAdminPage');
    }

    // Load saved pages and routes
    this.pageManager.updateNavAndRoutes();
  }

  init() {
    this.routeManager.resolve(); // Start app with current route
  }

  renderHomePage() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.navManager.renderNav('home'));

    const title = document.createElement('h1');
    title.textContent = 'Welcome to F2P';
    frag.appendChild(title);

    frag.appendChild(this.footerManager.render());
    this.render(frag);
  }

renderPostPage() {
  const frag = document.createDocumentFragment();
  frag.appendChild(this.navManager.renderNav('post'));

  const h2 = document.createElement('h2');
  h2.textContent = 'All Posts';
  frag.appendChild(h2);

  const posts = this.postManager.getAll();

  if (posts.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = 'No posts available yet.';
    frag.appendChild(empty);
  } else {
    const list = document.createElement('ul');
    posts.forEach(post => {
      const li = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = post.title;

      const content = document.createElement('p');
      content.textContent = post.content;

      li.appendChild(title);
      li.appendChild(content);
      list.appendChild(li);
    });
    frag.appendChild(list);
  }

  frag.appendChild(this.footerManager.render());
  this.render(frag);
}



  renderAboutPage() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.navManager.renderNav('about'));

    const h2 = document.createElement('h2');
    h2.textContent = 'About F2P';
    const p = document.createElement('p');
    p.textContent = 'This site demonstrates a fully JavaScript-rendered one-page app with routing, theming, and admin content editing.';
    frag.appendChild(h2);
    frag.appendChild(p);
    frag.appendChild(this.footerManager.render());

    this.render(frag);
  }

  renderContactPage() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.navManager.renderNav('contact'));

    const h2 = document.createElement('h2');
    h2.textContent = 'Contact Us';
    const p = document.createElement('p');
    p.innerHTML = `Email: <a href="mailto:support@f2p.com">support@f2p.com</a>`;
    frag.appendChild(h2);
    frag.appendChild(p);
    frag.appendChild(this.footerManager.render());

    this.render(frag);
  }

  renderTermsPage() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.navManager.renderNav('terms'));

    const h2 = document.createElement('h2');
    h2.textContent = 'Terms of Service';
    const p = document.createElement('p');
    p.textContent = 'By using this website, you agree to our terms and conditions.';
    frag.appendChild(h2);
    frag.appendChild(p);
    frag.appendChild(this.footerManager.render());

    this.render(frag);
  }

  renderPrivacyPage() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.navManager.renderNav('privacy'));

    const h2 = document.createElement('h2');
    h2.textContent = 'Privacy Policy';
    const p = document.createElement('p');
    p.textContent = 'We respect your privacy. No tracking. No third-party data sales.';
    frag.appendChild(h2);
    frag.appendChild(p);
    frag.appendChild(this.footerManager.render());

    this.render(frag);
  }

  renderLoginPage() {
    if (this.authManager.user) {
      this.routeManager.navigateTo('admin');
      return;
    }

    const frag = document.createDocumentFragment();
    frag.appendChild(this.navManager.renderNav('login'));
    this.authManager.renderLoginPageInto(frag);
    frag.appendChild(this.footerManager.render());

    this.render(frag);
  }

  renderAdminPage() {
    this.adminManager.renderAdminPage();
  }

  renderNavPagesPage() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.navManager.renderNav('pages'));
 
    const section = document.createElement('section');
    section.addId = "pages-all-pages";

    const h2 = document.createElement('h2');
    h2.textContent = 'Navigation Pages';
    frag.appendChild(h2);

    const list = document.createElement('ul');
    this.navManager.pages.forEach(p => {
      if (p.id === 'pages') return;

      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${p.id}`;
      a.textContent = p.label;
      li.appendChild(a);
      list.appendChild(li);
    });

    frag.appendChild(section);

    section.appendChild(h2);
    section.appendChild(list);
    frag.appendChild(this.footerManager.render());
    this.render(frag);
  }

  render(fragment) {
    this.root.innerHTML = '';
    this.root.appendChild(fragment);
  }
}



// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new F2PApp('main_app');
  app.init();
});
