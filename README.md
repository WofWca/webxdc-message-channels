# `webxdc-message-channels`

\[WIP\] Independent message channels for [webxdc][webxdc]. No more specifying "message type" and handling all messages in a singular global callback.

The API is very similar to [WebRTC `RTCDataChannel`s](https://developer.mozilla.org/en-US/docs/Web/API/RTCDataChannel).

## Usage

<!-- TODO Ok, I think striving for a realistic example is not the best approach.
Better just go for the simplest example. -->

```javascript
const webxdcTransportDriver = WebxdcNetworkDriver();

const id1 = 1;
const id2 = 2;
const channel1 = webxdcTransportDriver.createChannel(id1);
const channel2 = webxdcNetworkDriver.createChannel(id2);

// When another peer (or us) `sendMessage` on a cannel with the same `id`,
// the listener is invoked.
channel1.setMessageListener((message) => {
  console.log('Message on channel 1:', message);
});
channel2.setMessageListener((message) => {
  console.log('Message on channel 2:', message);
});

channel1.sendMessage(`to channel 1 from ${webxdc.selfAddr}`);
channel2.sendMessage(`to channel 2 from ${webxdc.selfAddr}`);
```

Expected output (with two peers) (for peer1):

```
Message on channel 1: to channel 1 from peer1@example.com
Message on channel 2: to channel 2 from peer1@example.com
Message on channel 1: to channel 1 from peer2@example.com
Message on channel 2: to channel 2 from peer2@example.com
```

To utilize the original webxdc API's `update.document`, `update.summary`, etc:

```javascript
webxdcTransportDriver.sendMeta({
  info: `${webxdc.selfName} edited the document`,
  summary: `Last editor: ${webxdc.selfName}`,
  document: 'New release',
})
```

Each `channel.sendMessage` immediately invokes `webxdc.sendUpdate`
under the hood,
unless called inside `batch`:
<!-- TODO idk, `batch` in this form looks a little stupid, because it doesn't
look different from what this library is trying to solve, i.e. get rid of
having to do all the messaging stuff in a single piece of code.

I think something like throttling `webxdc.sendUpdate` is a better idea. -->

```javascript
webxdcTransportDriver.batch(() => {
  channel1.sendMessage('foo');
  channel2.sendMessage('bar');
  webxdcTransportDriver.sendMeta({ summary: 'baz' })
});
```

Use `batch` as much as possible to use the network more efficiently and not, say
hit [the messenger's throttle limit](https://github.com/deltachat/deltachat-core-rust/blob/061d091c971ac8cb860f92e6e81c298dcffa8f26/src/context.rs#L385)

<!-- TODO also showcase in-band channel negotiation (see
[`negotiated` of `RTCPeerConnection.createDataChannel`](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/createDataChannel)). -->

[webxdc]: https://webxdc.org/