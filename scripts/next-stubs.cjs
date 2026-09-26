// See next-stubs.mjs.
exports.notFound = () => {
  throw new Error("NEXT_NOT_FOUND");
};
exports.redirect = (url) => {
  throw new Error(`NEXT_REDIRECT ${url}`);
};
exports.forbidden = () => {
  throw new Error("NEXT_FORBIDDEN");
};
