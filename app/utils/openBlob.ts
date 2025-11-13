// utils/openBlob.ts
import api from "@/hooks/axiosInstance";

/**
 * Abre un blob (PDF/HTML) autenticado con axiosInstance.
 * Si el back devuelve error (401/403/404/500), muestra mensaje claro.
 */
export async function openBlob(path: string, filename = "archivo") {
  try {
    // Usa arraybuffer para poder detectar/leer errores en JSON/Texto
    const resp = await api.get(path, { responseType: "arraybuffer" });

    const status = resp.status;
    const contentType = (resp.headers["content-type"] as string) || "";

    // Si no es 200, intenta decodificar el cuerpo como texto para mostrar error
    if (status !== 200) {
      const text = new TextDecoder().decode(resp.data);
      throw new Error(`HTTP ${status} - ${text || "Error al obtener el archivo"}`);
    }

    // Si el back no mandó PDF/HTML, intentamos detectar texto de error
    const isPdf = contentType.includes("application/pdf");
    const isHtml = contentType.includes("text/html");
    if (!isPdf && !isHtml) {
      const text = new TextDecoder().decode(resp.data);
      if (text && text.trim().startsWith("{")) {
        // probablemente error JSON
        throw new Error(`Respuesta no-PDF (${contentType}): ${text}`);
      }
    }

    // nombre sugerido si viene por header
    const dispo = resp.headers["content-disposition"] as string | undefined;
    const suggested =
      dispo?.match(/filename\*?=(?:UTF-8'')?([^;]+)/i)?.[1]?.replace(/["']/g, "") ||
      filename;

    const blob = new Blob([resp.data], { type: contentType || "application/pdf" });
    const url = URL.createObjectURL(blob);

    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) {
      const a = document.createElement("a");
      a.href = url;
      const ext = isPdf ? "pdf" : isHtml ? "html" : "";
      a.download = suggested || (ext ? `${filename}.${ext}` : filename);
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err: any) {
    // Intenta leer cuerpo de error si viene como arraybuffer
    if (err?.response?.data) {
      try {
        const text = new TextDecoder().decode(err.response.data);
        alert(`No se pudo abrir el archivo: ${err?.response?.status}\n${text}`);
        console.error("openBlob error:", err?.response?.status, text);
        return;
      } catch (_) {}
    }
    alert(err?.message || "No se pudo abrir el archivo.");
    console.error("openBlob error:", err);
  }
}
