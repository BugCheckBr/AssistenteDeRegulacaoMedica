module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: {
          chrome: "88",
          firefox: "78",
          edge: "88",
        },
        modules: false,
      },
    ],
  ],
  plugins: [
    "@babel/plugin-proposal-optional-chaining",
    "@babel/plugin-proposal-nullish-coalescing-operator",
  ],
};
