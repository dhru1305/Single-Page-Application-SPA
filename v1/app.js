// ========== DOM + Global Constants ==========
const main = document.getElementById("main"); // Main content container
const siteTitle = "MultiMap WebApp";          // Global app title



// ========== Authentication Setup ==========
const AUTH_KEY = "authUser";
const VALID_CREDENTIALS = { username: "admin", password: "1234" };

// ========== Auth Utility ==========
function isLoggedIn() {
  const user = localStorage.getItem(AUTH_KEY);
  try {
    return user ? JSON.parse(user) : false;
  } catch {
    return false;
  }
}

function loginUser(username, password) {
  if (username === VALID_CREDENTIALS.username && password === VALID_CREDENTIALS.password)
 {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ username }));
    updateApp("page", "posts");
  } else {
    alert("Invalid login!");
  }
}

function logoutUser() {
  localStorage.removeItem(AUTH_KEY);
  updateApp("page", "home");
}

// ========== MY posts (Moved to top before use) ==========

// ✅ Fixed DEFAULT_POST
const DEFAULT_POST = [
  {
    id: 1,
    title: "New post",
    thumbnail: "Images/genshin-1.jpg",
    description: "Info about A",
    tag: "intro,location",
    author: VALID_CREDENTIALS.username,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),

    pinned: false,
    scheduledAt: new Date().toISOString(),
    pageHtml: "<p>📍 Coordinates: <b>hello</b></p>",

    visibility: "public",
    status: "published",
    views: 0,
    likes: 0,
    shares: 0,

    contentType: "post",

    meta: {
      seoTitle: "Location A - Discover Place",
      seoDescription: "Explore coordinates and features of Location A.",
      shareable: true
    },

    media: {
      gallery: [],
      featuredVideo: null
    },

    permissions: {
      canEdit: true,
      canDelete: false,
      canComment: true
    },

    comments: [],
    version: 1,
    history: [],

    location: {
      placeName: "Inazuma"
    }
  }
];



// ========== Post Storage (localStorage or default seed) ==========
let posts = [];

try {
  const savedPosts = localStorage.getItem("posts");

  if (savedPosts) {
    posts = JSON.parse(savedPosts);

    // In case parsed result is not a valid array
    if (!Array.isArray(posts)) throw new Error("Invalid posts array.");
  } else {
    throw new Error("No posts found in storage.");
  }
} catch (err) {
  console.warn("⚠️ Failed to load saved posts. Using default:", err);
  posts = [DEFAULT_POST];
  localStorage.setItem("posts", JSON.stringify(posts));
}



// ========== Default Page (Seed Data) ==========
const STATIC_PAGES = [
  {
    id: "home",
    content: `
      <h1>Welcome to ${siteTitle}</h1>
      <p>This is the home page.</p>
    `,
      permissions: {
    canEdit: true,
    canDelete: false,
  },

  },
  {
    id: "about",
    content: `
      <h1>About This App</h1>
      <p>This is the default informational page about your MultiMap WebApp.</p>
      <p>You can edit or delete this page from the admin panel.</p>
    `,
        permissions: {
    canEdit: true,
    canDelete: false,
  },
  },
  {
    id: "404",
    content: `
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
    `,
        permissions: {
    canEdit: true,
    canDelete: false,
  },
  },
  {
  id: "login",
  content: `
    <div class="login-container">
      <h1>🔐 Admin Login</h1>
      <form id="loginForm" autocomplete="off">
        <input name="username" placeholder="Username" required />
        <input type="password" name="password" placeholder="Password" required />
        <button type="submit">Login</button>
      </form>
    </div>
  `,
  permissions: {
    canEdit: true,
    canDelete: false
  },
},


];


// ========== Page Storage (localStorage or default seed) ==========
let pages = [];

