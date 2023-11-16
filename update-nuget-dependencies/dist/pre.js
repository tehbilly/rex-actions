"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pre = void 0;
const core_1 = require("@actions/core");
const io_1 = require("@actions/io");
async function pre() {
    try {
        await (0, io_1.which)('dotnet', true);
    }
    catch (e) {
        // Fail the workflow run if unable to find dotnet
        if (e instanceof Error) {
            (0, core_1.error)(e);
            (0, core_1.setFailed)(e.message);
        }
    }
}
exports.pre = pre;
// eslint-disable-next-line @typescript-eslint/no-floating-promises
pre();
//# sourceMappingURL=pre.js.map