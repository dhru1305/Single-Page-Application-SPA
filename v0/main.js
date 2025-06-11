const pageData = {
    home: {
      title: "Home",
      goback: false,
      content: "Welcome to the Home Page!",
      extraHTML: `<button onclick="alert('Hello from Home!')">Click Me</button>`
    },
    allposts: {
      title: "All Posts",
      goback: true,
      content: "This is the post Page.",
      extraHTML: '<div id="postsList"></div>'
    },
    posts: {
      title: "Posts",
      goback: true,
      content: "This is the post Page.",
      extraHTML: '<div id="posts-container"></div>'
    },
    search: {
      title: "Search",
      goback: true,
      content: "This is the search Page.",
      extraHTML: `
        <div id="search-container">
          <input type="text" id="search-box" placeholder="Type to search..." />
          <div id="filter-bar"></div>
          <div id="results"></div>
        </div>
      `
    },
    popularposts: {
      title: "Popular Posts",
      goback: true,
      content: "These are the most viewed posts.",
      extraHTML: '<div id="popular-posts-container"></div>'
    }    
    ,
    about: {
      title: "About",
      goback: true,
      content: "This is the About Page.",
      extraHTML: `<img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgx2rDhbpQwqd_SrWBQQFDEqR2h-DuWVPMv3ua1vSWggbbjsbo3CmOSlsCt5D7JO_xY_-LYwU1BQCJEIYR5eH53e2nz2Bm3aJBDxzYMS_YxhuuFDBMmTSuiJkTQqImDmNGS5Y4Di-XtIDLUWB_xzxWgXGLdu7hP3EsQofU7N9cJcH41P6jwNvjmGBxHy7Qr/w640-h257/Marvelous%20Merchandise.png" alt="About Image"></img>`
    },
    contact: {
        title: "Contact",
        goback: true,
        content: "Reach out to us!",
        extraHTML: `<form onsubmit="event.preventDefault(); alert('Form submitted!')">
                      <input type="text" placeholder="Your name">
                      <button type="submit">Send</button>
                    </form>`
      },
      settings: {
        title: "Settings",
        goback: true,
        content: "Customize your experience.",
        extraHTML: `
          


        <div class="profile-pic-container">
        <img id="profilePreview" src="default-profile.png" alt="Profile Picture">
        <input type="file" id="upload-Btn" accept="image/*" onchange="previewImage()">
        <button onclick="previewUpload()">Upload Profile Picture</button>
        

      </div>
    
      

          <form onsubmit="event.preventDefault(); alert('Settings saved!')">
            <label>
              Theme:
              <select id="themeSelect">
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>

            <br><br>
            <label>
              <input type="checkbox" checked> Enable notifications
            </label>
            <br><br>
            <button type="submit">Save Settings</button>
          </form>
        `
      }
      
  };

//------------------------------------------------

// Globlal variables
const pages = document.querySelectorAll('.page');

// Dynamic history limit based on screen width
const HISTORY_LIMIT = window.innerWidth < 600 ? 10 : 20;
const customHistory = [];

function createNavButtons() {
  const nav = document.getElementById('nav');
  Object.keys(pageData).forEach(pageId => {
    const btn = document.createElement('button');
    btn.textContent = pageData[pageId].title;
    btn.dataset.pageId = pageId;
    btn.addEventListener('click', () => showPage(pageId));
    nav.appendChild(btn);
  });
  
  // Toast notification system
  function showToast(message, type) {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
  
    setTimeout(() => {
      toast.classList.add("visible");
    }, 10);
  
    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }
  
  // Add basic styles for toast notifications
  const style = document.createElement("style");
  style.textContent = `
    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #333;
      color: #fff;
      padding: 10px 20px;
      border-radius: 5px;
      opacity: 0;
      transition: opacity 0.3s, transform 0.3s;
      z-index: 1000;
    }
    .toast.visible {
      opacity: 1;
      transform: translateX(-50%) translateY(-10px);
    }
    .toast.success {
      background-color: #4caf50;
    }
    .toast.error {
      background-color: #f44336;
    }
  `;
  document.head.appendChild(style);
}

