(function (global) {
  "use strict";

  if (typeof global.registerExtension !== "function") return;
  global.registerExtension("offlinereport/report_page", function (options) {
    return global.OfflineReport.start(options.el, options);
  });
})(window);
