// api/attach-product-images.ts
// runtime: 'edge' để latency thấp (hoặc bỏ để Serverless)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Thiếu env SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const config = { runtime: 'edge' };  // optional: Edge nếu muốn nhanh

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { product_id, images } = await req.json();

    if (!product_id || !Array.isArray(images) || images.length === 0) {
      return Response.json({ error: 'Thiếu product_id hoặc images' }, { status: 400 });
    }

    const results: any[] = [];
    const bucket = 'product-images';

    for (const img of images) {
      const { temp_path, variant_id = null, display_order = 0 } = img;
      if (!temp_path) continue;

      const destFolder = variant_id ? `variants/${variant_id}` : `products/${product_id}`;
      const fileExt = temp_path.split('.').pop() || 'jpg';
      const fileName = `${display_order + 1}.${fileExt}`;
      const destPath = `${destFolder}/${fileName}`;

      // Copy (vẫn hoạt động tốt ở Edge)
      const { error: copyError } = await supabase.storage.from(bucket).copy(temp_path, destPath);

      if (copyError) {
        results.push({ temp_path, error: copyError.message });
        continue;
      }

      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(destPath);

      const insertData = {
        product_id: variant_id ? null : product_id,
        variant_id: variant_id || null,
        image_url: destPath,
        display_order,
      };

      const { error: dbError } = await supabase.from('product_images').insert(insertData);

      if (dbError) {
        await supabase.storage.from(bucket).remove([destPath]);
        results.push({ temp_path, error: dbError.message });
        continue;
      }

      await supabase.storage.from(bucket).remove([temp_path]);

      results.push({ temp_path, dest_path: destPath, public_url: publicUrl, success: true });
    }

    return Response.json({ success: true, results }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return Response.json({ error: err.message || 'Lỗi nội bộ' }, { status: 500 });
  }
}