function showPage(pageId, updateHistory = true) {
  let baseId = pageId;
  let slug = null;

  // Slug check for post detail views like posts/some-title
  if (pageId.startsWith("posts/")) {
    baseId = "posts";
    slug = pageId.split("/")[1];
  }

  const data = pageData[baseId];
  if (!data) return;

  pages.forEach(page => {
    const isCurrent = page.id === baseId;
    page.style.display = isCurrent ? 'block' : 'none';

    if (isCurrent) {
      page.innerHTML = `
        <h2>${data.title}</h2>
        <p>${data.content}</p>
        <div class="content">${data.extraHTML}</div>
      `;

      // ✅ Page-specific logic
      switch (baseId) {
        case "popularposts":
          renderPopularPosts(10);
          break;
        case "allposts":
          renderPosts();
          break;
        case "search":
          setupSearchPage();
          break;
        // no-op for 'posts', singlePost handled below
      }
    }
  });

  // 🔁 Highlight nav
  document.querySelectorAll('#nav button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.pageId === baseId);
  });

  // ⏮ History state push
  if (updateHistory && window.location.hash.substring(1) !== pageId) {
    if (customHistory.length >= HISTORY_LIMIT) customHistory.shift();
    customHistory.push(pageId);
    history.pushState({ pageId }, '', `#${pageId}`);
  }

  updateBackButtonVisibility(baseId);

  // 🔎 Render a specific post via slug
  if (slug) {
    const post = postData.find(p => p.slug === slug);
    if (post) {
      renderSinglePost(post.id);
    } else {
      document.getElementById("posts-container").innerHTML = "<p>Post not found</p>";
    }
  }
}



function updateBackButtonVisibility(pageId) {
  const currentPage = pageData[pageId] || pageData.home;
  document.getElementById('backBtn').style.display = currentPage.goback ? 'inline-block' : 'none';
}

function initRouting() {
  createNavButtons();
  const hash = window.location.hash.substring(1);
  const initialPage = pageData[hash] ? hash : 'home';
  customHistory.push(initialPage);
  showPage(initialPage, false);
}

document.getElementById('backBtn').addEventListener('click', () => {
  history.back();
});

window.addEventListener('popstate', () => {
  const hash = window.location.hash.substring(1);
  showPage(hash, false); // 🔥 Slug-safe now
});


window.addEventListener('DOMContentLoaded', initRouting);

//----------------------------------------------------------

// all posts page
let postData = [
  {
    id: 1,
    title: "First Post",
    author: "Alice",
    date: "2025-04-20",
    time: "10:30 AM",
    tags: ["introduction", "welcome"],
    likes: 10,
    views: 100,
    scheduled: true,
    draft: false,
    pinned: true,
    summary: "A warm welcome to our blog!",
    commentsCount: 2,
    postImg: "https://example.com/images/post1.jpg",
    postHTML: '<p>hello</p>',
  },
  {
    id: 2,
    title: "second Post",
    author: "Alice",
    date: "2025-04-20",
    time: "10:30 AM",
    tags: ["introduction", "welcome"],
    likes: 100,
    views: 1000,
    scheduled: true,
    draft: false,
    pinned: true,
    summary: " welcome to our blog!",
    commentsCount: 2,
    postImg: "https://example.com/images/post1.jpg",
    postHTML: '<p>hello</p>',
  }
];

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

postData = postData.map(post => ({
  ...post,
  slug: generateSlug(post.title)
}));

// Function to render posts into #postsList

// onclick="javascript:void(0);" for opening the post

