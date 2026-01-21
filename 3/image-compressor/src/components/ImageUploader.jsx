import { useDropzone } from "react-dropzone";

export default function ImageUploader({ onFiles }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    onDrop: onFiles,
  });

  return (
    <div
      {...getRootProps()}
      style={{
        border: "2px dashed #888",
        padding: 30,
        textAlign: "center",
        cursor: "pointer",
        marginBottom: 20,
      }}
    >
      <input {...getInputProps()} />
      {isDragActive
        ? "Drop images here..."
        : "Drag & drop images here, or click to select images"}
    </div>
  );
}
