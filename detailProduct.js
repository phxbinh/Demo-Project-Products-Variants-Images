
/*
function ProductDetailPage({ params }) {
  const slug = params.slug;

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // 1. Load product
        const { data: p, error: pErr } = await supabase
          .from("products")
          .select("id, name, slug, description, thumbnail_url, status")
          .eq("slug", slug)
          .eq("status", "active")
          .single();

        if (pErr || !p) throw new Error("Không tìm thấy sản phẩm");

        setProduct(p);

        // 2. Load variants + attributes từ view
        const { data: rows, error: vErr } = await supabase
          .from("public_product_variants_with_attrs_view")
          .select("variant_id, price, stock, attribute_code, attribute_value")
          .eq("product_id", p.id);

        if (vErr) throw vErr;

        setVariants(groupVariants(rows));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug]);

  // Tự động tìm variant khớp khi chọn attribute
  useEffect(() => {
    if (!variants.length || Object.keys(selectedAttrs).length === 0) {
      setSelectedVariant(null);
      return;
    }

    const found = variants.find(v =>
      Object.entries(selectedAttrs).every(([k, val]) => v.attrs[k] === val)
    );

    setSelectedVariant(found || null);
  }, [selectedAttrs, variants]);

  if (loading) return h("p", {}, "Đang tải...");
  if (error) return h("p", { style: "color: red;" }, error);
  if (!product) return h("p", {}, "Sản phẩm không tồn tại");

  const attributes = collectAttributes(variants);

  return h("div", { className: "product-detail" },
    h("h1", {}, product.name),

    h("img", {
      src: product.thumbnail_url || "/assets/images/placeholder-product.svg",
      alt: product.name,
      className: "product-image",
      onerror: (e) => { e.target.src = "/assets/images/placeholder-product.svg"; }
    }),

    // Attribute selectors (button style)
    ...Object.entries(attributes).map(([code, values]) =>
      h("div", { className: "attr-group" },
        h("label", {}, code.toUpperCase()),
        h("div", { className: "attr-options" },
          ...values.map(val =>
            h("button", {
              className: selectedAttrs[code] === val ? "active" : "",
              onClick: () => setSelectedAttrs({ ...selectedAttrs, [code]: val })
            }, val)
          )
        )
      )
    ),

    // Price & Stock
    h("div", { className: "price-block" },
      selectedVariant
        ? h("div", {},
            h("strong", {}, `${selectedVariant.price.toLocaleString('vi-VN')} ₫`),
            selectedVariant.stock > 0
              ? h("p", {}, `Còn ${selectedVariant.stock} cái`)
              : h("p", { style: "color: red;" }, "Hết hàng")
          )
        : h("p", { style: "color: #666;" }, "Vui lòng chọn đầy đủ thuộc tính")
    ),

    // Thêm mô tả nếu muốn
    product.description && h("div", { className: "description" }, product.description)
  );
}
*/

function ProductDetailPage({ params }) {
  const slug = params.slug;

  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect load data giữ nguyên như cũ
  // useEffect auto select variant giữ nguyên

  if (loading) return h('p', { className: styles.hint }, 'Đang tải...');
  if (error) return h('p', { style: { color: '#dc2626', fontWeight: 500 } }, error);
  if (!product) return h('p', { className: styles.hint }, 'Sản phẩm không tồn tại');

  const attributes = collectAttributes(variants);

  return h('div', { className: styles.container },
    h('h1', { className: styles.title }, product.name),

    h('img', {
      src: product.thumbnail_url || '/assets/images/placeholder-product.svg',
      alt: product.name,
      className: styles.productImage,
      onError: (e) => { e.target.src = '/assets/images/placeholder-product.svg'; }
    }),

    // Attribute selectors
    ...Object.entries(attributes).map(([code, values]) =>
      h('div', { className: styles.attrGroup, key: code },
        h('label', {}, code.toUpperCase()),
        h('div', { className: styles.attrOptions },
          ...values.map(val =>
            h('button', {
              key: val,
              className: selectedAttrs[code] === val ? styles.active : '',
              onClick: () => setSelectedAttrs(prev => ({ ...prev, [code]: val }))
            }, val)
          )
        )
      )
    ),

    // Price & Stock block
    h('div', { className: styles.priceBlock },
      selectedVariant
        ? h('div', {},
            h('div', { className: styles.price },
              `${selectedVariant.price.toLocaleString('vi-VN')} ₫`
            ),
            selectedVariant.stock > 0
              ? h('p', { className: styles.stockInfo }, `Còn ${selectedVariant.stock} cái`)
              : h('p', { className: styles.stockOut }, 'Hết hàng')
          )
        : h('p', { className: styles.hint }, 'Vui lòng chọn đầy đủ thuộc tính')
    ),

    product.description && h('div', { className: styles.description }, product.description)
  );
}




// groupVariants & collectAttributes giữ nguyên như bạn viết
function groupVariants(rows = []) {
  const map = {};
  rows.forEach(r => {
    if (!map[r.variant_id]) {
      map[r.variant_id] = {
        id: r.variant_id,
        price: r.price,
        stock: r.stock,
        attrs: {}
      };
    }
    if (r.attribute_code) {
      map[r.variant_id].attrs[r.attribute_code] = r.attribute_value;
    }
  });
  return Object.values(map);
}

function collectAttributes(variants) {
  const result = {};
  variants.forEach(v => {
    Object.entries(v.attrs).forEach(([k, val]) => {
      if (!result[k]) result[k] = new Set();
      result[k].add(val);
    });
  });
  Object.keys(result).forEach(k => {
    result[k] = Array.from(result[k]).sort(); // sort để hiển thị đẹp hơn
  });
  return result;
}