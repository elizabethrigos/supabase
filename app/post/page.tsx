"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// usar etiqueta <img> para preview de archivos locales
import { supabase } from "../utils/client";

export default function CreatePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: any) => {
    const f = e.target.files && e.target.files[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!file) return alert("Selecciona una imagen");

    try {
      setLoading(true);

      // Generar un nombre único
      const now = Date.now();
      const ext = file.name.split(".").pop();
      const fileName = `posts/${now}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Subir a Supabase Storage (bucket 'images')
      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        alert("Error subiendo la imagen");
        setLoading(false);
        return;
      }

      // Obtener URL pública
      const { data: publicData } = supabase.storage.from("images").getPublicUrl(fileName);
      const publicUrl = publicData.publicUrl;

      // Insertar en la tabla posts_new (solo imagen y caption)
      const { error: insertError } = await supabase.from("posts_new").insert([
        {
          image_url: publicUrl,
          caption: caption || "",
        },
      ]);

      if (insertError) {
        console.error("Insert error:", insertError);
        alert("Error creando el post");
        setLoading(false);
        return;
      }

      // Redirigir al home
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("Ocurrió un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card-bg border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
          <h1 className="text-xl font-bold bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
            Crear Post
          </h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Imagen</span>
            <input type="file" accept="image/*" onChange={handleFileChange} />
          </label>

          {preview && (
            <div className="w-full h-64 rounded overflow-hidden">
              <img src={preview} alt="preview" className="w-full h-64 object-cover" />
            </div>
          )}

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-foreground">Caption</span>
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full rounded border border-border px-3 py-2 bg-card-bg text-foreground"
              placeholder="Escribe un caption (opcional)"
            />
          </label>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50"
            >
              {loading ? "Subiendo..." : "Publicar"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="px-4 py-2 rounded border border-border text-foreground"
            >
              Cancelar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
