import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Free Mouse Mover Online – Browser Mouse Jiggler to Keep Your Screen Awake",
  seoDescription:
    "Keep your computer awake without installing anything. This online mouse jiggler uses the Screen Wake Lock API and silent audio to prevent sleep, screen lock and idle status. Works on Windows, Mac and Linux.",
  intro:
    "Click Start to keep your screen awake and stop your computer from sleeping or locking. This browser-based mouse mover simulates activity using the Screen Wake Lock API and a silent audio stream — no download, no install, no admin rights. It works on Windows, macOS, Linux and ChromeOS, pauses automatically while you are actually using the machine, and can shut itself off at a time you choose.",
  sections: [
    {
      heading: "How a browser mouse jiggler works",
      paragraphs: [
        "A web page can't move your real cursor — browsers deliberately forbid that. Instead, this tool asks the operating system to keep the display on through the Screen Wake Lock API, the same mechanism video players and navigation apps use. As a second layer, it plays an inaudible audio tone, which most operating systems treat as an active media session and therefore won't idle-lock. The animated cursor on screen is just a visual indicator that the session is running.",
        "Because nothing is installed and no input events are synthesised, there is nothing for endpoint security software to detect. It simply looks like a tab playing media.",
      ],
    },
    {
      heading: "When to use it",
      bullets: [
        "Long downloads, uploads, renders or installs that you don't want interrupted by sleep.",
        "Presentations, dashboards and kiosks that must stay visible without touching the keyboard.",
        "Reading long documents or following a recipe without the screen dimming.",
        "Remote desktop or VPN sessions that drop when the host machine locks.",
        "Keeping your status active in chat apps while you're at your desk but not typing.",
      ],
    },
    {
      heading: "Tips for reliable results",
      bullets: [
        "Keep the tab open. It can be in the background, but closing it ends the wake lock immediately.",
        "The browser releases the wake lock when the tab is hidden; the tool re-acquires it as soon as you return, and silent audio keeps working in the meantime.",
        "Low-power / battery-saver modes can refuse wake locks. Plug in or disable power saving if the status shows the lock was refused.",
        "Company-managed devices may enforce a lock policy that overrides any software — check with your IT team before relying on this during a meeting.",
        "Use Auto-stop to turn it off at the end of your day so the display isn't left on overnight.",
      ],
    },
  ],
  howTo: [
    { name: "Press Start", text: "Click the Start button. The status changes to Active and the session timer begins." },
    { name: "Choose the methods", text: "Leave Force screen awake and Silent audio mode on for the strongest effect, or turn either off." },
    { name: "Optionally schedule a stop", text: "Pick a time under Auto-stop and enable it — the session ends on its own at that time." },
    { name: "Leave the tab open", text: "Switch to other work; the tool pauses while you're active and resumes when you stop." },
  ],
  faqs: [
    {
      question: "Does it actually move my mouse cursor?",
      answer:
        "No. Web pages cannot control the system cursor. It keeps your screen awake with the Wake Lock API and a silent audio stream, which achieves the same goal — no sleep, no lock screen — without any download.",
    },
    {
      question: "Will it keep me 'Available' in Teams, Slack or Zoom?",
      answer:
        "Usually. Those apps mark you away when the OS reports the machine as idle or locked; keeping the display awake prevents that on most setups. Some corporate policies measure real input, in which case no browser tool can help.",
    },
    {
      question: "Is it detectable by my employer?",
      answer:
        "There's nothing to install and no synthetic input, so there's no process or driver to detect. It appears as a normal browser tab playing media.",
    },
    {
      question: "Which browsers are supported?",
      answer:
        "The Screen Wake Lock API works in Chrome, Edge, Opera, Brave, Samsung Internet and Safari 16.4+. In Firefox the wake lock isn't available yet, but silent audio mode still works.",
    },
    {
      question: "Does it drain the battery?",
      answer: "The tool itself uses almost nothing, but keeping the display on does consume power. Use Auto-stop so it switches off when you no longer need it.",
    },
    {
      question: "Is anything sent to a server?",
      answer: "No. Everything runs in your browser; the only thing stored is your preferences, in local storage on your own device.",
    },
  ],
  related: ["stopwatch", "eta-calculator", "date-calculator", "time-duration-converter", "timestamp-converter"],
};

export default content;
