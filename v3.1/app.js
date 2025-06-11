
// #1 ThemeManager: Light & Dark Mode Optimized
class ThemeManager {
  constructor(app, storageKey = 'theme') {
    this.app = app;
    this.storageKey = storageKey;
    this.theme = localStorage.getItem(storageKey) || 'light';
    this.applyTheme();
  }

  toggle() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem(this.storageKey, this.theme);
    this.applyTheme();

    this.notifyThemeSwitch();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  notifyThemeSwitch() {
    const themeData = {
      label: this.theme === 'dark' ? 'Dark Mode Enabled' : 'Light Mode Enabled',
      icon: this.theme === 'dark' ? 'dark_mode' : 'light_mode'
    };

    const payload = {
      title: 'Theme Switched',
      message: themeData.label,
      icon: themeData.icon,
      type: 'info',
      duration: 3000,
      sound: true
    };

    if (this.app.notificationManager?.show) {
      this.app.notificationManager.show(payload.message, payload);
    } else {
      console.warn('[⚠️ NotificationManager not available]');
    }
  }
}

// #2 NavManager: Navigation Across Pages
class NavManager {
  constructor(app, pages = []) {
    this.app = app;
    this.pages = pages.map(p => ({
      ...p,
      type: p.type || 'page',
      showInNav: p.showInNav !== false // default true
    }));
  }

  renderNav(currentId) {
    const nav = document.createElement('nav');
    nav.className = 'main-nav';

    // Render each visible nav page
    this.pages.forEach(({ id, label, showInNav }) => {
      if (!showInNav) return;

      const btn = document.createElement('button');
      btn.textContent = label;
      btn.onclick = () => this.app.routeManager.navigateTo(id);
      if (id === currentId) btn.disabled = true;
      nav.appendChild(btn);
    });

    // Append auth and theme buttons
    nav.appendChild(this._createAuthButton());
    nav.appendChild(this._createThemeToggle());

    return nav;
  }

  _createAuthButton() {
    const btn = document.createElement('button');
    const icon = document.createElement('i');
    icon.className = 'material-icons';

    if (this.app.authManager.user) {
      icon.textContent = 'logout';
      btn.textContent = 'Logout';
      btn.onclick = () => this.app.authManager.logout();
    } else {
      icon.textContent = 'login';
      btn.textContent = 'Login';
      btn.onclick = () => this.app.routeManager.navigateTo('login');
    }

    btn.prepend(icon);
    return btn;
  }

  _createThemeToggle() {
    const btn = document.createElement('button');
    btn.id = 'theme-toggle';

    const icon = document.createElement('i');
    icon.className = 'material-icons theme-icon';
    btn.appendChild(icon);

    const updateIcon = () => {
      const theme = this.app.themeManager.theme;
      icon.textContent = theme === 'light' ? 'dark_mode' : 'light_mode';
      icon.className = `material-icons theme-icon ${theme === 'light' ? 'moon-icon' : 'sun-icon'}`;
      btn.title = theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    };

    btn.onclick = () => {
      this.app.themeManager.toggle();
      updateIcon();
    };

    updateIcon();
    return btn;
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

    form.onsubmit = e => this.handleLogin(e, form);

    container.appendChild(form);
    target.appendChild(container);

    if (!fragment) this.app.render(target);
  }

  handleLogin(e, form) {
    e.preventDefault();
    const username = form.username.value.trim().toLowerCase();
    const password = form.password.value;
    const errorMsg = form.querySelector('.error-msg');

    const isValid = username === 'admin' && password === '1234';

    if (isValid) {
      this.user = { username };
      localStorage.setItem('authUser', JSON.stringify(this.user));
      form.reset();
      errorMsg.style.display = 'none';

      this.app.notificationManager?.show(`Welcome back, ${username}!`, {
        title: 'Login Successful',
        icon: 'check_circle',
        sound: true,
        duration: 5000,
        type: 'success'
      });

      this.app.onLoginSuccess();
    } else {
      errorMsg.style.display = 'block';
      errorMsg.textContent = '❗ Invalid username or password';

      this.app.notificationManager?.show(`Invalid login attempt for "${username}"`, {
        title: 'Login Failed',
        icon: 'error',
        sound: false,
        duration: 4000,
        type: 'error'
      });
    }
  }

  logout() {
    this.user = null;
    localStorage.removeItem('authUser');

    // Remove admin from nav
    this.app.navManager.pages = this.app.navManager.pages.filter(p => p.id !== 'admin');

    this.app.notificationManager?.show('You have been logged out.', {
      title: 'Logout Successful',
      icon: 'logout',
      type: 'info',
      duration: 4000,
      sound: false
    });

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
      { icon: 'description', label: 'Manage Pages', action: () => this.renderPageManager() },
      { icon: 'article', label: 'Manage Posts', action: () => this.renderPostManager() },
      { icon: 'edit_note', label: 'Draft Page', action: () => this.renderDraftPageForm() },
      { icon: 'drafts', label: 'Draft Post', action: () => this.renderDraftPostForm() }
    ];

