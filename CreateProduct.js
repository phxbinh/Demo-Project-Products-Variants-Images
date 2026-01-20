// ProductCreatePage.js
// Compatible with custom VDOM + Hooks + Router + Supabase

/*
const { h } = window.App.VDOM;
const { useState } = window.App.Hooks;
const { navigateTo } = window.App.Router;
*/

// ========================
// Product Info Section
// ========================
function ProductSection({ product, setProduct }) {
  return h("section", { class: "card" }, [
    h("h3", {}, "1. Thông tin sản phẩm"),

    h("label", {}, "Tên sản phẩm"),
    h("input", {
      value: product.name,
      placeholder: "Áo thun basic",
      oninput: e => setProduct({ ...product, name: e.target.value })
    }),

    h("label", {}, "Slug (duy nhất, không dấu, dùng cho URL)"),
    h("input", {
      value: product.slug,
      placeholder: "ao-thun-basic",
      oninput: e => setProduct({ ...product, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })
    }),

    h("label", {}, "Mô tả ngắn"),
    h("input", {
      value: product.short_description,
      placeholder: "Mô tả ngắn gọn hiển thị ở danh sách",
      oninput: e => setProduct({ ...product, short_description: e.target.value })
    }),

    h("label", {}, "Mô tả chi tiết"),
    h("textarea", {
      value: product.description,
      placeholder: "Mô tả đầy đủ, tính năng, chất liệu...",
      rows: 6,
      oninput: e => setProduct({ ...product, description: e.target.value })
    }),

    h("label", {}, "Thumbnail URL (tạm thời)"),
    h("input", {
      value: product.thumbnail_url,
      placeholder: "https://.../thumbnail.jpg",
      oninput: e => setProduct({ ...product, thumbnail_url: e.target.value })
    })
  ]);
}

// ========================
// Variants Section
// ========================
function VariantsSection({ variants, setVariants }) {
  const addVariant = () => {
    setVariants([
      ...variants,
      { sku: "", title: "", price: 0, stock: 0, is_active: true, attributes: {} }
    ]);
  };

  const update = (index, field, value) => {
    const next = [...variants];
    next[index][field] = value;
    setVariants(next);
  };

  return h("section", { class: "card" }, [
    h("h3", {}, "2. Biến thể (Variants)"),

    ...variants.map((v, i) =>
      h("div", { class: "row" }, [
        h("input", {
          placeholder: "SKU (ví dụ: TS-RED-M)",
          value: v.sku,
          oninput: e => update(i, "sku", e.target.value)
        }),
        h("input", {
          placeholder: "Tiêu đề biến thể",
          value: v.title,
          oninput: e => update(i, "title", e.target.value)
        }),
        h("input", {
          type: "number",
          min: 0,
          placeholder: "Giá (VND)",
          value: v.price,
          oninput: e => update(i, "price", +e.target.value || 0)
        }),
        h("input", {
          type: "number",
          min: 0,
          placeholder: "Tồn kho",
          value: v.stock,
          oninput: e => update(i, "stock", +e.target.value || 0)
        })
      ])
    ),

    h("button", { class: "add-btn", onclick: addVariant }, "+ Thêm biến thể")
  ]);
}

// ========================
// Attributes Section
// ========================
function AttributesSection({ attributes, setAttributes }) {
  const addAttribute = () => {
    setAttributes([...attributes, { code: "", name: "", values: [] }]);
  };

  const updateAttr = (i, field, value) => {
    const next = [...attributes];
    next[i][field] = value;
    setAttributes(next);
  };

  const addValue = (i) => {
    const next = [...attributes];
    next[i].values.push("");
    setAttributes(next);
  };

  const updateValue = (i, vi, value) => {
    const next = [...attributes];
    next[i].values[vi] = value;
    setAttributes(next);
  };

  return h("section", { class: "card" }, [
    h("h3", {}, "3. Thuộc tính (Attributes)"),

    ...attributes.map((a, i) =>
      h("div", { class: "attr" }, [
        h("input", {
          placeholder: "Code (ví dụ: color, size)",
          value: a.code,
          oninput: e => updateAttr(i, "code", e.target.value.toLowerCase())
        }),
        h("input", {
          placeholder: "Tên hiển thị (Màu sắc, Kích cỡ)",
          value: a.name,
          oninput: e => updateAttr(i, "name", e.target.value)
        }),

        h("button", { class: "add-btn", onclick: () => addValue(i) }, "+ Thêm giá trị"),

        ...a.values.map((val, vi) =>
          h("input", {
            placeholder: "Giá trị (Red, M, XL...)",
            value: val,
            oninput: e => updateValue(i, vi, e.target.value)
          })
        )
      ])
    ),

    h("button", { class: "add-btn", onclick: addAttribute }, "+ Thêm thuộc tính")
  ]);
}

