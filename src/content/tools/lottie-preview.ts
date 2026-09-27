import type { ToolContent } from "./types";

const content: ToolContent = {
  seoTitle: "Lottie Preview – Test & Play Lottie JSON Animations Online",
  seoDescription:
    "Preview Lottie JSON animations instantly in your browser. Drop a .json file to play it, check its dimensions and verify every layer renders correctly before shipping. Free.",
  intro:
    "Drop a Lottie .json file and see it play immediately, with its composition size shown. Check that an animation exported from After Effects (via Bodymovin) or downloaded from LottieFiles actually renders as expected — with no missing layers, broken expressions or unsupported features — before you hand it to a developer or embed it in an app. The file is read locally and never uploaded.",
  sections: [
    {
      heading: "What Lottie is",
      paragraphs: [
        "Lottie is a JSON-based animation format created by Airbnb. Designers animate in Adobe After Effects, export with the Bodymovin plugin, and the resulting JSON describes shapes, paths, masks and keyframes as vector data. Player libraries — lottie-web for browsers, plus native players for iOS, Android, Flutter and React Native — render that data at any size with no loss of quality and at a fraction of the file size of a GIF or video. Because it is text, a Lottie file diffs cleanly in version control and can be recoloured or tweaked programmatically.",
      ],
    },
    {
      heading: "What to check in a preview",
      bullets: [
        "Playback — does every layer appear? Missing elements usually mean an unsupported After Effects effect or an image layer that wasn't embedded.",
        "Dimensions — the composition width and height; if you need a different aspect ratio you must re-export from After Effects.",
        "Timing — watch a few loops to confirm the animation speed matches the design spec (most UI animations are under 3 seconds).",
        "File size — vector-heavy animations can exceed 500 KB; simplify paths or reduce keyframes if it matters for load time.",
      ],
    },
    {
      heading: "Common problems and fixes",
      bullets: [
        "Blank canvas — the JSON isn't a Lottie file, or it's a dotLottie (.lottie zip) that needs unpacking first.",
        "Missing images — export with \"Include in JSON\" ticked so image layers are embedded as Base64.",
        "Wrong colours — check for expressions or effects not supported by lottie-web; replace them with keyframes.",
        "Choppy playback — very high path complexity; simplify shapes or lower the frame rate on export.",
      ],
    },
  ],
  howTo: [
    { name: "Load the animation", text: "Drop a Lottie .json file onto the page or click to browse." },
    { name: "Watch it play", text: "The animation renders immediately and loops continuously, with its composition dimensions shown." },
    { name: "Inspect", text: "Check that every layer, colour and mask appears as it did in After Effects." },
  ],
  faqs: [
    {
      question: "Can I preview .lottie (dotLottie) files?",
      answer:
        "This tool plays the standard Lottie JSON format. A .lottie file is a ZIP bundle — extract it with the ZIP Extractor and load the animations/*.json file inside.",
    },
    {
      question: "Why does my animation look different from After Effects?",
      answer:
        "lottie-web supports most, but not all, After Effects features. Effects like certain blurs, 3D layers and some expressions are not rendered. Check the Bodymovin supported-features list and bake unsupported effects to keyframes.",
    },
    {
      question: "Is my animation file uploaded?",
      answer: "No. It is parsed and rendered in your browser only.",
    },
    {
      question: "Can I edit the animation here?",
      answer: "The preview is for validation. Edit colours and timing in After Effects or a Lottie editor, then re-check the export here.",
    },
  ],
  related: ["svg-optimizer", "svg-path", "video-to-gif", "json-formatter", "svg-jsx"],
};

export default content;
