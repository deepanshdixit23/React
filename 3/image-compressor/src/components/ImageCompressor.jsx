import { useState } from "react";
import ImageUploader from "./ImageUploader";
import { compressToTarget } from "../utils/compressImage";
import { downloadZip } from "../utils/zipImages";

export default function ImageCompressor() {
  const [files, setFiles] = useState([]);
  const [compressed, setCompressed] = useState([]);
  const [loading, setLoading] = useState(false);

  async function compressAll(targetKB) {
    setLoading(true);
    const results = [];

    for (const file of files) {
      const out = await compressToTarget(file, targetKB);
      results.push(out);
    }

    setCompressed(results);
    setLoading(false);
  }

  return (
    <div>
      <ImageUploader onFiles={setFiles} />

      {files.length > 0 && (
        <>
          <button onClick={() => compressAll(100)}>Compress to 100 KB</button>
          <button onClick={() => compressAll(250)}>Compress to 250 KB</button>
        </>
      )}

      {loading && <p>Compressing images...</p>}

      {compressed.length > 0 && (
        <button onClick={() => downloadZip(compressed)}>Download ZIP</button>
      )}
    </div>
  );
}
