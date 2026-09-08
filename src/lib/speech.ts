import type { Lang } from "./i18n";

const localeOf: Record<Lang, string> = {
  mr: "mr-IN",
  hi: "hi-IN",
  en: "en-IN",
};

export function speak(text: string, lang: Lang = "en") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = localeOf[lang];
    u.rate = 0.92;
    window.speechSynthesis.speak(u);
  } catch {
    /* speech not available */
  }
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
