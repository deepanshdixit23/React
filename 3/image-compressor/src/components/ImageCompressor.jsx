import { useState } from "react";
import ImageUploader from "./ImageUploader";
import { compressToTarget } from "../utils/compressImage";

export default function ImageCompressor() {
  const [files, setFiles] = useState([]);
  const [result, setResult] = useState(null);

  async function handleTest() {
    if (!files.length) return alert("Select an image first");

    const compressed = await compressToTarget(files[0], 100);

    setResult({
      url: URL.createObjectURL(compressed),
      size: (compressed.size / 1024).toFixed(2),
    });
  }

  return (
    <div>
      <ImageUploader onFiles={setFiles} />
      <button onClick={handleTest}>Compress First Image (100KB)</button>

      {result && (
        <p>
          Result size: {result.size} KB —
          <a href={result.url} download>
            {" "}
            Download
          </a>
        </p>
      )}
    </div>
  );
}
