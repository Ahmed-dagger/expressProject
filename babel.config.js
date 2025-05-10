module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'    // compile for the current Node.js version
      }
    }]
  ]
};
