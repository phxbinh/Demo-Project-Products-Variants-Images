// ProductCreatePage.js
// FIXED VERSION – SAFE FOR PRODUCTION
/*
const { h } = window.App.VDOM;
const { useState } = window.App.Hooks;
const { navigateTo } = window.App.Router;
*/
/* ========================
   Helpers
======================== */

const uid = () => crypto.randomUUID();

/* ========================
   Product Section
======================== */
function ProductSection({ product, setProduct, images, setImages }) {
  async function handleProductImages(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const baseOrder = images.filter(i => i.variant_client_id === null).length;

    const uploaded = await Promise.all(
      files.map(async (file, idx) => ({
        temp_path: await uploadToTmp(file),
        variant_client_id: null,
        display_order: baseOrder + idx
      }))
    );

    setImages(prev => [...prev, ...uploaded]);
  }

  return h("section", { class: "card" }, [
    h("h3", {}, "1. Thông tin sản phẩm"),

    h("input", {
      placeholder: "Tên sản phẩm",
      value: product.name,
      oninput: e => setProduct({ ...product, name: e.target.value })
    }),

    h("input", {
      placeholder: "Slug",
      value: product.slug,
      oninput: e =>
        setProduct({
          ...product,
          slug: e.target.value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
        })
    }),

    h("textarea", {
      placeholder: "Mô tả",
      value: product.description,
      oninput: e => setProduct({ ...product, description: e.target.value })
    }),

    h("input", {
      type: "file",
      multiple: true,
      accept: "image/*",
      onchange: handleProductImages
    }),

    h(
      "div",
      { class: "preview-grid" },
      images
        .filter(i => i.variant_client_id === null)
        .map(img =>
          h("img", {
            src: supabase.storage
              .from("product-images")
              .getPublicUrl(img.temp_path).data.publicUrl
          })
        )
    )
  ]);
}

/* ========================
   Variants Section
======================== */
function VariantsSection({ variants, setVariants, images, setImages }) {
  const addVariant = () =>
    setVariants(v => [
      ...v,
      {
        client_id: uid(),
        sku: "",
        title: "",
        price: 0,
        stock: 0,
        is_active: true,
        attributes: {}
      }
    ]);

  const update = (id, field, value) =>
    setVariants(v =>
      v.map(x => (x.client_id === id ? { ...x, [field]: value } : x))
    );

  async function handleVariantImages(e, clientId) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const baseOrder = images.filter(i => i.variant_client_id === clientId).length;

    const uploaded = await Promise.all(
      files.map(async (file, idx) => ({
        temp_path: await uploadToTmp(file),
        variant_client_id: clientId,
        display_order: baseOrder + idx
      }))
    );

    setImages(prev => [...prev, ...uploaded]);
  }

  return h("section", { class: "card" }, [
    h("h3", {}, "2. Biến thể"),

    ...variants.map(v =>
      h("div", { class: "variant" }, [
        h("input", {
          placeholder: "SKU",
          value: v.sku,
          oninput: e => update(v.client_id, "sku", e.target.value)
        }),
        h("input", {
          placeholder: "Giá",
          type: "number",
          value: v.price,
          oninput: e => update(v.client_id, "price", +e.target.value || 0)
        }),
        h("input", {
          placeholder: "Kho",
          type: "number",
          value: v.stock,
          oninput: e => update(v.client_id, "stock", +e.target.value || 0)
        }),

        h("input", {
          type: "file",
          multiple: true,
          onchange: e => handleVariantImages(e, v.client_id)
        }),

        h(
          "div",
          { class: "preview-grid" },
          images
            .filter(i => i.variant_client_id === v.client_id)
            .map(img =>
              h("img", {
                src: supabase.storage
                  .from("product-images")
                  .getPublicUrl(img.temp_path).data.publicUrl
              })
            )
        )
      ])
    ),

    h("button", { onclick: addVariant }, "+ Thêm biến thể")
  ]);
}

/* ========================
   Attributes Section
======================== */
function AttributesSection({ attributes, setAttributes }) {
  const addAttr = () =>
    setAttributes(a => [...a, { code: "", name: "", values: [] }]);

  return h("section", { class: "card" }, [
    h("h3", {}, "3. Thuộc tính"),

    ...attributes.map((a, i) =>
      h("div", {}, [
        h("input", {
          placeholder: "code",
          value: a.code,
          oninput: e => {
            const next = [...attributes];
            next[i].code = e.target.value.toLowerCase();
            setAttributes(next);
          }
        }),
        h("input", {
          placeholder: "name",
          value: a.name,
          oninput: e => {
            const next = [...attributes];
            next[i].name = e.target.value;
            setAttributes(next);
          }
        }),

        h(
          "button",
          {
            onclick: () => {
              const next = [...attributes];
              next[i].values.push("");
              setAttributes(next);
            }
          },
          "+ value"
        ),

        ...a.values.map((v, vi) =>
          h("input", {
            value: v,
            oninput: e => {
              const next = [...attributes];
              next[i].values[vi] = e.target.value;
              setAttributes(next);
            }
          })
        )
      ])
    ),

    h("button", { onclick: addAttr }, "+ Thuộc tính")
  ]);
}