try {
  const savedPagesRaw = localStorage.getItem("pages");
  const savedMetaRaw = localStorage.getItem("pages_meta");

  const staticMeta = {
    count: STATIC_PAGES.length,
    hash: STATIC_PAGES.map(p => p.id + JSON.stringify(p.content)).join("::")
  };

  let shouldReset = false;

  if (savedPagesRaw && savedMetaRaw) {
    const savedPages = JSON.parse(savedPagesRaw);
    const savedMeta = JSON.parse(savedMetaRaw);

    // Check if static content has changed (by count or hash)
    if (
      savedMeta.count !== staticMeta.count ||
      savedMeta.hash !== staticMeta.hash
    ) {
      console.info("📢 Detected change in static pages, refreshing localStorage...");
      shouldReset = true;
    } else {
      pages = Array.isArray(savedPages) ? savedPages : [];
    }
  } else {
    shouldReset = true;
  }

  if (shouldReset) {
    // Strip restricted pages like "login" or "404"
    pages = STATIC_PAGES.filter(p => !["login", "404"].includes(p.id));
    localStorage.setItem("pages", JSON.stringify(pages));
    localStorage.setItem("pages_meta", JSON.stringify(staticMeta));
  }
} catch (err) {
  console.warn("⚠️ Failed to load saved pages. Using fallback default:", err);
  pages = STATIC_PAGES.filter(p => !["login", "404"].includes(p.id));
  localStorage.setItem("pages", JSON.stringify(pages));
}



// ========== Theme Management ==========
const THEME_KEY = "siteTheme";

function applyTheme(mode) {
  document.body.classList.toggle("dark-mode", mode === "dark");
  localStorage.setItem("siteTheme", mode);

  const iconSpan = document.querySelector("#theme-toggle .material-icons");
  if (iconSpan) {
    iconSpan.textContent = mode === "dark" ? "dark_mode" : "light_mode";
    iconSpan.classList.toggle("sun-icon", mode === "light");
    iconSpan.classList.toggle("moon-icon", mode === "dark");
  }
}

function toggleTheme() {
  const current = localStorage.getItem(THEME_KEY) || "light";
  const next = current === "light" ? "dark" : "light";
  applyTheme(next);
}

function getCurrentTheme() {
  return localStorage.getItem(THEME_KEY) || "light";
}

// Auto-apply saved theme on load
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(getCurrentTheme());
});



// ========== Core Update Dispatcher ==========
function updateApp(action, data) {
  switch (action) {
    case "page":
      renderLayout(data);
      break;

    case "addPost":
      if (!requireLogin()) return;
      posts.push(data);
      saveAndRender("Post added successfully.");
      break;

    case "updatePost":
      if (!requireLogin()) return;
      const index = posts.findIndex(p => p.id === data.id);
      if (index !== -1) {
        data.lastModified = new Date().toISOString();
        posts[index] = data;
        saveAndRender("Post updated.");
      } else {
        console.warn("Post not found for update:", data.id);
      }
      break;

    case "deletePost":
      if (!requireLogin()) return;
      posts = posts.filter(p => p.id !== data.id);
      saveAndRender("Post deleted.");
      break;

      case "reset":
      if (!requireLogin()) return;
      localStorage.removeItem("posts");
      posts = [];
      updateApp("page", "posts");
      console.info("All posts reset.");
      break;


    default:
      console.warn("Unknown action:", action);
  }
}

// ========== Helper: Login Check ==========
function requireLogin() {
  if (!isLoggedIn()) {
    alert("Login required!");
    return false;
  }
  return true;
}

// ========== Helper: Save and Refresh ==========
function saveAndRender(message = "") {
  savePosts();
  updateApp("page", "posts");
  if (message) console.info(message);
}

// ========== Storage Helper ==========
function savePosts() {
  localStorage.setItem("posts", JSON.stringify(posts));
}

function savePages() {
  localStorage.setItem("pages", JSON.stringify(pages));
}