function renderPosts() {
  const postsList = document.getElementById("postsList");
  if (!postsList) return;
  postsList.innerHTML = "";
  postData.forEach((post) => {
    const postHTML = `
      <div class="post" id="post-${post.id}" onclick="javascript:void(0);"> 
        <div class="post-body">
          <header class="post-header">
            
              <h2 class="post-link" data-post-id="${post.id}">
                ${post.title}
              </h2>
           
            <p>${post.summary}</p>
            <p><strong>Author:</strong> ${post.author}</p>
            <p><strong>Tags:</strong> ${post.tags.join(", ")}</p>
          </header>
          <div class="post-body-content">
            ${post.postHTML}
          </div>
        </div>
      </div>
    `;
    postsList.insertAdjacentHTML("beforeend", postHTML);
  });
}

document.addEventListener("click", function (event) {
  if (event.target.classList.contains("post-link")) {
    const postId = parseInt(event.target.dataset.postId);
    const post = postData.find(p => p.id === postId);
    if (post) {
      const slug = post.slug;
      showPage(`posts/${slug}`);  // 👈 Now using slug!
    }
  }
});


// Use a MutationObserver to detect dynamic HTML insertion
const observer = new MutationObserver((mutationsList) => {
  for (let mutation of mutationsList) {
    if (mutation.type === "childList") {
      const postsList = document.getElementById("postsList");
      if (postsList && !postsList.dataset.rendered) {
        renderPosts();
        postsList.dataset.rendered = "true";
      }
    }
  }
});

// Start observing the whole body
document.addEventListener("DOMContentLoaded", () => {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
});


//----------------------------------------------------------

// single post page

function renderSinglePost(slugOrId) {
  const post = typeof slugOrId === "number"
    ? postData.find(p => p.id === slugOrId)
    : postData.find(p => p.slug === slugOrId);

  if (!post) {
    document.getElementById("posts-container").innerHTML = `<p>Post not found.</p>`;
    return;
  }

  const container = document.getElementById("posts-container");
  if (!container) return;

  container.innerHTML = `
    <div class="single-post">
      <h2>${post.title}</h2>
      <p><strong>By:</strong> ${post.author}</p>
      <p><strong>Date:</strong> ${post.date} at ${post.time}</p>
      <img src="${post.postImg}" alt="${post.title}" style="max-width:100%; height:auto;">
      <div class="post-body">${post.postHTML}</div>
      <p><strong>Likes:</strong> ${post.likes} | <strong>Views:</strong> ${post.views}</p>
      <p><strong>Tags:</strong> ${post.tags.join(', ')}</p>
      <p><strong>Comments:</strong> ${post.commentsCount}</p>
    </div>
  `;
}



//----------------------------------------------------------

// search page
function setupSearchPage() {
  const input = document.getElementById('search-box');
  const results = document.getElementById('results');
  const filterBar = document.getElementById('filter-bar');
  if (!input || !results || !filterBar) return;

  // 🌈 Extract unique tags
  const allTags = new Set();
  postData.forEach(post => post.tags.forEach(tag => allTags.add(tag)));

  // 🎯 Create filter buttons
  filterBar.innerHTML = `<strong>Quick Filters:</strong> `;
  allTags.forEach(tag => {
    const btn = document.createElement('button');
    btn.textContent = `#${tag}`;
    btn.dataset.tag = tag;
    btn.classList.add('filter-btn');
    btn.addEventListener('click', () => {
      input.value = tag;
      input.dispatchEvent(new Event('input'));
    });
    filterBar.appendChild(btn);
  });

  // 🧼 Clear button
  const clearBtn = document.createElement('button');
  clearBtn.textContent = "Clear Filter";
  clearBtn.classList.add('filter-btn');
  clearBtn.addEventListener('click', () => {
    input.value = '';
    results.innerHTML = '';
  });
  filterBar.appendChild(clearBtn);

  // 🔍 Input search
  input.addEventListener('input', function () {
    const query = this.value.trim().toLowerCase();
    results.innerHTML = "";

    if (!query) return;

    const matches = postData.filter(post =>
      post.title.toLowerCase().includes(query) ||
      post.summary.toLowerCase().includes(query) ||
      post.tags.some(tag => tag.toLowerCase().includes(query))
    );

    if (matches.length === 0) {
      results.innerHTML = `<p>No matching posts found.</p>`;
      return;
    }

    matches.forEach(post => {
      const postHTML = `
        <div class="search-result">
          <h3>${post.title}</h3>
          <p>${post.summary}</p>
          <button onclick="goToPost('${post.slug}')">View Post</button>
        </div>
      `;
      results.insertAdjacentHTML('beforeend', postHTML);
    });
  });
}



