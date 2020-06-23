import { grunt as libgrunt_gruntjs } from "../../lib/grunt";
'use strict';

var event;

event = function(test) {
  test.expect(3);
  libgrunt_gruntjs.event.on('test.foo', function(a, b, c) {
    // This should get executed once (emit test.foo).
    test.equals(a + b + c, '123', 'Should have received the correct arguments.');
  });
  libgrunt_gruntjs.event.on('test.*', function(a, b, c) {
    // This should get executed twice (emit test.foo and test.bar).
    test.equals(a + b + c, '123', 'Should have received the correct arguments.');
  });
  libgrunt_gruntjs.event.emit('test.foo', '1', '2', '3');
  libgrunt_gruntjs.event.emit('test.bar', '1', '2', '3');
  test.done();
};
