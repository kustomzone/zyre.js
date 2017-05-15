const assert = require('chai').assert;
const ZyreEvent = require('../lib/zyre_event');

describe('ZyreEvent', () => {
  describe('constructor()', () => {
    it('should create an instance of ZyreEvent', () => {
      const zyreEvent = new ZyreEvent();
      assert.instanceOf(zyreEvent, ZyreEvent);
    });
  });
});