    buttons.forEach(({ icon, label, action }) => {
      const btn = document.createElement('button');
      btn.appendChild(this.app.iconManager.icon(icon));
      btn.appendChild(document.createTextNode(` ${label}`));
      btn.onclick = action;
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
    this.app.pageManager.getAll().forEach((page, i) => {
      const item = document.createElement('div');
      item.innerHTML = `
        <strong>${page.title}</strong>
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

    list.querySelectorAll('.edit').forEach(btn => {
      btn.onclick = () => this.renderPageForm(parseInt(btn.dataset.index));
    });

    list.querySelectorAll('.delete').forEach(btn => {
      btn.onclick = () => {
        const index = parseInt(btn.dataset.index);
        this.app.pageManager.deletePage(index);
        this.app.notificationManager?.show('Page deleted.', {
          title: 'Deleted',
          type: 'warning',
          icon: 'delete'
        });
        this.renderPageManager();
      };
    });
  }

  renderPageForm(index = null) {
    const page = index !== null ? this.app.pageManager.getAll()[index] : { title: '', content: '', showInNav: true };

    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav('admin'));

    const form = document.createElement('form');
    form.innerHTML = `
      <h2>${index !== null ? 'Edit' : 'New'} Page</h2>
      <input name="title" placeholder="Title" value="${page.title}" required />
      <textarea name="content" placeholder="Content" required>${page.content}</textarea>
      <label>
        <input type="checkbox" name="showInNav" ${page.showInNav ? 'checked' : ''}/> Show in Navigation
      </label>
      <button type="submit">Save</button>
      <button type="button" class="cancel">Cancel</button>
    `;

    form.onsubmit = e => {
      e.preventDefault();
      const data = new FormData(form);
      this.app.pageManager.addOrUpdatePage({
        title: data.get('title'),
        content: data.get('content'),
        showInNav: data.get('showInNav') === 'on',
        id: page.id
      }, index);

      this.app.notificationManager?.show('Page saved.', {
        title: 'Saved',
        icon: 'check_circle',
        type: 'success'
      });

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
    this.app.postManager.getAll().forEach((post, i) => {
      const item = document.createElement('div');
      item.innerHTML = `
        <strong>${post.title}</strong>
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
        this.app.notificationManager?.show('Post deleted.', {
          title: 'Deleted',
          type: 'warning',
          icon: 'delete'
        });
        this.renderPostManager();
      }
    );
  }

  renderPostForm(index = null) {
    const post = index !== null ? this.app.postManager.getAll()[index] : {};
    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav('admin'));

    const form = document.createElement('form');
    form.innerHTML = `
      <h2>${index !== null ? 'Edit' : 'New'} Post</h2>
      <input name="title" placeholder="Title" value="${post.title || ''}" required />
      <textarea name="description" placeholder="Description (optional)">${post.description || ''}</textarea>
      <textarea name="postHtml" placeholder="HTML content (optional)">${post.postHtml || ''}</textarea>
      <textarea name="content" placeholder="Raw content used as fallback">${post.content || ''}</textarea>
      <input name="category" placeholder="Category" value="${post.category || ''}" />
      <input name="tags" placeholder="Tags (comma-separated)" value="${(post.tags || []).join(', ')}" />
      <input name="thumbnail" placeholder="Thumbnail URL" value="${post.thumbnail || ''}" />
      <label><input type="checkbox" name="pin" ${post.permissions?.pin ? 'checked' : ''}/> Pin post</label>
      <label><input type="checkbox" name="comment" ${post.permissions?.comment ? 'checked' : ''}/> Allow comments</label>
      <label>Visibility:
        <select name="visibility">
          ${['public','private','draft','scheduled','admin-only','members']
            .map(v => `<option value="${v}" ${post.permissions?.visibility === v ? 'selected' : ''}>${v}</option>`).join('')}
        </select>
      </label>
      <label><input type="checkbox" name="share" ${post.permissions?.share ? 'checked' : ''}/> Allow sharing</label>
      <label><input type="checkbox" name="adultery" ${post.permissions?.adultery ? 'checked' : ''}/> NSFW (18+)</label>
      <button type="submit">Save</button>
      <button type="button" class="cancel">Cancel</button>
    `;

    form.onsubmit = e => {
      e.preventDefault();
      const data = new FormData(form);
      const newPost = {
        id: post.id,
        title: data.get('title'),
        description: data.get('description'),
        postHtml: data.get('postHtml'),
        content: data.get('content'),
        category: data.get('category'),
        tags: data.get('tags').split(',').map(t => t.trim()).filter(Boolean),
        thumbnail: data.get('thumbnail'),
        permissions: {
          pin: data.get('pin') === 'on',
          comment: data.get('comment') === 'on',
          visibility: data.get('visibility'),
          share: data.get('share') === 'on',
          adultery: data.get('adultery') === 'on'
        }
      };

      this.app.postManager.addOrUpdatePost(newPost, index);
      this.app.notificationManager?.show('Post saved.', {
        title: 'Saved',
        icon: 'check_circle',
        type: 'success'
      });

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
      <textarea name="content" placeholder="Content" required></textarea>
      <button type="submit">Preview</button>
      <button type="button" class="cancel">Cancel</button>
    `;
    form.onsubmit = e => {
      e.preventDefault();
      const p = new FormData(form);
      this.app.dynamicContentManager.addTempPage({
        title: p.get('title'),
        content: p.get('content')
      });
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
      <textarea name="content" placeholder="Content" required></textarea>
      <button type="submit">Preview</button>
      <button type="button" class="cancel">Cancel</button>
    `;
    form.onsubmit = e => {
      e.preventDefault();
      const p = new FormData(form);
      this.app.dynamicContentManager.addTempPost({
        title: p.get('title'),
        content: p.get('content')
      });
    };
    form.querySelector('.cancel').onclick = () => this.renderAdminPage();
    frag.appendChild(form);
    this.app.render(frag);
  }
}

// #5 PageManager: Handles dynamic pages (About, FAQ, etc.)
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
    const slugify = str =>
      'page/' +
      str.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    const timestamp = new Date().toISOString();
    page.id = page.id || Date.now().toString();
    page.title = page.title?.trim() || `Untitled Page ${page.id}`;
    page.slug = page.slug || slugify(page.title);
    page.content = page.content || '';
    page.category = page.category || '';
    page.lastModified = timestamp;
    page.showInNav = page.showInNav ?? true;