// ========== Web Layout ========== 
function renderLayout(page) {
  main.innerHTML = ""; // 🔄 Clear the main content area
  const fragment = document.createDocumentFragment();

  // ⛳ Add Navigation with current page highlight
  fragment.appendChild(renderNav(page));

  // 🚦 Routing Logic
  const routeMap = {
    posts: renderPosts,
    adminPanel: renderAdminPanel
  };

  // Static Page Handling
  const staticPageIds = ["home", "about", "login"];
  if (staticPageIds.includes(page)) {
    fragment.appendChild(renderStaticPage(page));
  } else if (routeMap[page]) {
    fragment.appendChild(routeMap[page]());
  } else {
    // Look for dynamic user-created page
    const dynamicPage = pages.find(p => p.id === page);
    if (dynamicPage) {
      const section = document.createElement("section");
      section.innerHTML = dynamicPage.content;
      fragment.appendChild(section);
    } else {
      // Fallback 404
      fragment.appendChild(renderStaticPage("404"));
    }
  }

  // 🧱 Footer
  fragment.appendChild(renderFooter());

  // 🪄 Apply to DOM
  main.appendChild(fragment);
}

// ========== Page Renderers ==========
function renderStaticPage(pageId) {
  const page = STATIC_PAGES.find(p => p.id === pageId);
  const section = document.createElement("section");

  if (page) {
    section.innerHTML = page.content;

    if (pageId === "login") {
      const form = section.querySelector("#loginForm");
      form.onsubmit = e => {
        e.preventDefault();
        const username = form.elements["username"].value.trim();
        const password = form.elements["password"].value.trim();
        loginUser(username, password);
        form.reset();
      };
    }
  } else {
    section.innerHTML = STATIC_PAGES.find(p => p.id === "404").content;
  }

  return section;
}

// ========== posts ========== 
function renderPosts() {
  const section = document.createElement("section");
  section.className = "posts-section";

  const list = document.createElement("div");
  list.className = "posts-list";

  const now = new Date();

  posts
    .filter(post => {
      const sched = new Date(post.scheduledAt || post.createdAt);
      return !isNaN(sched) && sched <= now;
    })
    .slice()
    .reverse()
    .forEach(post => {
      const card = document.createElement("div");
      card.className = "post-card";

      const h3 = document.createElement("h3");
      h3.textContent = post.title;

      const placeName = post.location?.placeName || "N/A";
      const lat = post.location?.lat || "";
      const lng = post.location?.lng || "";

      const p = document.createElement("p");
      const imgSrc = post.thumbnail || "https://via.placeholder.com/640x360?text=No+Image";

      p.innerHTML = `
        <img src="${imgSrc}" alt="${post.title}" style="width:100%;max-width:640px;height:auto;border-radius:4px;margin-bottom:0.5em;" />
        ${post.description}<br/>
        <small>Tags: ${post.tag}</small><br/>
        <small>🕒 Created: ${new Date(post.createdAt).toLocaleString()}</small><br/>
        <small>🗓 Scheduled: ${new Date(post.scheduledAt).toLocaleString()}</small><br/>
        <small>📍 ${placeName} (${lat}, ${lng})</small><br/>
        <small>👁 ${post.views} | ❤️ ${post.likes} | 🔄 ${post.shares}</small>

        ${post.pageHtml}
      `;

      card.appendChild(h3);
      card.appendChild(p);

      if (isLoggedIn()) {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", () => updateApp("deletePost", post));
        card.appendChild(deleteBtn);
      }

      list.appendChild(card);
    });

  section.appendChild(list);
  return section;
}
// ========== Nav ========== 
function renderNav(currentPage) {
  const nav = document.createElement("nav");
  nav.id = "main-nav";

  const createButton = (label, isActive, onclick) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = "nav-button" + (isActive ? " active" : "");
    btn.onclick = onclick;
    return btn;
  };

  // === STATIC PAGES ===
  ["home", "posts", "about"].forEach(page => {
    const label = page.charAt(0).toUpperCase() + page.slice(1);
    const isActive = page === currentPage;
    nav.appendChild(createButton(label, isActive, () => updateApp("page", page)));
  });

  // === USER-CREATED PAGES ===
  pages.forEach(p => {
    if (!["home", "posts", "about"].includes(p.id)) {
      const label = p.id.charAt(0).toUpperCase() + p.id.slice(1);
      const isActive = p.id === currentPage;
      nav.appendChild(createButton(label, isActive, () => updateApp("page", p.id)));
    }
  });

  // === ADMIN CONTROLS ===
  if (isLoggedIn()) {
    nav.appendChild(createButton("Admin Panel", currentPage === "adminPanel", () => updateApp("page", "adminPanel")));
    nav.appendChild(createButton("Reset", false, () => {
      if (confirm("Are you sure you want to delete all posts?")) {
        updateApp("reset");
      }
    }));
    nav.appendChild(createButton("Logout", false, logoutUser));
  } else {
    nav.appendChild(createButton("Login", currentPage === "login", () => updateApp("page", "login")));
  }

  // === THEME TOGGLE ===
  const themeToggle = document.createElement("button");
  themeToggle.id = "theme-toggle";
  themeToggle.className = "nav-button";
  themeToggle.onclick = toggleTheme;

  const iconSpan = document.createElement("span");
  iconSpan.className = "material-icons theme-icon";
  const mode = getCurrentTheme();
  iconSpan.textContent = mode === "dark" ? "dark_mode" : "light_mode";
  iconSpan.classList.add(mode === "dark" ? "moon-icon" : "sun-icon");

  themeToggle.appendChild(iconSpan);
  nav.appendChild(themeToggle);

  return nav;
}

