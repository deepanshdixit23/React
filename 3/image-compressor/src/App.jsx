import ImageCompressor from "./components/ImageCompressor";

function App() {
  return (
    <main className="app-container">
      <section className="hero">
        <h1>Online Image Compressor</h1>
        <p>Compress images without visible quality loss</p>
        <ImageCompressor />
      </section>
      <section style={{ maxWidth: 600, marginTop: 40 }}>
        <h2>Frequently Asked Questions</h2>

        <h3>Does image compression reduce quality?</h3>
        <p>
          Our tool compresses images while maintaining visual quality. For
          photos, 100KB or more is recommended.
        </p>

        <h3>Is this image compressor free?</h3>
        <p>Yes, it is completely free and runs in your browser.</p>

        <h3>Are my images uploaded to a server?</h3>
        <p>No. All image compression happens locally in your browser.</p>
      </section>
    </main>
  );
}

export default App;