    if (index !== null) {
      this.pages[index] = page;
    } else {
      this.pages.push(page);
    }

    this.saveAll();

    this.app.notificationManager?.show(`${page.title} saved.`, {
      title: 'Page Updated',
      icon: 'check_circle',
      type: 'success'
    });
  }

  deletePage(index) {
    if (index < 0 || index >= this.pages.length) return;

    const removed = this.pages.splice(index, 1)[0];
    this.saveAll();

    this.app.notificationManager?.show(`${removed.title} deleted.`, {
      title: 'Page Removed',
      icon: 'delete',
      type: 'warning'
    });
  }

  updateNavAndRoutes() {
    const staticIds = new Set([
      'home', 'post', 'about', 'contact', 'pages',
      'admin', 'login', 'search', 'terms', 'privacy'
    ]);

    // Keep only core static nav items
    this.app.navManager.pages = this.app.navManager.pages.filter(p =>
      staticIds.has(p.id)
    );

    // Register dynamic pages
    this.pages
      .sort((a, b) => a.title.localeCompare(b.title))
      .forEach(page => {
        const renderFn = `renderPage_${page.id}`;
        const routeId = page.slug;

        // Navigation entry
        if (page.showInNav && !this.app.navManager.pages.some(p => p.id === page.id)) {
          this.app.navManager.pages.push({
            id: page.id,
            label: page.title,
            renderer: renderFn,
            type: 'page',
            showInNav: true
          });
        }

        // Dynamic page renderer
        this.app[renderFn] = () => {
          const frag = document.createDocumentFragment();
          frag.appendChild(this.app.navManager.renderNav(page.id));

          const h2 = document.createElement('h2');
          h2.textContent = page.title;

          const meta = document.createElement('p');
          meta.innerHTML = `
            <small>Last modified: ${new Date(page.lastModified).toLocaleString()}</small><br>
            <small>Category: ${page.category || 'None'}</small>
          `;

          const content = document.createElement('div');
          content.innerHTML = page.postHtml || `<p>${page.content}</p>`;

          frag.append(h2, meta, content, this.app.footerManager.render());
          this.app.render(frag);
        };

        this.app.routeManager.register(routeId, renderFn);
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
    const now = new Date().toISOString();
    const slugify = str =>
      'post/' +
      str.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    const fullPost = {
      id: post.id || Date.now().toString(),
      title: post.title?.trim() || 'Untitled Post',
      slug: slugify(post.title || `post-${Date.now()}`),
      description: post.description || post.content?.slice(0, 120) || '',
      postHtml: post.postHtml || `<p>${(post.content || '').replace(/\n/g, '<br>')}</p>`,
      content: post.content || '',
      category: post.category || '',
      tags: post.tags?.filter(Boolean) || [],
      author: post.author || 'admin',
      thumbnail: post.thumbnail || '',
      createdAt: post.createdAt || now,
      updatedAt: now,
      permissions: {
        pin: false,
        comment: true,
        visibility: 'public',
        share: true,
        adultery: false,
        ...(post.permissions || {})
      },
      seo: {
        metaTitle: post.title || '',
        metaDescription: post.description ||
          post.content?.slice(0, 160) || '',
        canonicalUrl: post.seo?.canonicalUrl ||
          `https://f2p.com/${slugify(post.title || 'post')}`,
        image: post.thumbnail || '',
        keywords: post.tags || [],
        schemaType: 'Article',
        ...(post.seo || {})
      }
    };

    if (index !== null) {
      this.posts[index] = fullPost;
    } else {
      this.posts.push(fullPost);
    }

    this.saveAll();
    this.app.fullPostViewManager?.registerPostRoutes();

    // ✅ Notify user
    this.app.notificationManager?.show(
      index !== null ? 'Post updated' : 'New post created', {
        title: fullPost.title,
        icon: index !== null ? 'edit' : 'post_add',
        duration: 4000,
        sound: false,
        type: 'success'
      }
    );
  }

  deletePost(index) {
    const removed = this.posts.splice(index, 1)[0];
    this.saveAll();
    this.app.fullPostViewManager?.registerPostRoutes();

    // ✅ Notify user
    this.app.notificationManager?.show(
      'Post deleted', {
        title: removed.title,
        icon: 'delete',
        duration: 4000,
        sound: false,
        type: 'warning'
      }
    );
  }

  renderPost(postId) {
    const post = this.posts.find(p => p.id === postId);
    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav(post ? post.slug : ''));

    if (post) {
      const article = document.createElement('article');
      article.className = 'full-post-view';

      const h1 = document.createElement('h1');
      h1.textContent = post.title;

      const meta = document.createElement('p');
      meta.innerHTML = `
        <small>🕒 ${new Date(post.updatedAt).toLocaleString()}</small> |
        <small>📂 ${post.category}</small> |
        <small>✍️ ${post.author}</small>
      `;

      const html = document.createElement('div');
      html.innerHTML = post.postHtml;

      article.appendChild(h1);
      article.appendChild(meta);
      article.appendChild(html);
      frag.appendChild(article);
    } else {
      const err = document.createElement('p');
      err.textContent = '❌ Post not found.';
      frag.appendChild(err);
    }

    frag.appendChild(this.app.footerManager.render());
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
    const fullHash = window.location.hash.replace(/^#/, '') || 'home';
    const [rawHash, query] = fullHash.split('?');

    const handle = fn => {
      if (typeof this.app[fn] === 'function') {
        this.app[fn]();
      } else {
        console.warn(`[⚠️ Route Warning] No render function: "${fn}"`);
        this.renderNotFound(rawHash);
      }
    };

    // 1. Exact route match
    if (this.routes[rawHash]) {
      return handle(this.routes[rawHash]);
    }

    // 2. Match post slugs (e.g., post/some-title)
    if (rawHash.startsWith('post/')) {
      const post = this.app.postManager.getAll().find(p => p.slug === rawHash);
      if (post) {
        const fn = `renderPost_${post.id}`;
        return handle(fn);
      }
    }

    // 3. Match dynamic page slugs (e.g., page/about-us)
    if (rawHash.startsWith('page/')) {
      const slug = rawHash;
      const page = this.app.pageManager.getAll().find(p => p.slug === slug);
      if (page) {
        const fn = `renderPage_${page.id}`;
        return handle(fn);
      }
    }

    // 4. Unknown route → fallback
    this.renderNotFound(rawHash);
  }

 renderNotFound(route) {
  const frag = document.createDocumentFragment();

  // 🧭 Add navigation
  frag.appendChild(this.app.navManager.renderNav());

  const h2 = document.createElement('h2');
  h2.textContent = '404 - Page Not Found';

  const msg = document.createElement('p');
  msg.innerHTML = `
    No route found for <code>#${route}</code><br>
    <a href="#home" class="notfound-link">🔙 Go back home</a>
  `;

  frag.appendChild(h2);
  frag.appendChild(msg);
  frag.appendChild(this.app.footerManager.render());

  this.app.render(frag);
}

}

// #8 DynamicContentManager: Preview & Publish Pages/Posts with Notifications
class DynamicContentManager {
  constructor(app) {
    this.app = app;
    this.tempPages = [];
    this.tempPosts = [];
  }

  addTempPage(pageData) {
    const id = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const fullPage = {
      ...pageData,
      id,
      slug: `page/${pageData.title?.toLowerCase()?.replace(/\s+/g, '-').replace(/[^\w-]/g, '') || id}`,
      lastModified: now,
      showInNav: false
    };
    this.tempPages.push(fullPage);
    this.renderPreviewPage(this.tempPages.length - 1);
  }

  renderPreviewPage(idx) {
    const page = this.tempPages[idx];
    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav());
    frag.appendChild(Object.assign(document.createElement('h2'), { textContent: `[Preview] ${page.title}` }));
    frag.appendChild(Object.assign(document.createElement('p'), { innerHTML: `<small>Category: ${page.category || 'Uncategorized'}</small>` }));
    frag.appendChild(Object.assign(document.createElement('div'), { innerHTML: page.content }));

    const saveBtn = Object.assign(document.createElement('button'), {
      textContent: '📤 Publish Page',
      onclick: () => {
        this.app.pageManager.addOrUpdatePage(page);
        this.app.pageManager.updateNavAndRoutes();
        this.app.routeManager.navigateTo(page.id);
        this.app.notificationManager?.show('Page published successfully!', {
          title: 'Page Published',
          icon: 'description',
          duration: 4000,
          type: 'success'
        });
      }
    });
    frag.appendChild(saveBtn);

    frag.appendChild(this.app.footerManager.render());
    this.app.render(frag);
  }

  addTempPost(postData) {
    const id = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const post = {
      ...postData,
      id,
      slug: '',
      createdAt: now,
      updatedAt: now,
      permissions: { visibility: 'draft', pin: false, comment: true, share: false, adultery: false },
      category: postData.category || 'Uncategorized',
      tags: postData.tags || [],
      description: postData.description || postData.content?.slice(0, 150) || '',
      postHtml: postData.postHtml || `<p>${postData.content}</p>`
    };
    this.tempPosts.push(post);
    this.renderPreviewPost(this.tempPosts.length - 1);
  }

  renderPreviewPost(idx) {
    const post = this.tempPosts[idx];
    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav());
    frag.appendChild(Object.assign(document.createElement('h2'), { textContent: `[Preview] ${post.title}` }));
    frag.appendChild(Object.assign(document.createElement('p'), { innerHTML: `<small>Category: ${post.category} | Tags: ${post.tags.join(', ')}</small>` }));
    frag.appendChild(Object.assign(document.createElement('div'), { innerHTML: post.postHtml }));

    const saveBtn = Object.assign(document.createElement('button'), {
      textContent: '📤 Publish Post',
      onclick: () => {
        this.app.postManager.addOrUpdatePost(post);
        this.app.routeManager.navigateTo('admin');
        this.app.notificationManager?.show('Post published successfully!', {
          title: 'Post Published',
          icon: 'article',
          duration: 4000,
          type: 'success'
        });
      }
    });
    frag.appendChild(saveBtn);

    frag.appendChild(this.app.footerManager.render());
    this.app.render(frag);
  }
}

