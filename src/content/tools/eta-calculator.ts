import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "ETA Calculator – Estimate Time Remaining for Any Task or Transfer",
  seoDescription:
    "Calculate how long a job will take to finish. Enter the total, how much is done and the current rate (items/s, KB/s, MB/s or %/s) to get the remaining time and expected completion. Free.",
  intro:
    "Work out when a long-running job will finish — a file transfer, a database migration, a render queue, a batch import, or a to-do list of tasks. Enter the total amount of work, how much has been completed so far, and the current processing speed, and the calculator returns the time remaining and the clock time at which it should complete.",
  sections: [
    {
      heading: "How the estimate is calculated",
      paragraphs: [
        "The maths is simple: remaining work = total − done, and time remaining = remaining work ÷ speed. The calculator handles the unit conversion for you (KB/s and MB/s for transfers, items per second for queues, percent per second for progress bars) and formats the result in hours, minutes and seconds along with the projected finish time based on your clock. Because the estimate assumes the rate stays constant, it is most accurate for steady processes; for jobs whose speed varies, re-run it with the latest numbers every so often.",
      ],
    },
    {
      heading: "Everyday uses",
      bullets: [
        "File downloads and uploads: 4.2 GB total, 1.1 GB done, 12 MB/s → about 4 minutes 20 seconds left.",
        "Backups and syncs where the client shows a rate but not a finish time.",
        "Data pipelines: rows processed per second against a known row count.",
        "Video encoding and 3D rendering queues: frames done out of total at frames per second.",
        "Manual work: pages read per hour, units assembled per shift, tickets closed per day.",
      ],
    },
    {
      heading: "Getting a better estimate",
      bullets: [
        "Measure speed over a longer window (the last minute rather than the last second) to smooth out bursts.",
        "For transfers, expect the rate to drop as the connection is shared or the server throttles — pad the estimate.",
        "Use the same unit for total and done (both GB or both MB) so the percentage is correct.",
        "For tasks with a fixed deadline, the Time Duration Converter and Date Calculator help convert the remaining time into a target date.",
      ],
    },
  ],
  howTo: [
    { name: "Enter the total", text: "Type the total amount of work — file size, item count or 100 for a percentage." },
    { name: "Enter progress", text: "Type how much has already been completed in the same unit." },
    { name: "Enter the speed", text: "Type the current rate and select its unit: items/s, KB/s, MB/s or %/s." },
    { name: "Read the ETA", text: "The remaining time and projected completion clock time appear instantly." },
  ],
  faqs: [
    {
      question: "Why does my download's ETA keep changing?",
      answer:
        "Download clients recalculate from the instantaneous speed, which fluctuates. Entering an average speed observed over a minute or two gives a more stable estimate.",
    },
    {
      question: "Can I calculate ETA from a percentage progress bar?",
      answer: "Yes. Set the total to 100, the done value to the current percentage, and the speed to how many percent it advances per second.",
    },
    {
      question: "What if the job speeds up or slows down?",
      answer: "The estimate assumes a constant rate. Re-enter the latest completed amount and speed to refresh the ETA as conditions change.",
    },
    {
      question: "Does it handle very large totals like terabytes?",
      answer: "Yes — enter the values in a consistent unit (for example 4,000,000 MB) and the arithmetic scales without issue.",
    },
  ],
  related: ["time-duration-converter", "stopwatch", "date-calculator", "percentage-calculator", "unit-converter"],
};

export default content;
