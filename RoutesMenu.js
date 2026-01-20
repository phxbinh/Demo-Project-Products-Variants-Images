// MyTasks.js

// ====================
// Home Page
// ====================
function Home() {
  return h("div", { style: { padding: "2rem", textAlign: "center" } },
    h("h1", null, "Welcome to My App"),
    h("p", null, "Đây là trang chủ"),
    h(Link, { to: "/auth", children: "Đi đến Đăng nhập / Đăng ký"}),
    h("br"), h("br"),
    h(Link, { to: "/dashboard", children: "Dashboard (yêu cầu đăng nhập)"})
  );
}

// ====================
// Routes
// ====================
window.App.Router.addRoute("/", Home);

window.App.Router.addRoute("/admin/products/create", ProductCreatePage);
window.App.Router.addRoute("/admin/products/view", ProductListPage);
window.App.Router.addRoute("/admin/products/detail", ProductDetailPage);

// Navbar đơn giản
window.App.Router.navbarDynamic({
  navbar: () => h("nav", {
    style: {
      background: "#333",
      color: "white",
      padding: "1rem",
      textAlign: "center"
    }
  },
    h(Link, { to: "/", style: { color: "white", margin: "0 1rem" }, children: "Home"}),
    h(Link, { to: "/admin/products/create", style: { color: "white", margin: "0 1rem" }, children: "Create Product" }),
    h(Link, { to: "/admin/products/view", style: { color: "white", margin: "0 1rem" }, children: "View Product" })
    h(Link, { to: "/admin/products/detail", style: { color: "white", margin: "0 1rem" }, children: "View Detail" })

  )
});


// ====================
// Khởi động App
// ====================
const mountEl = document.getElementById("app");
window.App.Router.init(mountEl, { hash: false }); // Dùng history mode

// Fallback 404
window.App.Router.setNotFound(() => h("div", { style: { padding: "2rem", textAlign: "center" } },
  h("h1", null, "404 - Không tìm thấy trang")
));