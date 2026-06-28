"use client";

import Script from "next/script";

export default function FupaScript() {
  return (
    <Script
      id="fupa-widget-script"
      src="https://widget-api.fupa.net/vendor/widget.js?v1"
      strategy="afterInteractive"
    />
  );
}