// ========================
// Variant ↔ Attribute Mapping
// ========================
function VariantAttributeSection({ variants, attributes, setVariants }) {
  const select = (variantIndex, attrCode, value) => {
    const next = [...variants];
    next[variantIndex].attributes[attrCode] = value;
    setVariants(next);
  };

  return h("section", { class: "card" }, [
    h("h3", {}, "4. Gán thuộc tính cho biến thể"),

    ...variants.map((v, vi) =>
      h("div", { class: "variant-attr" }, [
        h("strong", {}, v.sku || `Biến thể ${vi + 1}`),

        attributes.map(a =>
          h("div", {}, [
            h("span", { style: "font-weight: 600; display: block; margin: 8px 0 4px;" }, a.name || a.code),
            ...a.values.map(val =>
              h("label", { style: "margin-right: 16px; display: inline-block;" }, [
                h("input", {
                  type: "radio",
                  name: `attr-${vi}-${a.code}`,
                  checked: v.attributes[a.code] === val,
                  onchange: () => select(vi, a.code, val)
                }),
                " " + val
              ])
            )
          ])
        )
      ])
    )
  ]);
}

// ========================
// Build Payload cho RPC
// ========================
function buildPayload(product, variants, attributes) {
  return {
    product: {
      name: product.name,
      slug: product.slug,
      short_description: product.short_description,
      description: product.description,
      status: product.status || "draft",
      thumbnail_url: product.thumbnail_url || null
    },
    attributes: attributes.filter(a => a.code && a.values.length > 0),
    variants: variants
      .filter(v => v.sku && v.price > 0) // Lọc variant hợp lệ
      .map(v => ({
        sku: v.sku,
        title: v.title,
        price: v.price,
        stock: v.stock,
        is_active: v.is_active,
        attributes: v.attributes
      }))
  };
}

// ========================
// MAIN PAGE
// ========================
function ProductCreatePage() {
  const [product, setProduct] = useState({
    name: "",
    slug: "",
    short_description: "",
    description: "",
    thumbnail_url: "",
    status: "draft"
  });

  const [variants, setVariants] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);

  const canSubmit = product.name && product.slug && variants.length > 0;

  const submitProduct = async () => {
    if (!canSubmit) {
      alert("Vui lòng điền tên, slug và ít nhất một biến thể.");
      return;
    }

    setLoading(true);

    try {
      const payload = buildPayload(product, variants, attributes);

      const { error } = await supabase.rpc("admin_create_product", { payload });

      if (error) throw new Error(error.message || "Lỗi khi tạo sản phẩm");

      alert("Tạo sản phẩm thành công!");
      navigateTo("/products"); // hoặc "/" tùy router
    } catch (e) {
      alert("Lỗi: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return h("div", { style: "max-width: 900px; margin: 0 auto; padding: 20px;" }, [
    h("h2", {}, "Tạo sản phẩm mới"),

    h(ProductSection, { product, setProduct }),
    h(VariantsSection, { variants, setVariants }),
    h(AttributesSection, { attributes, setAttributes }),
    h(VariantAttributeSection, { variants, attributes, setVariants }),

    h("button", {
      onclick: submitProduct,
      disabled: loading || !canSubmit,
      style: "margin-top: 24px; padding: 12px 32px; font-size: 18px;"
    }, loading ? "Đang lưu..." : "Tạo sản phẩm")
  ]);
}