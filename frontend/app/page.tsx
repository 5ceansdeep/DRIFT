import Script from "next/script";
import "./drift.css";
import DRIFT_MARKUP from "./drift-markup";

export default function Home() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: DRIFT_MARKUP }} />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
        strategy="beforeInteractive"
      />
      <Script src="/drift-app.js" strategy="afterInteractive" />
    </>
  );
}
