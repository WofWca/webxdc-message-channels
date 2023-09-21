/** @license Apache-2.0 */
//@ts-check

/**
 * @typedef {import('./webxdc.d.ts').Webxdc} Webxdc
 */
/**
 * @typedef {number | string} ChannelId
 */

let webxdcAPIDriverAlreadyInitialized = false;
/**
 * Named this way because it abstracts away the bare webxdc `sendUpdate` and
 * `setUpdateListener`.
 */
// class WebxdcAPIDriver {
// class WebxdcNetworkDriver {
export class WebxdcTransportDriver {
  constructor() {
    if (webxdcAPIDriverAlreadyInitialized) {
      console.warn(
        this.constructor.name +
          " is supposed to be used as a singletone, but it was initialized another time"
      );
    }
    webxdcAPIDriverAlreadyInitialized = true;

    /**
     * @type {Map<ChannelId, Array<any>>}
     */
    this.channelMessages = new Map();
    /**
     * @type {Map<ChannelId, Channel>}
     */
    this.channels = new Map();
    /**
     * @type {Map<ChannelId, (message: any) => void>}
     */
    this.onMessageListeners = new Map();

    // TODO wait, do we need to handle the returned promise?
    webxdc.setUpdateListener((update) => {
      // OK I think we need to split the messages into their "channel buckets",
      // then when a channel gets created feed the messages there.
      // Actually, how about do that with a promise?
      //
      // Though how about let the user create channels, and only then do
      // `webxdc.setUpdateListener`? What does this give? Performance and that's dfsdf
      // it?

      // TODO though what about `update.document`, `summary`, etc? How do we
      // handle them? Perhaps don't think of updates as being "stored", only
      // think about real-time messages. How would you solve it then?

      for (const [channelId, channelMessage] of Object.entries(update.payload)) {
        let channelMessagesArr = this.channelMessages.get(channelId);
        if (!channelMessagesArr) {
          channelMessagesArr = [];
          this.channelMessages.set(channelId, channelMessagesArr);
        }

        // Yes, this means that if the received webxdc update has messages
        // for several channels, it will be pused to several arrays.
        channelMessagesArr.push(channelMessage);

        this.onMessageListeners.get(channelId)?.(channelMessage);
      }
      // TODO handle `summary`, `document`, etc.
    }, 0);
  }
  /**
   * @param {ChannelId} channelId
   * @throws
   */
  createChannel(channelId) {
    if (this.channels.has(channelId)) {
      throw new Error(`Channel with id "${channelId}" already exists`);
    }

    const onSetMessageListener = (listener, startSerial) => {
      for (const message of this.channelMessages.get(channelId) || []) {
        listener(message);
      }
      // TODO how about delete the array afterwards? Or do we want
      // `setMessageListener` to be callable several times. Because
      // `webxdc.setUpdateListener` is only one-time callable:
      // https://github.com/webxdc/webxdc_docs/blob/77b072ca558bd6f28dafad12bf889a2410e0ae7e/src/spec.md?plain=1#L91

      // TODO handle `startSerial`.
      this.onMessageListeners.set(channelId, listener);
    };
    const channel = new Channel(channelId, onSetMessageListener);

    this.channels.set(channelId, channel);
  }
}

// FRIck. You want to do a `queueMicrotask` (basically kind of a `throttle`),
// but what you're gonna do if someone does `sendMesasge()` on the same
// channeltwice? Do we batch them? What about serial then?
// Or do we flush? And do another queueMicrotask?

// * Shall we just stop caring and use the same `serial` for all the messages
// in a batch?
// * Or do we make a custom local counter for each message? Would it be
// consistent though? I don't think so.
// * Or should we just explicitly say that the message listener is passed an
// array of messages?
// * Do we just not expose any of the `serial` stuff as API?
// Or how about this: we ignore the webxdc implementation's serial and put
// our own `serial` inside the message's payload? Meh, sounds like too much.
// Or maybe just stop caring about this and do `sendMessage` immediately for now


// TODO `setMessageListener`'s and `sendMessage`'s message types are the same?
class Channel {
  /**
   * @param {ChannelId} channelId
   */
  constructor(channelId, onSetMessageListener) {
    this.channelId = channelId;
    this.onSetMessageListener = onSetMessageListener;
  }
  // TODO hold up, how about `add/removeMessageListener` instead of juts a
  // single one? Let's not make the mistake that we're trying to fix in the
  // first place.
  /**
   * @param {(message: any) => void} listener
   * @param {number} startSerial
   */
  setMessageListener(listener, startSerial) {
    this.onSetMessageListener(listener, startSerial);
  }
  /**
   * @param {any} message
   */
  sendMessage(message, description) {
    // TODO Yeah, doing `webxdc.sendUpdate` on each `sendMessage` of each channel is
    // pretty wasteful (I'm talking about the throttle https://github.com/deltachat/deltachat-core-rust/blob/061d091c971ac8cb860f92e6e81c298dcffa8f26/src/context.rs#L385)
    webxdc.sendUpdate(
      {
        payload: {
          [this.channelId]: message,
        },
      },
      description,
    );
  }
}

// function onChannelSendMessageCalled(channelId, message, description) {
//   // TODO Yeah, doing `webxdc.sendUpdate` on each `sendMessage` of each channel is
//   // pretty wasteful (I'm talking about the throttle https://github.com/deltachat/deltachat-core-rust/blob/061d091c971ac8cb860f92e6e81c298dcffa8f26/src/context.rs#L385)
//   webxdc.sendUpdate(
//     {
//       payload: {
//         [channelId]: message,
//       },
//     },
//     description,
//   );
// }
