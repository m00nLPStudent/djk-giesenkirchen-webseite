"use client";

import Script from "next/script";

export default function FootballDeScript() {
  return (
    <Script
      id="football-de-widget-script"
      src="https://www.fussball.de/widgets.js"
      strategy="afterInteractive"
    />
  );
}
