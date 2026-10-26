const preset = require("@raqs/shared/tailwind-preset");

/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [preset],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "overlay-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "overlay-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "dialog-in": {
          from: { opacity: "0", transform: "translate(-50%, -48%) scale(0.96)" },
          to: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
        },
        "dialog-out": {
          from: { opacity: "1", transform: "translate(-50%, -50%) scale(1)" },
          to: { opacity: "0", transform: "translate(-50%, -48%) scale(0.96)" },
        },
      },
      animation: {
        "overlay-in": "overlay-in 225ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "overlay-out": "overlay-out 195ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "dialog-in": "dialog-in 225ms cubic-bezier(0.4, 0, 0.2, 1) both",
        "dialog-out": "dialog-out 195ms cubic-bezier(0.4, 0, 0.2, 1) both",
      },
    },
  },
};