// ========== Admin Panel ========== 
function renderAdminPanel() {
  if (!requireLogin()) {
    const section = document.createElement("section");
    section.innerHTML = "<p>Admin only</p>";
    return section;
  }

  const section = document.createElement("section");
  section.className = "admin-panel";

  // === TRIGGER BUTTONS FOR FORMS ===
  const actionBtns = document.createElement("div");
  actionBtns.innerHTML = `
    <button id="btn-new-post">➕ Create New Post</button>
    <button id="btn-new-page">➕ Create New Page</button>
  `;
  section.appendChild(actionBtns);

  // === JSON BUTTONS ===
  section.appendChild(createShowJsonButton(posts, "posts"));
  section.appendChild(createShowJsonButton(pages, "pages"));

  // === LIST WRAPPERS FIRST ===
  const postListWrap = document.createElement("div");
  postListWrap.className = "admin-block";
  postListWrap.innerHTML = `<h2>📚 All Posts</h2>`;
  const postList = document.createElement("ul");
  postList.className = "admin-list";
  postListWrap.appendChild(postList);

  const pageListWrap = document.createElement("div");
  pageListWrap.className = "admin-block";
  pageListWrap.innerHTML = `<h2>📘 All Pages</h2>`;
  const pageList = document.createElement("ul");
  pageList.className = "admin-list";
  pageListWrap.appendChild(pageList);

  section.append(postListWrap, pageListWrap);

  // === MODAL CONTAINER ===
  const modalOverlay = document.createElement("div");
  modalOverlay.id = "admin-modal";
  modalOverlay.className = "json-popup";
  modalOverlay.style.display = "none";

  const modalContent = document.createElement("div");
  modalContent.className = "popup-box";
  modalOverlay.appendChild(modalContent);
  section.appendChild(modalOverlay);

  function openModal(html) {
    modalContent.innerHTML = html;
    modalOverlay.style.display = "flex";
  }

  function closeModal() {
    modalOverlay.style.display = "none";
  }

  modalOverlay.addEventListener("click", e => {
    if (e.target === modalOverlay) closeModal();
  });

  // === RENDER POST LIST ===
  posts.forEach(post => {
    const item = document.createElement("li");
    item.className = "admin-list-item";
    item.innerHTML = `
      <b>${post.title}</b> by ${post.author}<br/>
      <small>[${post.visibility}]</small><br/>
      Tags: ${post.tag || "—"}<br/>
      Created: ${new Date(post.createdAt).toLocaleString()}<br/>
      Scheduled: ${new Date(post.scheduledAt).toLocaleString()}<br/>
      <button class="edit-post">✏️ Edit</button>
    `;
    item.querySelector(".edit-post").onclick = () => openPostForm(post);
    postList.appendChild(item);
  });

  // === RENDER PAGE LIST ===
  pages.forEach(page => {
    const item = document.createElement("li");
    item.className = "admin-list-item";
    item.innerHTML = `
      <b>${page.id}</b><br/>
      <button class="edit-page">✏️ Edit</button>
    `;
    item.querySelector(".edit-page").onclick = () => openPageForm(page);
    pageList.appendChild(item);
  });

  // === BIND BUTTON EVENTS ===
  actionBtns.querySelector("#btn-new-post").onclick = () => openPostForm(null);
  actionBtns.querySelector("#btn-new-page").onclick = () => openPageForm(null);

  // === FORM GENERATORS ===
  function openPostForm(post) {
    const isEdit = !!post;
    const formHTML = `
      <h2>${isEdit ? "Edit Post" : "New Post"}</h2>
      <form id="form-post">
        <input type="hidden" name="postId" value="${post?.id || ""}" />
        <input name="title" placeholder="Title" required value="${post?.title || ""}" />
        <input name="description" placeholder="Description" required value="${post?.description || ""}" />
        <input name="thumbnail" placeholder="Thumbnail URL" value="${post?.thumbnail || ""}" />
        <textarea name="pageHtml" placeholder="Full HTML content">${post?.pageHtml || ""}</textarea>
        <input name="tag" placeholder="Tags (tag1,tag2)" value="${post?.tag || ""}" />
        <input type="datetime-local" name="scheduledAt" value="${post?.scheduledAt ? new Date(post.scheduledAt).toISOString().slice(0,16) : ""}" />
        <select name="visibility">
          <option value="public" ${post?.visibility === "public" ? "selected" : ""}>Public</option>
          <option value="private" ${post?.visibility === "private" ? "selected" : ""}>Private</option>
          <option value="draft" ${post?.visibility === "draft" ? "selected" : ""}>Draft</option>
        </select>
        <button>${isEdit ? "Update" : "Create"} Post</button>
      </form>
    `;
    openModal(formHTML);

    const form = modalContent.querySelector("form");
    form.onsubmit = e => {
      e.preventDefault();
      const f = form.elements;
      const newPost = {
        id: post?.id || Date.now(),
        title: f.title.value,
        description: f.description.value,
        thumbnail: f.thumbnail.value || "https://via.placeholder.com/640x360",
        pageHtml: f.pageHtml.value,
        tag: f.tag.value,
        visibility: f.visibility.value,
        scheduledAt: f.scheduledAt.value ? new Date(f.scheduledAt.value).toISOString() : new Date().toISOString(),
        author: isLoggedIn().username,
        createdAt: post?.createdAt || new Date().toISOString(),
        lastModified: new Date().toISOString(),
        pinned: false,
        status: "draft",
        contentType: "post",
        views: post?.views || 0,
        likes: post?.likes || 0,
        shares: post?.shares || 0,
        meta: post?.meta || {},
        media: post?.media || {},
        permissions: post?.permissions || { canEdit: true, canDelete: true },
        comments: post?.comments || [],
        version: post ? post.version + 1 : 1,
        history: post ? [...post.history, post] : []
      };

      isEdit ? updateApp("updatePost", newPost) : updateApp("addPost", newPost);
      closeModal();
      updateApp("page", "adminPanel");
    };
  }

  function openPageForm(page) {
    const isEdit = !!page;
    const formHTML = `
      <h2>${isEdit ? "Edit Page" : "New Page"}</h2>
      <form id="form-page">
        <input name="pageId" placeholder="Page ID" required value="${page?.id || ""}" ${isEdit ? "readonly" : ""} />
        <textarea name="pageContent" placeholder="HTML Content" required>${page?.content || ""}</textarea>
        <button>${isEdit ? "Update" : "Create"} Page</button>
      </form>
    `;
    openModal(formHTML);

    const form = modalContent.querySelector("form");
    form.onsubmit = e => {
      e.preventDefault();
      const id = form.pageId.value.trim();
      const content = form.pageContent.value.trim();
      if (!id || !content) return alert("All fields required!");
      if (!isEdit && pages.some(p => p.id === id)) return alert("Page ID already exists!");

      if (isEdit) {
        page.content = content;
        page.lastModified = new Date().toISOString();
      } else {
        pages.push({
          id,
          content,
          permissions: { canEdit: true, canDelete: true },
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        });
      }

      savePages();
      closeModal();
      updateApp("page", "adminPanel");
    };
  }

  return section;
}