/* ========================
   Variant Attribute Mapping
======================== */
function VariantAttributeSection({ variants, attributes, setVariants }) {
  const select = (vid, code, value) =>
    setVariants(v =>
      v.map(x =>
        x.client_id === vid
          ? { ...x, attributes: { ...x.attributes, [code]: value } }
          : x
      )
    );

  return h("section", { class: "card" }, [
    h("h3", {}, "4. Gán thuộc tính"),

    ...variants.map(v =>
      h("div", {}, [
        h("strong", {}, v.sku || v.client_id),

        ...attributes.map(attr =>
          h("div", {}, [
            h("div", {}, attr.name || attr.code),

            ...attr.values.map(val =>
              h("label", {}, [
                h("input", {
                  type: "radio",
                  name: `${v.client_id}-${attr.code}`,
                  checked: v.attributes[attr.code] === val,
                  onchange: () => select(v.client_id, attr.code, val)
                }),
                val
              ])
            )
          ])
        )
      ])
    )
  ]);
}

/* ========================
   Upload TMP
======================== */
async function uploadToTmp(file) {
  const ext = file.name.split(".").pop();
  const name = `tmp/${Date.now()}-${uid()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(name, file, { upsert: false });

  if (error) throw error;
  return name;
}

/* ========================
   Build Payload
======================== */
function buildPayload(product, variants, attributes) {
  return {
    product,
    attributes: attributes.filter(a => a.code && a.values.length),
    variants: variants.map(v => ({
      sku: v.sku,
      title: v.title,
      price: v.price,
      stock: v.stock,
      is_active: v.is_active,
      attributes: v.attributes
    }))
  };
}

/* ========================
   MAIN
======================== */
function ProductCreatePage() {
  const [product, setProduct] = useState({
    name: "",
    slug: "",
    description: "",
    status: "draft"
  });

  const [variants, setVariants] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const valid =
    product.name &&
    product.slug &&
    variants.length &&
    variants.every(v =>
      attributes.every(a => v.attributes[a.code])
    );
/*
  const submit = async () => {
    if (!valid) return alert("Thiếu dữ liệu");

    setLoading(true);
    try {
      const payload = buildPayload(product, variants, attributes);

      const { data, error } = await supabase.rpc(
        "admin_create_product_with_variants",
        { payload }
      );
      if (error) throw error;

      // map SKU → variant_id
      const skuMap = {};
      data.variants.forEach(v => {
        skuMap[v.sku] = v.variant_id;
      });

      const attach = {
        product_id: data.product_id,
        images: images.map(i => ({
          temp_path: i.temp_path,
          variant_id: i.variant_client_id
            ? skuMap[
                variants.find(v => v.client_id === i.variant_client_id)?.sku
              ]
            : null,
          display_order: i.display_order
        }))
      };

      await fetch("/api/attach-product-images", {
        method: "POST",
        body: JSON.stringify(attach),
        headers: { "Content-Type": "application/json" }
      });

      alert("Tạo sản phẩm thành công!");
      navigateTo("/products");
    } catch (e) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };
*/
async function submit() {
  // 1. create product + variants
  const rpcRes = await supabase.rpc(
    'admin_create_product_with_variants',
    payload
  );

  if (rpcRes.error) throw rpcRes.error;

  const { product_id, variants } = rpcRes.data;

  // 2. build map client_id → variant_id
  const variantIdMap = {};
  for (const v of variants) {
    variantIdMap[v.client_id] = v.variant_id;
  }

  // 3. map images
  const imagesToAttach = tempImages
    .map(img => {
      if (img.client_variant_id) {
        const variant_id = variantIdMap[img.client_variant_id];
        if (!variant_id) return null;

        return { ...img, variant_id };
      }
      return { ...img, product_id };
    })
    .filter(Boolean);

  if (imagesToAttach.length === 0) {
    throw new Error('Không có ảnh nào được attach thành công');
  }

  // 4. attach images
  await fetch('/api/admin/attach-product-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id,
      images: imagesToAttach
    })
  });
}

  return h("div", {}, [
    h(ProductSection, { product, setProduct, images, setImages }),
    h(VariantsSection, { variants, setVariants, images, setImages }),
    h(AttributesSection, { attributes, setAttributes }),
    h(VariantAttributeSection, { variants, attributes, setVariants }),

    h(
      "button",
      { onclick: submit, disabled: loading },
      loading ? "Đang lưu..." : "Tạo sản phẩm"
    )
  ]);
}