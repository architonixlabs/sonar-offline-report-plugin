(function (global) {
  "use strict";

  if (typeof global.registerExtension !== "function") return;
  global.registerExtension("offlinereport/portfolio_page", function (options) {
    return global.OfflineReport.startPortfolio(options.el, options);
  });
})(window);