// #9 FooterManager: Dynamically manage and render your website's footer
class FooterManager {
  constructor(app) {
    this.app = app;
  }

  render() {
    const footer = document.createElement('footer');
    footer.className = 'site-footer';

    const year = new Date().getFullYear();

    const content = document.createElement('div');
    content.className = 'footer-content';

    const copyright = document.createElement('p');
    copyright.textContent = `© ${year} F2P Website. All rights reserved.`;

    const links = document.createElement('div');
    links.className = 'footer-links';

    const navLinks = [
      { href: '#home', label: 'Home' },
      { href: '#privacy', label: 'Privacy' },
      { href: '#terms', label: 'Terms' },
      {
        href: 'https://github.com/',
        label: '',
        icon: 'code',
        external: true
      }
    ];

    navLinks.forEach(link => {
      const a = document.createElement('a');
      a.href = link.href;

      if (link.external) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        const icon = document.createElement('i');
        icon.className = 'material-icons';
        icon.textContent = link.icon;
        a.appendChild(icon);
      } else {
        a.textContent = link.label;
      }

      links.appendChild(a);
    });

    content.appendChild(copyright);
    content.appendChild(links);
    footer.appendChild(content);

    return footer;
  }
}

// #10 SearchManager - let users search and filter content
class SearchManager {
  constructor(app) {
    this.app = app;
  }

