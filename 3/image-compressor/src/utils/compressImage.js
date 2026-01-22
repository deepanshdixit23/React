// src/utils/compressImage.js

export function compressToTarget(file, targetKB) {
  if (!file) {
    return Promise.reject(new Error("No file provided"));
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }

        let width = img.width;
        let height = img.height;
        let quality = 0.9;
        let blob = null;

        const MAX_ATTEMPTS = 15;
        const MIN_QUALITY = 0.8;

        const attempt = async () => {
          canvas.width = Math.round(width);
          canvas.height = Math.round(height);

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          blob = await new Promise((res) =>
            canvas.toBlob((b) => res(b), "image/jpeg", quality),
          );

          if (!blob) {
            reject(new Error("toBlob failed"));
            return;
          }

          if (blob.size / 1024 <= targetKB) {
            resolve(
              new File([blob], "compressed.jpg", {
                type: "image/jpeg",
              }),
            );
            return;
          }

          if (quality > MIN_QUALITY) {
            quality -= 0.05;
          } else {
            width *= 0.85;
            height *= 0.85;
          }
        };

        (async () => {
          for (let i = 0; i < MAX_ATTEMPTS; i++) {
            await attempt();
            if (blob && blob.size / 1024 <= targetKB) break;
          }

          if (!blob || blob.size / 1024 > targetKB) {
            reject(new Error("Target size not achievable safely"));
          }
        })();
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error("Image load error"));
    img.src = URL.createObjectURL(file);
  });
}
