/*
 * Copyright (c) 2017 Sebastian Rager
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

const assert = require('chai').assert;
const zyre = require('../lib/zyre');
const ZyrePeer = require('../lib/zyre_peer');

describe('Zyre', () => {
  it('should create a new instance of Zyre', () => {
    const z1 = zyre.new();
    assert.instanceOf(z1, zyre);
  });

  it('should inform about expired peers', function (done) {
    // Set higher timeout to test expired peers
    this.timeout(ZyrePeer.PEER_EXPIRED + 10000);

    const z1 = zyre.new({ name: 'z1' });
    const z2 = zyre.new({ name: 'z2' });

    let hit = false;

    z1.on('expired', (id, name) => {
      assert.equal(id, z2.getIdentity());
      assert.equal(name, 'z2');
      hit = true;
    });

    const stopTimeouts = () => {
      clearInterval(z1._zBeacon._broadcastTimer);
      clearInterval(z2._zBeacon._broadcastTimer);
      assert.isDefined(z1.getPeer(z2.getIdentity()));
      assert.isDefined(z2.getPeer(z1.getIdentity()));
      clearTimeout(z1._zyrePeers._peers[z2.getIdentity()]._evasiveTimeout);
      clearTimeout(z2._zyrePeers._peers[z1.getIdentity()]._evasiveTimeout);
    };

    const stopAll = () => {
      z2.stop().then(() => {
        z1.stop().then(() => {
          if (hit) setTimeout(() => { done(); }, 200);
        });
      });
    };

    z1.start().then(() => {
      z2.start().then(() => {
        setTimeout(stopTimeouts, 200);
        setTimeout(stopAll, ZyrePeer.PEER_EXPIRED + 200);
      });
    });
  });

  it('should inform about peers that are back from being expired', function (done) {
    // Set higher timeout to test expired peers
    this.timeout(ZyrePeer.PEER_EXPIRED + 10000);

    const z1 = zyre.new({ name: 'z1' });
    const z2 = zyre.new({ name: 'z2' });

    let hit = false;

    z1.on('back', (id, name) => {
      assert.equal(id, z2.getIdentity());
      assert.equal(name, 'z2');
      hit = true;
    });

    const stopTimeouts = () => {
      clearInterval(z1._zBeacon._broadcastTimer);
      clearInterval(z2._zBeacon._broadcastTimer);
      assert.isDefined(z1.getPeer(z2.getIdentity()));
      assert.isDefined(z2.getPeer(z1.getIdentity()));
      clearTimeout(z1._zyrePeers._peers[z2.getIdentity()]._evasiveTimeout);
      clearTimeout(z2._zyrePeers._peers[z1.getIdentity()]._evasiveTimeout);
    };

    const startBroadcast = () => {
      z2._zBeacon.startBroadcasting();
    };

    const stopAll = () => {
      z2.stop().then(() => {
        z1.stop().then(() => {
          if (hit) setTimeout(() => { done(); }, 200);
        });
      });
    };

    z1.start().then(() => {
      z2.start().then(() => {
        setTimeout(stopTimeouts, 200);
        setTimeout(startBroadcast, ZyrePeer.PEER_EXPIRED + 200);
        setTimeout(stopAll, ZyrePeer.PEER_EXPIRED + 400);
      });
    });
  });

  it('should inform about disconnected peers', (done) => {
    const z1 = zyre.new({ name: 'z1' });
    const z2 = zyre.new({ name: 'z2' });

    let hit = false;

    z1.on('disconnect', (id, name) => {
      assert.equal(id, z2.getIdentity());
      assert.equal(name, 'z2');
      hit = true;
    });

    const stopZ2 = () => {
      z2.stop();
    };

    const stopAll = () => {
      z1.stop().then(() => {
        if (hit) setTimeout(() => { done(); }, 200);
      });
    };

    z1.start().then(() => {
      z2.start().then(() => {
        setTimeout(stopZ2, 200);
        setTimeout(stopAll, 400);
      });
    });
  });

  it('should inform about connected peers', (done) => {
    const z1 = zyre.new({ name: 'z1' });
    const z2 = zyre.new({ name: 'z2' });

    let hit = false;

    z1.on('connect', (id, name) => {
      assert.equal(id, z2.getIdentity());
      assert.equal(name, 'z2');
      hit = true;
    });

    const stopAll = () => {
      z2.stop().then(() => {
        z1.stop().then(() => {
          if (hit) setTimeout(() => { done(); }, 200);
        });
      });
    };

    z1.start().then(() => {
      z2.start().then(() => {
        setTimeout(stopAll, 200);
      });
    });
  });

  it('should communicate with WHISPER messages', (done) => {
    const z1 = zyre.new({ name: 'z1' });
    const z2 = zyre.new({ name: 'z2' });

    let hit = false;

    z1.on('whisper', (id, name, message) => {
      assert.equal(id, z2.getIdentity());
      assert.equal(name, 'z2');
      assert.equal(message, 'Hey!');
      hit = true;
    });

    z2.on('whisper', (id, name, message) => {
      assert.equal(id, z1.getIdentity());
      assert.equal(name, 'z1');
      assert.equal(message, 'Hello World!');
      z2.whisper(z1.getIdentity(), 'Hey!');
    });

    const whisper = () => {
      z1.whisper(z2.getIdentity(), 'Hello World!');
    };

    const stopAll = () => {
      z2.stop().then(() => {
        z1.stop().then(() => {
          if (hit) setTimeout(() => { done(); }, 200);
        });
      });
    };

    z1.start().then(() => {
      z2.start().then(() => {
        setTimeout(whisper, 200);
        setTimeout(stopAll, 400);
      });
    });
  });

  it('should communicate with SHOUT messages', (done) => {
    const z1 = zyre.new({ name: 'z1' });
    const z2 = zyre.new({ name: 'z2' });
    const z3 = zyre.new({ name: 'z3' });

    let hit1 = false;
    let hit2 = false;

    z2.on('shout', (id, name, message, group) => {
      assert.equal(id, z1.getIdentity());
      assert.equal(name, 'z1');
      assert.equal(message, 'Hello World!');
      assert.equal(group, 'CHAT');
      hit1 = true;
    });

    z3.on('shout', (id, name, message, group) => {
      assert.equal(id, z1.getIdentity());
      assert.equal(name, 'z1');
      assert.equal(message, 'Hello World!');
      assert.equal(group, 'CHAT');
      hit2 = true;
    });

    const shout = () => {
      z1.shout('CHAT', 'Hello World!');
    };

    const stopAll = () => {
      z3.stop().then(() => {
        z2.stop().then(() => {
          z1.stop().then(() => {
            if (hit1 && hit2) setTimeout(() => { done(); }, 200);
          });
        });
      });
    };

    z1.start().then(() => {
      z1.join('CHAT');
      z2.start().then(() => {
        z2.join('CHAT');
        z3.start().then(() => {
          z3.join('CHAT');
          setTimeout(shout, 200);
          setTimeout(stopAll, 400);
        });
      });
    });
  });

  it('should join a group and send JOIN messages', (done) => {
    const z1 = zyre.new({ name: 'z1' });
    const z2 = zyre.new({ name: 'z2' });

    let hit = false;

    z2.on('join', (id, name, group) => {
      assert.equal(id, z1.getIdentity());
      assert.equal(name, 'z1');
      assert.equal(group, 'CHAT');
      assert.property(z2.getGroup('CHAT'), z1.getIdentity());
      hit = true;
    });

    const join = () => {
      z1.join('CHAT');
    };

    const stopAll = () => {
      z1.stop().then(() => {
        z2.stop().then(() => {
          if (hit) setTimeout(() => { done(); }, 200);
        });
      });
    };

    z1.start().then(() => {
      z2.start().then(() => {
        setTimeout(join, 200);
        setTimeout(stopAll, 400);
      });
    });
  });

  it('should leave a group and send LEAVE messages', (done) => {
    const z1 = zyre.new({ name: 'z1' });
    const z2 = zyre.new({ name: 'z2' });

    let hit = false;

    z2.on('leave', (id, name, group) => {
      assert.equal(id, z1.getIdentity());
      assert.equal(name, 'z1');
      assert.equal(group, 'CHAT');
      assert.isNotObject(z2.getGroup(name));
      hit = true;
    });

    const join = () => {
      z1.join('CHAT');
    };

    const leave = () => {
      z1.leave('CHAT');
    };

    const stopAll = () => {
      z1.stop().then(() => {
        z2.stop().then(() => {
          if (hit) setTimeout(() => { done(); }, 200);
        });
      });
    };

    z1.start().then(() => {
      z2.start().then(() => {
        setTimeout(join, 200);
        setTimeout(leave, 400);
        setTimeout(stopAll, 600);
      });
    });
  });
});
