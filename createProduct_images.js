// ProductCreatePage.js
// Compatible with custom VDOM + Hooks + Router + Supabase
// Phiên bản Cách 2: Attach ảnh chạy ở Vercel API route (Edge hoặc Serverless)

/*
// Edit
const { h } = window.App.VDOM;
const { useState } = window.App.Hooks;
const { navigateTo } = window.App.Router;
*/

// ========================
// Product Info Section (giữ nguyên)
// ========================
function ProductSection({ product, setProduct, images, setImages }) {
  async function handleProductImages(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const newImages = await Promise.all(
        files.map(async (file, idx) => {
          const temp_path = await uploadToTmp(file);
          return {
            temp_path,
            variantIndex: null,
            display_order: images.filter(i => i.variantIndex === null).length + idx
          };
        })
      );
      setImages(prev => [...prev, ...newImages]);
    } catch (err) {
      alert("Lỗi upload ảnh sản phẩm: " + err.message);
    }
  }

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

    h("label", {}, "Ảnh sản phẩm chung (có thể chọn nhiều)"),
    h("input", {
      type: "file",
      accept: "image/*",
      multiple: true,
      onchange: handleProductImages
    }),

    h("div", { class: "preview-grid" },
      images.filter(img => img.variantIndex === null).map(img =>
        h("img", {
          src: supabase.storage.from('product-images').getPublicUrl(img.temp_path).data.publicUrl,
          style: "width: 100px; height: 100px; object-fit: cover; margin: 8px; border-radius: 4px;"
        })
      )
    )
  ]);
}

// ========================
// Variants Section (giữ nguyên)
// ========================
function VariantsSection({ variants, setVariants, images, setImages }) {
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

  async function handleVariantImages(e, variantIndex) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const newImages = await Promise.all(
        files.map(async (file, idx) => {
          const temp_path = await uploadToTmp(file);
          return {
            temp_path,
            variantIndex,
            display_order: images.filter(i => i.variantIndex === variantIndex).length + idx
          };
        })
      );
      setImages(prev => [...prev, ...newImages]);
    } catch (err) {
      alert("Lỗi upload ảnh biến thể: " + err.message);
    }
  }

  return h("section", { class: "card" }, [
    h("h3", {}, "2. Biến thể (Variants)"),

    ...variants.map((v, i) =>
      h("div", { class: "variant-item" }, [
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
        ]),

        h("label", {}, `Ảnh cho biến thể ${v.sku || i+1} (có thể chọn nhiều)`),
        h("input", {
          type: "file",
          accept: "image/*",
          multiple: true,
          onchange: e => handleVariantImages(e, i)
        }),

        h("div", { class: "preview-grid" },
          images.filter(img => img.variantIndex === i).map(img =>
            h("img", {
              src: supabase.storage.from('product-images').getPublicUrl(img.temp_path).data.publicUrl,
              style: "width: 80px; height: 80px; object-fit: cover; margin: 6px; border-radius: 4px;"
            })
          )
        )
      ])
    ),

    h("button", { class: "add-btn", onclick: addVariant }, "+ Thêm biến thể")
  ]);
}

