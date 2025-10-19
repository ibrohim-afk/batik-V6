// Fungsi ini akan dieksekusi di sisi server (backend) oleh Vercel.

export default async function handler(request, response) {
  // Hanya izinkan metode POST, menolak metode lain seperti GET.
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Ambil API Key DENGAN AMAN dari "Environment Variables" di Vercel.
    // Ini adalah kunci rahasia yang tidak pernah terlihat oleh pengguna.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      // Error ini hanya akan muncul jika Anda lupa mengatur Environment Variable di Vercel.
      throw new Error('API key tidak ditemukan di konfigurasi server.');
    }

    // 2. Ambil data 'contents' (prompt dan gambar) yang dikirim dari frontend.
    const { contents } = request.body;

    if (!contents) {
        throw new Error("Payload 'contents' tidak ada dalam permintaan dari frontend.");
    }

    // 3. Siapkan payload yang akan dikirim ke Google API.
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
    const payload = {
      contents: contents,
      generationConfig: { responseModalities: ['IMAGE'] },
      // Menambahkan safety settings bisa membantu menghindari blokir konten yang tidak perlu.
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      ]
    };

    // 4. Lakukan panggilan API yang sebenarnya dari server Vercel ke server Google.
    const googleResponse = await fetch(googleApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // 5. Ambil data JSON dari respons Google.
    const result = await googleResponse.json();

    // 6. Periksa jika respons dari Google tidak berhasil (bukan status 2xx).
    if (!googleResponse.ok) {
      console.error('Error dari Google API:', result);
      const errorMessage = result.error?.message || 'Gagal menghubungi Google API';
      // Kirim status error dan pesan dari Google kembali ke frontend.
      return response.status(googleResponse.status).json({ error: errorMessage });
    }

    // 7. Jika berhasil, kirim hasil dari Google kembali ke frontend.
    return response.status(200).json(result);

  } catch (error) {
    // Tangani jika terjadi error tak terduga di server kita.
    console.error('Terjadi error di server Vercel:', error);
    return response.status(500).json({ error: error.message || 'Terjadi kesalahan internal di server.' });
  }
}

