import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Free Online Screen Recorder – Record Screen with Audio, No Download",
  seoDescription:
    "Record your screen, a window or a browser tab with microphone and system audio. Pause and resume, then download as MP4 or WebM. Free, no install, no watermark — runs in your browser.",
  intro:
    "Record your screen straight from the browser — no extension, no account, no watermark. Capture the whole display, a single window or one tab, add your voice from the microphone and (in Chrome and Edge) the audio playing on your computer. Pause and resume as needed, then preview and download the video. The recording is created on your device and never uploaded.",
  sections: [
    {
      heading: "What you can capture",
      bullets: [
        "Entire screen — tutorials, walkthroughs and bug reports that move between apps.",
        "A single window — keeps notifications and other windows out of the video.",
        "A browser tab — the cleanest option for web apps, and the only one that captures tab audio in every browser that supports it.",
        "Microphone narration mixed with system or tab sound, so viewers hear both you and the video you're demonstrating.",
      ],
    },
    {
      heading: "Quality, format and file size",
      paragraphs: [
        "720p is plenty for most tutorials and keeps files small (roughly 15–20 MB per minute). 1080p is the default and looks sharp on large monitors; Native records at your display's full resolution for the highest detail. The browser chooses the container: Chrome, Edge and Safari can produce MP4 (H.264) directly, while Firefox records WebM. Both play in modern players and upload to YouTube, Drive and Slack without conversion. If you need a different format, pass the file through the Video Converter afterwards.",
      ],
    },
    {
      heading: "Tips for a clean recording",
      bullets: [
        "Close chat apps or enable Do Not Disturb so pop-ups don't appear in the video.",
        "Choose the window or tab rather than the whole screen when you don't need to switch apps.",
        "Use Pause while you set up the next step instead of recording dead time.",
        "Keep this tab open while recording; you can switch away freely but closing it ends the recording.",
        "Check the first few seconds of the preview to confirm audio levels before recording something long.",
      ],
    },
  ],
  howTo: [
    { name: "Set options", text: "Choose the quality and whether to include your microphone and system/tab audio." },
    { name: "Choose what to share", text: "Click Choose what to share and pick a screen, window or tab in the browser prompt." },
    { name: "Record", text: "Press Start recording. Pause and resume as needed, then press Stop." },
    { name: "Preview and download", text: "Watch the result and click Download to save the MP4 or WebM file." },
  ],
  faqs: [
    {
      question: "Is there a time limit or watermark?",
      answer: "Neither. Record for as long as you like — the limit is your device's free memory, typically hours at 1080p — and the file is yours with nothing added.",
    },
    {
      question: "Why isn't system audio recorded?",
      answer: "System audio capture depends on the browser and OS: Chrome and Edge offer it for tabs on all platforms and for the whole screen on Windows and ChromeOS; macOS allows tab audio only; Firefox and Safari don't capture system audio. Make sure the 'Share audio' checkbox in the browser prompt is ticked.",
    },
    {
      question: "Can I record on my phone?",
      answer: "Mobile browsers don't support screen capture via the web. Use your phone's built-in screen recorder, then trim or convert the video with our video tools.",
    },
    {
      question: "Where is the recording saved?",
      answer: "It's held in your browser's memory until you click Download, which saves it to your normal downloads folder. Nothing is sent to a server.",
    },
    {
      question: "Can I record my webcam as well?",
      answer: "Use the Camera Recorder tool for webcam video. Picture-in-picture overlay of camera on screen isn't supported yet.",
    },
  ],
  related: ["camera-recorder", "video-trimmer", "video-converter", "video-compressor", "video-to-gif", "mute-video"],
};

export default content;
