// Fungsi ini akan dieksekusi di sisi server (backend)
// Vercel akan otomatis menangani ini.

export default async function handler(request, response) {
  // Hanya izinkan metode POST
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Ambil API Key DENGAN AMAN dari "Environment Variables"
    // Ini adalah kunci rahasia yang kita simpan di Vercel, bukan di kode.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('API key tidak ditemukan di server.');
    }

    // 2. Ambil data 'contents' yang dikirim dari frontend
    const { contents } = request.body;

    // 3. Siapkan payload untuk dikirim ke Google API
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
    const payload = {
      contents: contents,
      generationConfig: { responseModalities: ['IMAGE'] },
    };

    // 4. Lakukan panggilan API yang sebenarnya dari server
    const googleResponse = await fetch(googleApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!googleResponse.ok) {
      const errorData = await googleResponse.json();
      // Teruskan pesan error dari Google ke frontend
      return response.status(googleResponse.status).json({ error: errorData.error?.message || 'Gagal menghubungi Google API' });
    }

    // 5. Ambil hasilnya dan kirim kembali ke frontend
    const result = await googleResponse.json();
    return response.status(200).json(result);

  } catch (error) {
    console.error('Terjadi error di server:', error);
    return response.status(500).json({ error: error.message || 'Terjadi kesalahan internal di server.' });
  }
}

