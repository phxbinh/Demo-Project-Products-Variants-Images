// ProductListPage.js
// Compatible with custom VDOM + Hooks + Router + Supabase
/*
const { h } = window.App.VDOM;
const { useState, useEffect } = window.App.Hooks;
const { navigateTo } = window.App.Router;
*/
// ========================
// Product Card Component
// ========================
function ProductCard({ product }) {
  if (!product) {
    return h('div', { className: 'product-card--empty' }, 'Không có sản phẩm');
  }

  const {
    name,
    slug,
    thumbnail_url,
    min_price,
    original_price,
    discount_percentage = 0,
    is_out_of_stock = false,
  } = product;

  const hasDiscount = discount_percentage > 0 && original_price > min_price;
  const displayPrice = min_price != null ? min_price : null;
  const isUnavailable = is_out_of_stock || displayPrice == null;

  const priceFormatted = displayPrice != null
    ? Number(displayPrice).toLocaleString('vi-VN') + ' ₫'
    : null;

  const originalPriceFormatted = hasDiscount
    ? Number(original_price).toLocaleString('vi-VN') + ' ₫'
    : null;

  const goToDetail = () => {
    if (slug) navigateTo(`/products/${slug}`);
  };

  return h(
    'div',
    {
      className: `product-card ${isUnavailable ? 'product-card--out-of-stock' : ''} ${hasDiscount ? 'product-card--has-discount' : ''}`,
      onClick: goToDetail,
      role: 'button',
      tabindex: '0',
      onkeydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToDetail();
        }
      },
    },

    // Image + Badge
    h(
      'div',
      { className: 'product-card__image-container' },
      [
        h('img', {
          src: thumbnail_url || '/assets/images/placeholder-product.svg',
          alt: name || 'Sản phẩm',
          loading: 'lazy',
          className: 'product-card__image',
          onerror: (e) => { e.target.src = '/assets/images/placeholder-product.svg'; },
        }),

        hasDiscount &&
          h('span', { className: 'product-card__badge product-card__badge--discount' }, `-${discount_percentage}%`),

        isUnavailable &&
          h(
            'div',
            { className: 'product-card__sold-out-overlay' },
            h('span', { className: 'product-card__sold-out-text' }, 'Hết hàng')
          )
      ]
    ),

    // Info
    h(
      'div',
      { className: 'product-card__info' },
      [
        h(
          'h3',
          { className: 'product-card__name', title: name },
          name || 'Tên sản phẩm'
        ),

        h(
          'div',
          { className: 'product-card__price-block' },
          isUnavailable
            ? h('span', { className: 'product-card__price--unavailable' }, 'Hết hàng')
            : h('span', { className: 'product-card__current-price' }, priceFormatted),

          hasDiscount &&
            h('span', { className: 'product-card__original-price' }, originalPriceFormatted)
        )
      ]
    )
  );
}

// ========================
// Product List Page
// ========================
function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchProducts() {
      // Giả sử bạn đã tạo view public_products_view như hướng dẫn trước
      const { data, error } = await supabase
        .from("public_products_view")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && mounted) {
        setProducts(data || []);
      }
      setLoading(false);
    }

    fetchProducts();

    return () => { mounted = false; };
  }, []);

  if (loading) {
    return h("p", { className: "no-products" }, "Đang tải sản phẩm...");
  }

  return h(
    "div",
    {},
    [
      h("h3", {}, "Danh sách sản phẩm"),

      h(
        "div",
        { className: "product-grid" },
        products.length === 0
          ? h("p", { className: "no-products" }, "Chưa có sản phẩm nào")
          : products.map(p =>
              h(ProductCard, { key: p.id, product: p })
            )
      )
    ]
  );
}