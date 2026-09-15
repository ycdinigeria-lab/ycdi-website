// Changes on every build so browsers always fetch the current CSS/JS after a deploy.
module.exports = () => String(Date.now());