function goToPost(slugOrId) {
  showPage(`posts/${slugOrId}`);
}



//----------------------------------------------------------

// popular posts page 

function renderPopularPosts(limit = 10) {
  const container = document.getElementById("popular-posts-container");
  if (!container) return;

  container.innerHTML = `
    <div id="popular-filter-bar"><strong>Quick Filters:</strong></div>
    <div id="popular-results"></div>
  `;

  const results = document.getElementById("popular-results");
  const filterBar = document.getElementById("popular-filter-bar");

  // 💥 Get top viewed non-draft posts
  let filteredPopular = postData
    .filter(post => !post.draft)
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);

  // 🎯 Extract unique tags
  const allTags = new Set();
  filteredPopular.forEach(post => post.tags.forEach(tag => allTags.add(tag)));

  // 🧭 Create filter buttons
  allTags.forEach(tag => {
    const btn = document.createElement("button");
    btn.textContent = `#${tag}`;
    btn.dataset.tag = tag;
    btn.classList.add("filter-btn");
    btn.addEventListener("click", () => {
      renderFilteredPopular(tag);
    });
    filterBar.appendChild(btn);
  });

  // 🧼 Add clear/reset filter button
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Clear Filter";
  clearBtn.classList.add("filter-btn");
  clearBtn.addEventListener("click", () => {
    renderFilteredPopular();
  });
  filterBar.appendChild(clearBtn);

  // 🧠 Render filtered posts
  function renderFilteredPopular(filterTag = null) {
    results.innerHTML = "";

    const list = filterTag
      ? filteredPopular.filter(post =>
          post.tags.map(t => t.toLowerCase()).includes(filterTag.toLowerCase())
        )
      : filteredPopular;

    if (list.length === 0) {
      results.innerHTML = "<p>No matching posts found.</p>";
      return;
    }

    list.forEach(post => {
      const postHTML = `
        <div class="popular-post">
          <h3><a href="#posts/${post.slug}">${post.title}</a></h3>
          <img src="${post.postImg}" alt="${post.title}" style="max-width:100%; height:auto;" />
          <p>${post.summary}</p>
          <p><strong>Views:</strong> ${post.views}</p>
          <p><strong>Likes:</strong> ${post.likes} | <strong>Tags:</strong> ${post.tags.join(", ")}</p>
        </div>
      `;
      results.insertAdjacentHTML("beforeend", postHTML);
    });
  }

  renderFilteredPopular(); // initial render
}



