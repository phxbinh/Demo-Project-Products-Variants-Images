// api/attach-product-images.js
// Chạy ở Edge Runtime (hoặc Serverless nếu comment config)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Kiểm tra env vars ngay đầu (runtime check)
if (!supabaseUrl) {
  throw new Error('Thiếu biến môi trường SUPABASE_URL');
}
if (!supabaseServiceKey) {
  throw new Error('Thiếu biến môi trường SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Optional: Chạy Edge Runtime (comment nếu muốn Serverless/Node.js)
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { product_id, images } = body;

    if (!product_id || !Array.isArray(images) || images.length === 0) {
      return Response.json({ error: 'Thiếu product_id hoặc images' }, { status: 400 });
    }

    const results = [];
    const bucket = 'product-images';

    for (const img of images) {
      const { temp_path, variant_id = null, display_order = 0 } = img;
      if (!temp_path) continue;

      const destFolder = variant_id ? `variants/${variant_id}` : `products/${product_id}`;
      const fileExt = temp_path.split('.').pop() || 'jpg';
      const fileName = `${display_order + 1}.${fileExt}`;
      const destPath = `${destFolder}/${fileName}`;

      // Copy file từ tmp → đích
      const { error: copyError } = await supabase.storage
        .from(bucket)
        .copy(temp_path, destPath);

      if (copyError) {
        results.push({ temp_path, error: copyError.message });
        continue;
      }

      // Lấy public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(destPath);

      // Insert vào bảng product_images
      const insertData = {
        product_id: variant_id ? null : product_id,
        variant_id: variant_id || null,
        image_url: destPath,
        display_order,
      };

      const { error: dbError } = await supabase
        .from('product_images')
        .insert(insertData);

      if (dbError) {
        // Cleanup nếu DB lỗi
        await supabase.storage.from(bucket).remove([destPath]);
        results.push({ temp_path, error: dbError.message });
        continue;
      }

      // Xóa tmp sau thành công
      await supabase.storage.from(bucket).remove([temp_path]);

      results.push({
        temp_path,
        dest_path: destPath,
        public_url: publicUrl,
        success: true,
      });
    }

    return Response.json({ success: true, results }, { status: 200 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message || 'Lỗi nội bộ' }, { status: 500 });
  }
}