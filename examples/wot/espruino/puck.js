/* eslint-disable no-undef */ // Sends a message every time the puck.js is triggered

setWatch(function () {
  Bluetooth.println('Assembly button a triggered');
  LED2.set();
  setTimeout(function () {
    LED2.reset();
  }, 2000);
}, BTN, { edge: 'rising', debounce: 50, repeat: true });
