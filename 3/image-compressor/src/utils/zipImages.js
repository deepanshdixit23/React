import JSZip from "jszip";
import { saveAs } from "file-saver";

export async function downloadZip(files) {
  const zip = new JSZip();

  files.forEach((file, index) => {
    zip.file(`image-${index + 1}.jpg`, file);
  });

  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "compressed-images.zip");
}
