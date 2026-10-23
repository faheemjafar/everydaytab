import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Typing Speed Test – Free WPM Test Online with Accuracy and History",
  seoDescription:
    "Test your typing speed in 30, 60 or 120 seconds. Live words per minute and accuracy, mistakes highlighted as you type, results saved on your device. Free online WPM test, no sign-up.",
  intro:
    "Find out how fast you really type. Pick a 30, 60 or 120-second test, start typing the passage, and watch your words per minute and accuracy update live. Errors are highlighted in place so you can correct them, every attempt is saved to a local history, and the whole thing runs in your browser with no account.",
  sections: [
    {
      heading: "How WPM and accuracy are calculated",
      paragraphs: [
        "Words per minute uses the standard definition: every five correctly typed characters (including spaces and punctuation) count as one word, divided by the minutes elapsed. This is the same formula used by most typing tests and employers, so results are comparable. Accuracy is the share of keystrokes that were correct, including mistakes you later fixed with Backspace — correcting an error restores your WPM but still counts against accuracy, which reflects real-world typing where corrections cost time.",
      ],
    },
    {
      heading: "What's a good typing speed?",
      bullets: [
        "Average adult: 35–45 WPM.",
        "Comfortable for office work and coding: 50–70 WPM.",
        "Fast: 80–100 WPM. Professional typists and transcriptionists often exceed 100.",
        "Accuracy matters more than raw speed — 60 WPM at 98% beats 80 WPM at 90% once corrections are included.",
      ],
    },
    {
      heading: "Improving your speed",
      bullets: [
        "Use all ten fingers from the home row and keep your eyes on the screen, not the keyboard.",
        "Slow down until you can type a full test at 97%+ accuracy, then push the speed.",
        "Practise in short daily sessions; a few 60-second tests a day beats one long session.",
        "Watch your history for the trend rather than any single result.",
        "A keyboard with consistent key feel helps; check keys with the Keycode Info tool if some seem to misfire.",
      ],
    },
  ],
  howTo: [
    { name: "Pick a duration", text: "Choose 30, 60 or 120 seconds. 60 seconds is the common standard." },
    { name: "Start typing", text: "Click the typing area and type the highlighted passage. The timer starts on your first keystroke." },
    { name: "Correct mistakes", text: "Wrong characters turn red; press Backspace to fix them." },
    { name: "Read your result", text: "When time is up your WPM and accuracy are shown and added to the Recent results table." },
  ],
  faqs: [
    {
      question: "Why can't I paste into the test?",
      answer: "Pasting is disabled so the score reflects typing. Autocorrect and spell-check are also turned off on the input.",
    },
    {
      question: "Why is my WPM lower than on other sites?",
      answer: "Some tests count every typed word regardless of errors, or ignore punctuation. This test counts only correct characters, which is stricter but more representative.",
    },
    {
      question: "Where is my history stored?",
      answer: "In your browser's local storage on this device. It isn't sent anywhere and you can clear it with the Clear history button.",
    },
    {
      question: "Can I use it on a phone or tablet?",
      answer: "Yes, though on-screen keyboards usually produce lower scores than a physical keyboard. Disable predictive text for a fair result.",
    },
    {
      question: "Is the text the same every time?",
      answer: "The passage is fixed so results are comparable across attempts and over time.",
    },
  ],
  related: ["pomodoro-timer", "stopwatch", "keycode-info", "word-counter", "text-statistics"],
};

export default content;
