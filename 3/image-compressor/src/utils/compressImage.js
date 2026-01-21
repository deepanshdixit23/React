export async function compressToTarget(file, targetKB) {
  if (!file) throw new Error("No file selected");

  return new Promise((resolve, reject) => {
    const img = new window.Image();

    img.onload = async () => {
      let canvas = document.createElement("canvas");
      let ctx = canvas.getContext("2d");

      if (!ctx) {
        reject("Canvas not supported");
        return;
      }

      let width = img.width;
      let height = img.height;
      let quality = 0.9;
      let blob = null;

      for (let i = 0; i < 15; i++) {
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        blob = await new Promise((res) =>
          canvas.toBlob((b) => res(b), "image/jpeg", quality),
        );

        if (!blob) break;
        if (blob.size / 1024 <= targetKB) break;

        if (quality > 0.78) {
          quality -= 0.05;
        } else {
          width *= 0.85;
          height *= 0.85;
        }
      }

      if (!blob) {
        reject("Compression failed");
        return;
      }

      resolve(
        new File([blob], "compressed.jpg", {
          type: "image/jpeg",
        }),
      );
    };

    img.onerror = () => reject("Image load error");
    img.src = URL.createObjectURL(file);
  });
}

const MIN_QUALITY = 0.8; // quality lock

if (quality > MIN_QUALITY) {
  quality -= 0.05;
} else {
  width *= 0.85;
  height *= 0.85;
}
