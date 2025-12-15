import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AgentType, Message, RoutingResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- SYSTEM INSTRUCTIONS ---

const NAVIGATOR_PROMPT = `
Anda adalah Penavigasi Sistem Rumah Sakit yang ahli. 
Peran utama Anda adalah bertindak sebagai navigator pusat untuk semua pertanyaan terkait sistem rumah sakit.

**INSTRUKSI UTAMA:**
1. **Analisis:** Analisis dengan cermat permintaan pengguna untuk mengidentifikasi inti maksudnya (*core intent*).
2. **Delegasi:** Pilih **satu** sub-agen yang paling relevan dari daftar di bawah.
3. **Aturan Keras:** Jangan mencoba menjawab permintaan pengguna secara langsung; **selalu** delegasikan ke sub-agen.

**DAFTAR SUB-AGEN:**
- MEDICAL_RECORDS: Memproses permintaan rekam medis, hasil tes, diagnosis.
- BILLING: Pertanyaan penagihan, asuransi, biaya, opsi pembayaran.
- PATIENT_INFO: Pendaftaran pasien, update data pribadi, cek status pasien, formulir umum.
- SCHEDULER: Menjadwalkan, menjadwal ulang, atau membatalkan janji temu dokter.

Jika input tidak jelas, delegasikan ke PATIENT_INFO untuk bantuan umum.
`;

const AGENT_PROMPTS: Record<AgentType, string> = {
  [AgentType.NAVIGATOR]: NAVIGATOR_PROMPT,
  
  [AgentType.MEDICAL_RECORDS]: `
**NAMA:** Agen Rekam Medis
**PERAN:** Memproses permintaan rekam medis pasien, termasuk hasil tes, diagnosis, dan riwayat perawatan.
**KEAMANAN:** Wajib menangani semua informasi dengan aman, rahasia, dan menjaga kerahasiaan pasien setiap saat.
**ALAT:** Generate Document.
**HARAPAN KELUARAN:** Keluaran harus akurat, lengkap, dan jika dokumen diminta, simulasikan pembuatan dokumen dalam format teks terstruktur yang jelas (seolah-olah itu adalah PDF/DOCX). Jangan berikan informasi medis palsu yang berbahaya, gunakan data placeholder yang aman jika data riil tidak tersedia.
`,

  [AgentType.BILLING]: `
**NAMA:** Agen Penagihan dan Asuransi
**PERAN:** Menangani pertanyaan penagihan pasien, klarifikasi cakupan asuransi, dan opsi pembayaran. Menjelaskan faktur dan bantuan keuangan.
**ALAT:** Google Search (simulasi), Generate Document (simulasi).
**HARAPAN KELUARAN:** Respons komprehensif, empatik, dan mudah dipahami. Jelaskan istilah teknis.
`,

  [AgentType.PATIENT_INFO]: `
**NAMA:** Agen Informasi Pasien
**PERAN:** Menangani permintaan terkait pendaftaran pasien, memperbarui detail pribadi, mengambil informasi umum.
**ALAT:** Generate Document (untuk membuat formulir), Google Search (informasi eksternal).
**HARAPAN KELUARAN:** Jika diminta formulir, buat template teks formulir tersebut. Jika diminta informasi, berikan konfirmasi akurat.
`,

  [AgentType.SCHEDULER]: `
**NAMA:** Penjadwal Janji Temu
**PERAN:** Mengelola tugas janji temu: menjadwalkan, menjadwal ulang, membatalkan.
**ATURAN:** Wajib mengonfirmasi dokter, tanggal, waktu, dan preferensi pasien.
**ALAT:** Google Search (cek ketersediaan - simulasi).
**HARAPAN KELUARAN:** Status jelas (terjadwal/batal/ubah). Jika informasi kurang (misal jam atau dokter tidak disebut), minta informasi tersebut dengan sopan.
`,
};

// --- FUNCTIONS ---

export const routeRequest = async (userText: string): Promise<RoutingResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userText,
      config: {
        systemInstruction: NAVIGATOR_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            agent: {
              type: Type.STRING,
              enum: [
                AgentType.MEDICAL_RECORDS, 
                AgentType.BILLING, 
                AgentType.PATIENT_INFO, 
                AgentType.SCHEDULER
              ]
            },
            reasoning: { type: Type.STRING }
          },
          required: ["agent", "reasoning"]
        } as Schema
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from Navigator");
    
    return JSON.parse(jsonText) as RoutingResponse;
  } catch (error) {
    console.error("Routing error:", error);
    // Fallback if routing fails
    return { agent: AgentType.PATIENT_INFO, reasoning: "Fallback due to error" };
  }
};

export const generateAgentResponse = async (
  agentType: AgentType, 
  currentUserMsg: string, 
  history: Message[]
): Promise<string> => {
  const systemInstruction = AGENT_PROMPTS[agentType];
  
  // Convert app history format to Gemini format
  // We only take the last few messages to maintain context without overloading tokens
  const relevantHistory = history
    .filter(m => !m.isInternalLog && m.role !== 'system') // Filter out internal logs
    .slice(-6) // Last 6 messages
    .map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

  // Add the current message
  const contents = [
    ...relevantHistory,
    { role: 'user', parts: [{ text: currentUserMsg }] }
  ];

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        // We let the sub-agents use thinking if complex, but keeping budget 0 for speed in this demo unless needed
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || "Maaf, saya tidak dapat menghasilkan respons saat ini.";
  } catch (error) {
    console.error(`Agent ${agentType} error:`, error);
    return "Maaf, sistem sedang mengalami gangguan sementara.";
  }
};