//----------------------------------------------------------
// Theme Toggle with support for dynamic DOM
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

  function applyTheme(isDark, save = true) {
      document.body.classList.toggle("dark-mode", isDark);
      themeIcon.textContent = isDark ? "light_mode" : "dark_mode";
      const select = document.getElementById("themeSelect");
      if (select) select.value = isDark ? "dark" : "light";
      if (save) {
          localStorage.setItem("themePreference", isDark ? "dark" : "light");
      }
  }

  // Load preference
  const stored = localStorage.getItem("themePreference");
  const isDark = stored ? stored === "dark" : prefersDark.matches;
  applyTheme(isDark, false);

  // Manual toggle with button
  themeToggle.addEventListener("click", () => {
      const dark = !document.body.classList.contains("dark-mode");
      applyTheme(dark);
  });

  // Watch for dynamically added #themeSelect
  const observer = new MutationObserver(() => {
      const themeSelect = document.getElementById("themeSelect");
      if (themeSelect && !themeSelect.dataset.listenerAttached) {
          themeSelect.addEventListener("change", (e) => {
              applyTheme(e.target.value === "dark");
          });
          themeSelect.dataset.listenerAttached = "true";
          themeSelect.value = document.body.classList.contains("dark-mode") ? "dark" : "light";
      }
  });

  observer.observe(document.body, {
      childList: true,
      subtree: true
  });

  // Sync with system changes
  prefersDark.addEventListener("change", e => {
      if (!localStorage.getItem("themePreference")) {
          applyTheme(e.matches, false);
      }
  });
});


//-----------------------------------------------------------

// menu btn

document.addEventListener("DOMContentLoaded", () => {
  const menuButton = document.querySelector(".nav-menu-btn");
  const menuContainer = document.querySelector(".menu-cont");
  const pages = document.querySelectorAll('.page'); // Fixed selector to match '.page' instead of '.pages'

  if (!menuButton || !menuContainer) {
    console.error("Menu button or menu container not found.");
    return;
  }

  menuButton.addEventListener("click", () => {
    menuContainer.classList.toggle("active"); // Toggle the 'active' class to show/hide the menu

    pages.forEach(page => {
      if (menuContainer.classList.contains("active")) {
        page.style.marginLeft = "310px";
        page.style.marginRight = "1%"; // Move pages to the right
      } else {
        page.style.marginLeft = "auto";
        page.style.marginRight = "auto";  // Reset pages to their original position
      }
    });
  });

  // Close the menu when clicking outside of it
  document.addEventListener("click", (event) => {
    if (!menuContainer.contains(event.target) && !menuButton.contains(event.target)) {
      menuContainer.classList.remove("active");

      // Reset page margins when menu is closed
      pages.forEach(page => {
        page.style.marginLeft = "auto";
        page.style.marginRight = "auto"; 
      });
    }
  });
});

//-----------------------------------------------------------
// Replace template variable
function resolveTemplateVars(html) {
  const profileImg = localStorage.getItem('profileImage') || 'default-profile.png';
  console.log("🔁 Resolving ${profile-img} with:", profileImg);
  return html.replace(/\$\{profile-img\}/g, profileImg);
}

// Inject profile HTML using template
function renderProfileTemplate() {
  const container = document.getElementById("templatePreview");
  if (!container) {
    console.warn("⚠️ templatePreview container not found.");
    return;
  }
  // profile img template
  const html = `

    <img src="\${profile-img}" alt="Profile Picture" class="profile-img">

  `;
  container.innerHTML = resolveTemplateVars(html);
  console.log("📦 Profile template rendered.");
}

// Preview image from file input
function previewImage() {
  const file = document.getElementById('upload-Btn')?.files?.[0];
  if (!file) {
    console.warn("⚠️ No file selected.");
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById('profilePreview');
    if (img) {
      img.src = e.target.result;
      console.log("🖼️ Previewing image.");
    }
  };
  reader.readAsDataURL(file);
}

// Save previewed image to localStorage
function previewUpload() {
  const img = document.getElementById('profilePreview');
  const data = img?.src;

  if (data?.startsWith("data:image")) {
    localStorage.setItem('profileImage', data);
    console.log("💾 Profile image saved to localStorage.");
    renderProfileTemplate();
    alert('Profile picture saved!');
  } else {
    console.warn("❌ No valid image to save.");
    alert('Please choose an image first!');
  }
}

// Load profile image on page load
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('profileImage');
  const img = document.getElementById('profilePreview');

  if (img && saved) {
    img.src = saved;
    console.log("🔄 Loaded saved profile image.");
  }

  renderProfileTemplate();
});