  renderSearchPage() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav('search'));

    const title = document.createElement('h2');
    title.textContent = 'Search Pages & Posts';
    frag.appendChild(title);

    const form = document.createElement('form');
    form.innerHTML = `
      <input name="query" type="text" placeholder="Search..." autocomplete="off" />
      <select name="type">
        <option value="all">All</option>
        <option value="pages">Pages</option>
        <option value="posts">Posts</option>
      </select>
    `;

    const results = document.createElement('div');
    results.className = 'search-results';

    const handleSearch = () => {
      const q = form.query.value.trim().toLowerCase();
      const type = form.type.value;
      results.innerHTML = '';

      if (!q) return;

      const staticPages = this.app.navManager.pages
        .filter(p => p.type === 'page' && p.label.toLowerCase().includes(q));

      const matchedPages = this.app.pageManager.getAll().filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
      );

      const matchedPosts = this.app.postManager.getAll().filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q)
      );

      if ((type === 'all' || type === 'pages') && (staticPages.length || matchedPages.length)) {
        const header = document.createElement('h3');
        header.innerHTML = `<i class="material-icons">description</i> Pages`;
        results.appendChild(header);

        staticPages.forEach(p => {
          const a = document.createElement('a');
          a.href = `#${p.id}`;
          a.textContent = p.label;
          results.appendChild(a);
        });

        matchedPages.forEach(p => {
          const a = document.createElement('a');
          a.href = `#${p.id}`;
          a.textContent = p.title;
          results.appendChild(a);
        });
      }

      if ((type === 'all' || type === 'posts') && matchedPosts.length) {
        const header = document.createElement('h3');
        header.innerHTML = `<i class="material-icons">article</i> Posts`;
        results.appendChild(header);

        matchedPosts.forEach(post => {
          const div = document.createElement('div');
          const link = this.app.fullPostViewManager.createPostLink(post);
          link.style.fontWeight = 'bold';
          const preview = document.createElement('p');
          preview.textContent = post.content.slice(0, 100) + (post.content.length > 100 ? '...' : '');
          div.appendChild(link);
          div.appendChild(preview);
          results.appendChild(div);
        });
      }

      if (!results.innerHTML) {
        results.innerHTML = `<p><i class="material-icons">highlight_off</i> No results for "<em>${q}</em>"</p>`;
      }
    };

    form.query.addEventListener('input', handleSearch);
    form.type.addEventListener('change', handleSearch);

    frag.appendChild(form);
    frag.appendChild(results);
    frag.appendChild(this.app.footerManager.render());

    this.app.render(frag);
  }
}

