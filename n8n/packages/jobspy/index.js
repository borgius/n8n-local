const ky = require('ky');

const hello = (world = 'world') => {
  const res = `Hello ${world}!`;
  return res;
};

module.exports = {
  hello,
};