// ========================
// Upload tạm (giữ nguyên)
// ========================
async function uploadToTmp(file) {
  const ext = file.name.split('.').pop() || 'jpg';
  const random = Math.random().toString(36).slice(2, 10);
  const fileName = `upload-${Date.now()}-${random}.${ext}`;
  const path = `tmp/${fileName}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw new Error(error.message);
  return path;
}

// ========================
// Build Payload RPC (giữ nguyên)
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
      .filter(v => v.sku && v.price > 0)
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
// ========================
// Section 4: Variant ↔ Attribute Mapping (ĐÃ FIX)
// Mỗi biến thể chỉ chọn 1 option cho mỗi attribute (radio group)
// ========================
function VariantAttributeSection({ variants, attributes, setVariants }) {
  // Hàm xử lý khi chọn một giá trị cho attribute của variant
  const select = (variantIndex, attrCode, value) => {
    const next = [...variants];
    next[variantIndex].attributes[attrCode] = value;
    setVariants(next);
  };

  return h("section", { class: "card" }, [
    h("h3", {}, "4. Gán thuộc tính cho từng biến thể"),

    ...variants.map((v, vi) =>
      h("div", { class: "variant-attr" }, [
        h("strong", {}, v.sku || v.title || `Biến thể ${vi + 1}`),

        // Lặp qua từng attribute (color, size, ...)
        ...attributes.map((attr) =>
          h("div", { style: "margin: 16px 0;" }, [
            h("label", { style: "font-weight: bold; display: block; margin-bottom: 8px;" }, 
              attr.name || attr.code || "Thuộc tính"
            ),

            // Tạo radio group cho từng giá trị của attribute
            ...attr.values.map((val) =>
              h("label", {
                style: "display: inline-block; margin-right: 20px; cursor: pointer;"
              }, [
                h("input", {
                  type: "radio",
                  name: `attr-${vi}-${attr.code}`,  // group radio riêng cho từng variant + attribute
                  value: val,
                  checked: v.attributes[attr.code] === val,
                  onchange: () => select(vi, attr.code, val)
                }),
                " " + val
              ])
            ),

            // Nếu chưa có giá trị nào được chọn, hiển thị cảnh báo nhẹ
            !v.attributes[attr.code] &&
              h("small", { style: "color: #e53e3e; display: block; margin-top: 4px;" }, 
                "Vui lòng chọn một giá trị"
              )
          ])
        )
      ])
    ),

    // Nếu chưa có variant nào thì nhắc nhở
    variants.length === 0 &&
      h("p", { style: "color: #666; text-align: center; margin: 20px 0;" }, 
        "Chưa có biến thể nào. Hãy thêm biến thể ở phần trên trước."
      )
  ]);
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
  const [images, setImages] = useState([]); // [{ temp_path, variantIndex?, display_order }]
  const [loading, setLoading] = useState(false);

  const canSubmit = product.name && product.slug && variants.length > 0;

  const submitProduct = async () => {
    if (!canSubmit) {
      alert("Vui lòng điền tên, slug và ít nhất một biến thể.");
      return;
    }

    setLoading(true);

    try {
      // 1. Tạo sản phẩm + variants + attributes
      const payload = buildPayload(product, variants, attributes);
      const { data: rpcResult, error: rpcError } = await supabase.rpc("admin_create_product", { payload });

      if (rpcError) throw new Error(rpcError.message || "Lỗi tạo sản phẩm");

      const productId = rpcResult.product_id;
      const variantMap = {};
      rpcResult.variants?.forEach(v => {
        if (v.sku) variantMap[v.sku] = v.variant_id;
      });

      // 2. Chuẩn bị payload cho Vercel API
      const attachPayload = {
        product_id: productId,
        images: images.map(img => ({
          temp_path: img.temp_path,
          variant_id: img.variantIndex !== null ? variantMap[variants[img.variantIndex]?.sku] : null,
          display_order: img.display_order
        })).filter(img => img.temp_path)
      };

      // 3. Gọi Vercel API route (Cách 2)
      // Nếu dùng Next.js: /api/attach-product-images
      // Nếu project API thuần: tùy cấu trúc, ví dụ /attach-product-images
      const apiUrl = '/api/attach-product-images';  // thay nếu route khác

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attachPayload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const attachResult = await res.json();

      if (!attachResult.success) {
        throw new Error(attachResult.error || "Attach ảnh thất bại");
      }

      alert("Tạo sản phẩm và ảnh thành công!");
      navigateTo("/products");
    } catch (e) {
      console.error(e);
      alert("Lỗi: " + (e.message || "Không xác định"));
    } finally {
      setLoading(false);
    }
  };

  return h("div", { style: "max-width: 900px; margin: 0 auto; padding: 20px;" }, [
    h("h2", {}, "Tạo sản phẩm mới"),

    h(ProductSection, { product, setProduct, images, setImages }),
    h(VariantsSection, { variants, setVariants, images, setImages }),
    h(AttributesSection, { attributes, setAttributes }),
    h(VariantAttributeSection, { variants, attributes, setVariants }),

    h("button", {
      onclick: submitProduct,
      disabled: loading || !canSubmit,
      style: "margin-top: 24px; padding: 12px 32px; font-size: 18px;"
    }, loading ? "Đang lưu..." : "Tạo sản phẩm")
  ]);
}