// #11 FullPostViewManager to render full post views
class FullPostViewManager {
  constructor(app) {
    this.app = app;
  }

  createSlug(title, fallbackId) {
    if (!title || typeof title !== 'string') return `${fallbackId}`;
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  registerPostRoutes() {
    const registered = new Set();

    this.app.postManager.getAll().forEach(post => {
      const slug = post.slug || `post/${this.createSlug(post.title, post.id)}`;
      const renderFnName = `renderPost_${post.id}`;

      if (registered.has(slug) || typeof this.app[renderFnName] === 'function') return;

      this.app[renderFnName] = () => {
        const frag = document.createDocumentFragment();
        frag.appendChild(this.app.navManager.renderNav('post'));

        const article = document.createElement('article');
        article.className = 'full-post-view';

        // Title
        const h1 = document.createElement('h1');
        h1.textContent = post.title;

        // Meta
        const meta = document.createElement('p');
        const createdAgo = TimeAgo.from(post.createdAt);
        const updatedAgo = TimeAgo.from(post.updatedAt);

        meta.innerHTML = `
          <small class="post-meta-icons">
            <i class="material-icons">person</i> ${post.author || 'admin'}<br>
            <i class="material-icons">schedule</i> ${createdAgo}<br>
            <i class="material-icons">update</i> ${updatedAgo}<br>
            <i class="material-icons">folder</i> ${post.category || 'Uncategorized'}<br>
            <i class="material-icons">label</i> ${(post.tags || []).join(', ') || 'None'}
          </small>
        `;

        // Body
        const body = document.createElement('div');
        body.className = 'post-body';
        body.innerHTML = post.postHtml || `<p>${post.content || '[No content]'}</p>`;

        // Thumbnail
        if (post.thumbnail) {
          const img = document.createElement('img');
          img.src = post.thumbnail;
          img.alt = `${post.title} thumbnail`;
          img.className = 'post-thumbnail';
          img.style.width = '100%';
          article.appendChild(img);
        }

        article.appendChild(h1);
        article.appendChild(meta);
        article.appendChild(body);
        frag.appendChild(article);
        frag.appendChild(this.app.footerManager.render());

        this.app.render(frag);
      };

      this.app.routeManager.register(slug, renderFnName);
      post.slug = slug;
      registered.add(slug);
    });

    this.app.postManager.saveAll();
  }

  createPostLink(post) {
    const slug = post.slug || `post/${this.createSlug(post.title, post.id)}`;
    const a = document.createElement('a');
    a.href = `#${slug}`;
    a.textContent = post.title;
    return a;
  }
}

// #12 TimeAgo that shows how long ago a given date was
class TimeAgo {
  static from(dateInput, short = false) {
    const now = new Date();
    const then = new Date(dateInput);
    const diffSeconds = Math.floor((now - then) / 1000);

    if (isNaN(diffSeconds)) return 'unknown time';

    const units = [
      { label: 'year', secs: 31536000 },
      { label: 'month', secs: 2592000 },
      { label: 'week', secs: 604800 },
      { label: 'day', secs: 86400 },
      { label: 'hour', secs: 3600 },
      { label: 'minute', secs: 60 },
      { label: 'second', secs: 1 }
    ];

    for (let { label, secs } of units) {
      const count = Math.floor(diffSeconds / secs);
      if (count >= 1) {
        if (short) {
          const abbreviations = {
            year: 'y', month: 'mo', week: 'w', day: 'd',
            hour: 'h', minute: 'm', second: 's'
          };
          return `${count}${abbreviations[label]}`;
        }
        return `${count} ${label}${count !== 1 ? 's' : ''} ago`;
      }
    }

    return short ? 'now' : 'just now';
  }
}


// #13 NotificationManager - emulate native macOS desktop and iOS-style mobile notifications
class NotificationManager {
  constructor() {
    this.audio = new Audio('assets/water-drop-3-84577.mp3');
    this.audio.preload = 'auto';
    this.audio.load();

    this.container = document.createElement('div');
    this.container.className = 'notification-container';
    document.body.appendChild(this.container);

    this.userInteracted = false;
    document.addEventListener('click', () => {
      this.userInteracted = true;
    }, { once: true });

    this.lastShown = {};  // Track last messages
    this.queue = [];
    this.delayBetween = 1000; // min ms between identical messages
  }

