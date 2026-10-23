import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Pomodoro Timer Online – Free Focus Timer with Breaks, Stats and Alerts",
  seoDescription:
    "Free online Pomodoro timer: 25-minute focus sessions, short and long breaks, auto-start, sound and desktop notifications, keep-screen-awake and daily stats. Runs in background tabs.",
  intro:
    "A clean Pomodoro timer for focused work. Run 25-minute focus sessions with 5-minute breaks and a longer break every fourth round — or set your own lengths. It chimes and sends a desktop notification when each phase ends, keeps counting accurately in background tabs, can keep your screen awake, and tracks how many sessions and minutes you've completed today.",
  sections: [
    {
      heading: "The Pomodoro Technique in brief",
      paragraphs: [
        "Developed by Francesco Cirillo in the late 1980s, the technique breaks work into fixed intervals called pomodoros, traditionally 25 minutes, separated by 5-minute breaks. After four pomodoros you take a longer 15–30 minute break. The fixed length lowers the barrier to starting, the ticking deadline discourages multitasking, and the regular breaks prevent the slow fade in attention that comes with long unbroken sessions.",
        "Treat each pomodoro as indivisible: if you're interrupted, either note the interruption and continue, or abandon the pomodoro and start a fresh one. The daily counter on this page shows completed sessions only, so it's an honest measure of focused time.",
      ],
    },
    {
      heading: "Making it work for you",
      bullets: [
        "Write the task in the box before you start — naming the goal makes it easier to return after a break.",
        "Deep work such as coding or writing often suits 50/10 intervals; admin and study tend to fit the classic 25/5.",
        "Turn on Auto-start if you prefer a continuous cycle, or leave it off to decide consciously after each phase.",
        "Enable notifications so you hear the end of a break even when the tab is hidden.",
        "Keep screen awake stops your laptop dimming or locking mid-session while you read or think.",
      ],
    },
    {
      heading: "Keyboard shortcuts",
      bullets: ["Space — start or pause", "S — skip to the next phase", "R — reset the current phase"],
    },
  ],
  howTo: [
    { name: "Set your intervals", text: "Keep the 25/5/15 defaults or change focus, short break, long break and the long-break interval." },
    { name: "Name the task", text: "Optionally type what you're working on." },
    { name: "Start", text: "Press Start or hit Space. The ring and tab title count down." },
    { name: "Take breaks", text: "When the chime sounds, take the break. Skip with S if you need to move on." },
  ],
  faqs: [
    {
      question: "Does the timer keep running if I switch tabs or close the laptop lid?",
      answer: "It keeps exact time in background tabs because the end time is stored, not a running count. If the device sleeps, the timer catches up when it wakes and finishes immediately if the time has passed.",
    },
    {
      question: "Will I get a notification when a session ends?",
      answer: "Yes, once you allow notifications in the browser prompt that appears the first time you press Start. A chime plays as well unless you turn Sound off.",
    },
    {
      question: "Are my stats saved?",
      answer: "Session counts, settings and the current timer are stored in your browser's local storage on this device. Nothing is sent to a server, and clearing site data resets them.",
    },
    {
      question: "Can I change the lengths while a session is running?",
      answer: "You can edit the settings at any time; the new lengths apply from the next phase so the current countdown isn't disturbed.",
    },
    {
      question: "What's the ideal number of pomodoros per day?",
      answer: "Most people sustain 8–12 focused pomodoros (about 4–6 hours) before quality drops. Use the daily counter to find your own ceiling rather than chasing a number.",
    },
  ],
  related: ["stopwatch", "mouse-mover", "typing-test", "eta-calculator", "time-duration-converter"],
};

export default content;