// ========== Helper: Show JSON Button ========== 
function createShowJsonButton(data, type = "posts") {
  const exportBtn = document.createElement("button");
  exportBtn.textContent = type === "posts" ? "📦 Show Posts JSON" : "📘 Show Pages JSON";
  exportBtn.className = "json-export-btn";

  exportBtn.onclick = () => {
    const popup = document.createElement("div");
    popup.className = "json-popup";

    const box = document.createElement("div");
    box.className = "popup-box";

    const closeBtn = document.createElement("button");
    closeBtn.className = "close-btn";
    closeBtn.textContent = "❌ Close";
    closeBtn.onclick = () => popup.remove();

    const pre = document.createElement("pre");

    const jsLiteral = (item) => {
      if (type === "pages") {
        return `{
  id: "${item.id}",
  content: \`\n${item.content.trim()}\n\`,
  permissions: {
    canEdit: ${item.permissions?.canEdit ?? true},
    canDelete: ${item.permissions?.canDelete ?? false}
  }
}`;
      } else {
        return `{
  id: ${item.id},
  title: "${item.title}",
  thumbnail: "${item.thumbnail}",
  description: "${item.description}",
  tag: "${item.tag}",
  author: VALID_CREDENTIALS.username,
  createdAt: new Date("${item.createdAt}"),
  lastModified: new Date("${item.lastModified}"),
  pinned: ${item.pinned},
  scheduledAt: new Date("${item.scheduledAt}"),
  pageHtml: \`${item.pageHtml}\`,
  visibility: "${item.visibility}",
  status: "${item.status}",
  views: ${item.views},
  likes: ${item.likes},
  shares: ${item.shares},
  contentType: "post",
  meta: ${JSON.stringify(item.meta, null, 2)},
  media: ${JSON.stringify(item.media, null, 2)},
  permissions: ${JSON.stringify(item.permissions, null, 2)},
  comments: ${JSON.stringify(item.comments, null, 2)},
  version: ${item.version},
  history: []
}`;
      }
    };

    const codeOutput = `[${data.map(jsLiteral).join(",\n\n")}];`;
    pre.textContent = codeOutput;

    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-btn";
    copyBtn.textContent = "📋 Copy All";
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(pre.textContent)
        .then(() => {
          copyBtn.textContent = "✅ Copied!";
          setTimeout(() => (copyBtn.textContent = "📋 Copy All"), 1500);
        })
        .catch(err => {
          alert("Copy failed. Please copy manually.");
          console.error("Clipboard error:", err);
        });
    };

    box.appendChild(closeBtn);
    box.appendChild(pre);
    box.appendChild(copyBtn);
    popup.appendChild(box);
    document.body.appendChild(popup);
  };

  return exportBtn;
}

// ========== Footer Renderer ========== 
function renderFooter() {
  const footer = document.createElement("footer");
  footer.innerHTML = `<small>© 2025 ${siteTitle}</small>`;
  return footer;
}

// ========== Scheduled Post Checker ==========
function checkScheduledPosts() {
  const now = new Date();
  posts.forEach(post => {
    if (
      post.scheduledAt &&
      new Date(post.scheduledAt) <= now &&
      post.visibility === "draft"
    ) {
      post.visibility = "public";
      post.lastModified = now.toISOString();
      updateApp("updatePost", post);
    }
  });
}

// ========== App Entry ==========
updateApp("page", "home");
checkScheduledPosts(); // Run once on load
setInterval(checkScheduledPosts, 60000); // Run every minute