  async show(message, options = {}) {
    const {
      title = '',
      sound = true,
      duration = 5000,
      icon = 'info',
      type = 'info'
    } = options;

    const fingerprint = `${title}-${message}-${icon}-${type}`;
    const now = Date.now();

    if (this.lastShown[fingerprint] && now - this.lastShown[fingerprint] < this.delayBetween) {
     
      return; // Too soon, skip duplicate
    }

    this.lastShown[fingerprint] = now;

    if (sound && this.userInteracted) {
      try {
        this.audio.currentTime = 0;
        await this.audio.play();
      } catch (err) {
        console.warn('[🔇 Sound Error]', err.message);
      }
    }

   

    this._showToast({ title, message, duration, icon, type });
  }

  _showToast({ title, message, duration, icon, type }) {
    const toast = document.createElement('div');
    toast.className = `notification-toast toast-${type}`;

    if (icon) {
      const iconEl = document.createElement('i');
      iconEl.className = 'material-icons toast-icon';
      iconEl.textContent = icon;
      toast.appendChild(iconEl);
    }

    const content = document.createElement('div');
    content.className = 'toast-content';

    if (title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'toast-title';
      titleEl.textContent = title;
      content.appendChild(titleEl);
    }

    const msgEl = document.createElement('div');
    msgEl.className = 'toast-message';
    msgEl.textContent = message;
    content.appendChild(msgEl);

    toast.appendChild(content);
    this.container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  clearAll() {
    this.container.innerHTML = '';
  }

  requestPermission() {
    // Not used for native notifications anymore
  }
}

// #14 AllPageManager: View all pages across nav and page manager
class AllPageManager {
  constructor(app) {
    this.app = app;
  }

  renderPagesPage() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.app.navManager.renderNav('pages'));

    const section = document.createElement('section');
    section.id = 'pages-all-pages';

    const h2 = document.createElement('h2');
    h2.textContent = '📄 All Available Pages';
    section.appendChild(h2);

    const seen = new Set();

    // 🧭 System/Static Pages
    const systemHeader = document.createElement('h3');
    systemHeader.textContent = '🧭 Built-in & System Pages';
    section.appendChild(systemHeader);

    const systemList = document.createElement('ul');
    this.app.navManager.pages.forEach(page => {
      if (seen.has(page.id)) return;
      seen.add(page.id);
      const li = document.createElement('li');
      li.innerHTML = `<a href="#${page.id}">${page.label}</a> <small>(${page.type || 'page'})</small>`;
      systemList.appendChild(li);
    });
    section.appendChild(systemList);

    // 📄 Custom/User-Generated Pages
    const customHeader = document.createElement('h3');
    customHeader.textContent = '📄 Custom Pages';
    section.appendChild(customHeader);

    const customList = document.createElement('ul');
    this.app.pageManager.getAll().forEach(page => {
      if (seen.has(page.id)) return;
      seen.add(page.id);
      const li = document.createElement('li');
      li.innerHTML = `<a href="#${page.slug}">${page.title}</a> <small>(page)</small>`;
      customList.appendChild(li);
    });
    section.appendChild(customList);

    // Footer
    frag.appendChild(section);
    frag.appendChild(this.app.footerManager.render());

    this.app.render(frag);
  }

  // Optional alias
  renderAllPages() {
    this.renderPagesPage();
  }
}












