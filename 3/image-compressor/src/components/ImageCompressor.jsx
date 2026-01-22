import { useState } from "react";
import ImageUploader from "./ImageUploader";
import ImageCompare from "./ImageCompare";
import { compressToTarget } from "../utils/compressImage";
import { downloadZip } from "../utils/zipImages";

const SIZE_OPTIONS = [
  { label: "50 KB", value: 50 },
  { label: "100 KB", value: 100 },
  { label: "200 KB", value: 200 },
  { label: "500 KB", value: 500 },
  { label: "1 MB", value: 1024 },
];

export default function ImageCompressor() {
  const [files, setFiles] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  async function handleCompress(targetKB) {
    if (!files.length) {
      alert("Please add images first");
      return;
    }

    setLoading(true);
    setProgress(0);
    const output = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const compressed = await compressToTarget(file, targetKB);

      output.push({
        originalUrl: URL.createObjectURL(file),
        compressedUrl: URL.createObjectURL(compressed),
        file: compressed,
        size: (compressed.size / 1024).toFixed(2),
      });

      setProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setResults(output);
    setLoading(false);
  }

  return (
    <div className="compressor">
      <ImageUploader onFiles={setFiles} />

      {files.length > 0 && (
        <p className="success">✅ {files.length} image(s) added</p>
      )}

      <div className="buttons">
        {SIZE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            disabled={loading}
            onClick={() => handleCompress(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="progress">
          <div style={{ width: `${progress}%` }} />
        </div>
      )}

      {results.length > 0 && (
        <>
          {results.map((img, i) => (
            <div key={i} className="preview">
              <ImageCompare
                before={img.originalUrl}
                after={img.compressedUrl}
              />
              <p>{img.size} KB</p>
              <a href={img.compressedUrl} download>
                Download
              </a>
            </div>
          ))}

          {results.length > 1 && (
            <button onClick={() => downloadZip(results.map((r) => r.file))}>
              Download All as ZIP
            </button>
          )}
        </>
      )}
    </div>
  );
}
