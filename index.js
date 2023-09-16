/** @license Apache-2.0 */
//@ts-check

/**
 * @typedef {import('./webxdc.d.ts').Webxdc} webxdc
 */

let webxdcAPIDriverAlreadyInitialized = false;
/**
 * Named this way because it abstracts away the bare webxdc `sendUpdate` and
 * `setUpdateListener`.
 */
// class WebxdcAPIDriver {
// class WebxdcNetworkDriver {
class WebxdcTransportDriver {
  constructor() {
    if (webxdcAPIDriverAlreadyInitialized) {
      console.warn(
        this.constructor.name +
          " is supposed to be used as a singletone, but it was initialized another time"
      );
    }
    webxdcAPIDriverAlreadyInitialized = true;

    webxdc.setUpdateListener((update) => {
      // OK I think we need to split the messages into their "channel buckets",
      // then when a channel gets created feed the messages there.
      // Actually, how about do that with a promise?
      //
      // Though how about let the user create channels, and only then do
      // `webxdc.setUpdateListener`? What does this give? Performance and that's
      // it?

      // TODO though what about `update.document`, `summary`, etc? How do we
      // handle them? Perhaps don't think of updates as being "stored", only
      // think about real-time messages. How would you solve it then?
    }, 0);
  }
}