// #00 IconManager: Google Material Icons Integration
class IconManager {
  constructor() {
    // Load Material Icons only once
    if (!document.querySelector('link[href*="fonts.googleapis.com/icon"]')) {
      const link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/icon?family=Material+Icons';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  }

  /**
   * Create a Material Icon element
   * @param {string} name - Icon name (e.g., 'home', 'login')
   * @param {string} clase - Extra CSS class names
   * @param {string} variant - Material Icons style (e.g., 'material-icons', 'material-icons-outlined')
   */
  icon(name, clase = '', variant = 'material-icons') {
    const i = document.createElement('i');
    i.className = `${variant} ${clase}`.trim();
    i.textContent = name;
    return i;
  }
}

// #final Putting It All Together in App
class F2PApp {
  constructor(rootId) {
    this.root = document.getElementById(rootId);

    // 🔔 Notification setup
    this.notificationManager = new NotificationManager();
    this.notificationManager.requestPermission();

    // Core managers
    this.themeManager = new ThemeManager(this);
    this.iconManager = new IconManager();
    this.authManager = new AuthManager(this);
    this.pageManager = new PageManager(this);
    this.postManager = new PostManager(this);
    this.allPageManager = new AllPageManager(this); // new manager for listing all pages
    this.adminManager = new AdminManager(this);
    this.footerManager = new FooterManager(this);
    this.dynamicContentManager = new DynamicContentManager(this);
    this.searchManager = new SearchManager(this);
    this.fullPostViewManager = new FullPostViewManager(this);

this.navManager = new NavManager(this, [
  { id: 'home',    label: 'Home',        renderer: 'renderHomePage',     type: 'page',   showInNav: true },
  { id: 'search',  label: 'Search',      renderer: 'renderSearchPage',   type: 'system', showInNav: true },
  { id: 'post',    label: 'All Post',    renderer: 'renderPostPage',     type: 'system', showInNav: true }, 
  { id: 'about',   label: 'About',       renderer: 'renderAboutPage',    type: 'page',   showInNav: true },
  { id: 'pages',   label: 'All Pages',   renderer: 'renderPagesPage',    type: 'system', showInNav: true },
  { id: 'contact', label: 'Contact',     renderer: 'renderContactPage',  type: 'page',   showInNav: true },
  { id: 'terms',   label: 'Terms',       renderer: 'renderTermsPage',    type: 'page',   showInNav: false }, // Hidden from nav
  { id: 'privacy', label: 'Privacy',     renderer: 'renderPrivacyPage',  type: 'page',   showInNav: false }  // Hidden from nav
]);



    this.routeManager = new RouteManager(this);

    // 🔗 Register core routes
    ['home','post','login','about','contact','terms','privacy','pages','search']
  .forEach(id => {
    this.routeManager.register(
      id,
      `render${id[0].toUpperCase() + id.slice(1)}Page`
    );
  });


    // ✅ Ensure admin nav if logged in
    if (this.authManager.user) this.ensureAdminInNav();

    // 🗂️ Load dynamic pages + update
    this.pageManager.updateNavAndRoutes();
  }

  init() {
    this.fullPostViewManager.registerPostRoutes();
    this.routeManager.resolve();
  }

  ensureAdminInNav() {
    if (!this.navManager.pages.some(p => p.id === 'admin')) {
      this.navManager.pages.push({
        id: 'admin',
        label: 'Admin',
        renderer: 'renderAdminPage',
        type: 'admin',
        showInNav: true
      });
      this.routeManager.register('admin','renderAdminPage');
    }
  }

  onLoginSuccess() {
    this.ensureAdminInNav();
    this.renderAdminPage();
  }

  // Renderers
renderHomePage() {
  const frag = document.createDocumentFragment();

  // Add navbar
  frag.appendChild(this.navManager.renderNav('home'));

  // Add heading
  const h1 = document.createElement('h1');
  h1.textContent = 'Welcome to F2P';
  frag.appendChild(h1);

  // Add footer
  frag.appendChild(this.footerManager.render());

  // Render to DOM
  this.render(frag);
}


  renderPostPage() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.navManager.renderNav('post'));
    frag.appendChild(document.createElement('h2')).textContent = 'All Posts';

    const posts = this.postManager.getAll();
    if (!posts.length) {
      frag.appendChild(document.createElement('p')).textContent = 'No posts available yet.';
    } else {
      const ul = document.createElement('ul');
      posts.forEach(post => {
        const li = document.createElement('li');
        const link = this.fullPostViewManager.createPostLink(post);
        link.style.fontWeight = 'bold';
        const preview = document.createElement('p');
        preview.textContent = post.content.slice(0,100) + (post.content.length > 100 ? '...' : '');
        li.append(link, preview);
        ul.appendChild(li);
      });
      frag.appendChild(ul);
    }

    frag.appendChild(this.footerManager.render());
    this.render(frag);
  }

  renderAboutPage() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.navManager.renderNav('about'));
    frag.appendChild(document.createElement('h2')).textContent = 'About F2P';
    frag.appendChild(document.createElement('p')).textContent = 'This site demonstrates a fully JavaScript-rendered one-page app with routing, theming, and admin content editing.';
    frag.appendChild(this.footerManager.render());
    this.render(frag);
  }

  renderContactPage() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.navManager.renderNav('contact'));
    frag.appendChild(document.createElement('h2')).textContent = 'Contact Us';
    const p = document.createElement('p');
    p.innerHTML = `Email: <a href="mailto:support@f2p.com">support@f2p.com</a>`;
    frag.appendChild(p);
    frag.appendChild(this.footerManager.render());
    this.render(frag);
  }

  renderTermsPage() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.navManager.renderNav('terms'));
    frag.appendChild(document.createElement('h2')).textContent = 'Terms of Service';
    frag.appendChild(document.createElement('p')).textContent = 'By using this website, you agree to our terms and conditions.';
    frag.appendChild(this.footerManager.render());
    this.render(frag);
  }

  renderPrivacyPage() {
    const frag = document.createDocumentFragment();
    frag.appendChild(this.navManager.renderNav('privacy'));
    frag.appendChild(document.createElement('h2')).textContent = 'Privacy Policy';
    frag.appendChild(document.createElement('p')).textContent = 'We respect your privacy. No tracking. No third-party data sales.';
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

  renderSearchPage() {
    this.searchManager.renderSearchPage();
  }

  renderPagesPage() {
  this.allPageManager.renderPagesPage(); // <- Proper delegation
}


  render(fragment) {
    this.root.innerHTML = '';
    this.root.appendChild(fragment);
  }
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  const app = new F2PApp('main_app');
  app.init();
});
