import { grunt as libgrunt_gruntjs } from "../../lib/grunt";
'use strict';

var config;

config = {
  setUp: function(done) {
    this.origData = libgrunt_gruntjs.config.data;
    libgrunt_gruntjs.config.init({
      meta: libgrunt_gruntjs.file.readJSON('test/fixtures/test.json'),
      foo: '<%= meta.foo %>',
      foo2: '<%= foo %>',
      obj: {
        foo: '<%= meta.foo %>',
        foo2: '<%= obj.foo %>',
        Arr: ['foo', '<%= obj.foo2 %>'],
        arr2: ['<%= arr %>', '<%= obj.Arr %>'],
      },
      bar: 'bar',
      arr: ['foo', '<%= obj.foo2 %>'],
      arr2: ['<%= arr %>', '<%= obj.Arr %>'],
      buffer: Buffer.from('test'),
    });
    done();
  },
  tearDown: function(done) {
    libgrunt_gruntjs.config.data = this.origData;
    done();
  },
  'config.escape': function(test) {
    test.expect(2);
    test.equal(libgrunt_gruntjs.config.escape('foo'), 'foo', 'Should do nothing if no . chars.');
    test.equal(libgrunt_gruntjs.config.escape('foo.bar.baz'), 'foo\\.bar\\.baz', 'Should escape all . chars.');
    test.done();
  },
  'config.getPropString': function(test) {
    test.expect(4);
    test.equal(libgrunt_gruntjs.config.getPropString('foo'), 'foo', 'Should do nothing if already a string.');
    test.equal(libgrunt_gruntjs.config.getPropString('foo.bar.baz'), 'foo.bar.baz', 'Should do nothing if already a string.');
    test.equal(libgrunt_gruntjs.config.getPropString(['foo', 'bar']), 'foo.bar', 'Should join parts into a dot-delimited string.');
    test.equal(libgrunt_gruntjs.config.getPropString(['foo.bar', 'baz.qux.zip']), 'foo\\.bar.baz\\.qux\\.zip', 'Should join parts into a dot-delimited string, escaping . chars in parts.');
    test.done();
  },
  'config.getRaw': function(test) {
    test.expect(4);
    test.equal(libgrunt_gruntjs.config.getRaw('foo'), '<%= meta.foo %>', 'Should not process templates.');
    test.equal(libgrunt_gruntjs.config.getRaw('obj.foo2'), '<%= obj.foo %>', 'Should not process templates.');
    test.equal(libgrunt_gruntjs.config.getRaw(['obj', 'foo2']), '<%= obj.foo %>', 'Should not process templates.');
    test.deepEqual(libgrunt_gruntjs.config.getRaw('arr'), ['foo', '<%= obj.foo2 %>'], 'Should not process templates.');
    test.done();
  },
  'config.process': function(test) {
    test.expect(7);
    test.equal(libgrunt_gruntjs.config.process('<%= meta.foo %>'), 'bar', 'Should process templates.');
    test.equal(libgrunt_gruntjs.config.process('<%= foo %>'), 'bar', 'Should process templates recursively.');
    test.equal(libgrunt_gruntjs.config.process('<%= obj.foo %>'), 'bar', 'Should process deeply nested templates recursively.');
    test.deepEqual(libgrunt_gruntjs.config.process(['foo', '<%= obj.foo2 %>']), ['foo', 'bar'], 'Should process templates in arrays.');
    test.deepEqual(libgrunt_gruntjs.config.process(['<%= arr %>', '<%= obj.Arr %>']), [['foo', 'bar'], ['foo', 'bar']], 'Should expand <%= arr %> and <%= obj.Arr %> values as objects if possible.');
    var buf = libgrunt_gruntjs.config.process('<%= buffer %>');
    test.ok(Buffer.isBuffer(buf), 'Should retrieve Buffer instances as Buffer.');
    test.deepEqual(buf, Buffer.from('test'), 'Should return buffers as-is.');
    test.done();
  },
  'config.get': function(test) {
    test.expect(10);
    test.equal(libgrunt_gruntjs.config.get('foo'), 'bar', 'Should process templates.');
    test.equal(libgrunt_gruntjs.config.get('foo2'), 'bar', 'Should process templates recursively.');
    test.equal(libgrunt_gruntjs.config.get('obj.foo2'), 'bar', 'Should process deeply nested templates recursively.');
    test.equal(libgrunt_gruntjs.config.get(['obj', 'foo2']), 'bar', 'Should process deeply nested templates recursively.');
    test.deepEqual(libgrunt_gruntjs.config.get('arr'), ['foo', 'bar'], 'Should process templates in arrays.');
    test.deepEqual(libgrunt_gruntjs.config.get('obj.Arr'), ['foo', 'bar'], 'Should process templates in arrays.');
    test.deepEqual(libgrunt_gruntjs.config.get('arr2'), [['foo', 'bar'], ['foo', 'bar']], 'Should expand <%= arr %> and <%= obj.Arr %> values as objects if possible.');
    test.deepEqual(libgrunt_gruntjs.config.get(['obj', 'arr2']), [['foo', 'bar'], ['foo', 'bar']], 'Should expand <%= arr %> and <%= obj.Arr %> values as objects if possible.');
    var buf = libgrunt_gruntjs.config.get('buffer');
    test.ok(Buffer.isBuffer(buf), 'Should retrieve Buffer instances as Buffer.');
    test.deepEqual(buf, Buffer.from('test'), 'Should return buffers as-is.');
    test.done();
  },
  'config.set': function(test) {
    test.expect(6);
    test.equal(libgrunt_gruntjs.config.set('foo3', '<%= foo2 %>'), '<%= foo2 %>', 'Should set values.');
    test.equal(libgrunt_gruntjs.config.getRaw('foo3'), '<%= foo2 %>', 'Should have set the value.');
    test.equal(libgrunt_gruntjs.config.data.foo3, '<%= foo2 %>', 'Should have set the value.');
    test.equal(libgrunt_gruntjs.config.set('a.b.c', '<%= foo2 %>'), '<%= foo2 %>', 'Should create interim objects.');
    test.equal(libgrunt_gruntjs.config.getRaw('a.b.c'), '<%= foo2 %>', 'Should have set the value.');
    test.equal(libgrunt_gruntjs.config.data.a.b.c, '<%= foo2 %>', 'Should have set the value.');
    test.done();
  },
  'config.merge': function(test) {
    test.expect(4);
    test.deepEqual(libgrunt_gruntjs.config.merge({}), libgrunt_gruntjs.config.getRaw(), 'Should return internal data object.');
    libgrunt_gruntjs.config.set('obj', {a: 12});
    libgrunt_gruntjs.config.merge({
      foo: 'test',
      baz: '123',
      obj: {a: 34, b: 56},
    });
    test.deepEqual(libgrunt_gruntjs.config.getRaw('foo'), 'test', 'Should overwrite existing properties.');
    test.deepEqual(libgrunt_gruntjs.config.getRaw('baz'), '123', 'Should add new properties.');
    test.deepEqual(libgrunt_gruntjs.config.getRaw('obj'), {a: 34, b: 56}, 'Should deep merge.');
    test.done();
  },
  'config': function(test) {
    test.expect(10);
    test.equal(libgrunt_gruntjs.config('foo'), 'bar', 'Should retrieve processed data.');
    test.equal(libgrunt_gruntjs.config('obj.foo2'), 'bar', 'Should retrieve processed data.');
    test.equal(libgrunt_gruntjs.config(['obj', 'foo2']), 'bar', 'Should retrieve processed data.');
    test.deepEqual(libgrunt_gruntjs.config('arr'), ['foo', 'bar'], 'Should process templates in arrays.');

    test.equal(libgrunt_gruntjs.config('foo3', '<%= foo2 %>'), '<%= foo2 %>', 'Should set values.');
    test.equal(libgrunt_gruntjs.config.getRaw('foo3'), '<%= foo2 %>', 'Should have set the value.');
    test.equal(libgrunt_gruntjs.config.data.foo3, '<%= foo2 %>', 'Should have set the value.');
    test.equal(libgrunt_gruntjs.config('a.b.c', '<%= foo2 %>'), '<%= foo2 %>', 'Should create interim objects.');
    test.equal(libgrunt_gruntjs.config.getRaw('a.b.c'), '<%= foo2 %>', 'Should have set the value.');
    test.equal(libgrunt_gruntjs.config.data.a.b.c, '<%= foo2 %>', 'Should have set the value.');
    test.done();
  },
  'config.requires': function(test) {
    test.expect(8);
    libgrunt_gruntjs.log.muted = true;
    test.doesNotThrow(function() { libgrunt_gruntjs.config.requires('foo'); }, 'This property exists.');
    test.doesNotThrow(function() { libgrunt_gruntjs.config.requires('obj.foo'); }, 'This property exists.');
    test.doesNotThrow(function() { libgrunt_gruntjs.config.requires('foo', 'obj.foo', 'obj.foo2'); }, 'These properties exist.');
    test.doesNotThrow(function() { libgrunt_gruntjs.config.requires('foo', ['obj', 'foo'], ['obj', 'foo2']); }, 'These properties exist.');
    test.throws(function() { libgrunt_gruntjs.config.requires('xyz'); }, 'This property does not exist.');
    test.throws(function() { libgrunt_gruntjs.config.requires('obj.xyz'); }, 'This property does not exist.');
    test.throws(function() { libgrunt_gruntjs.config.requires('foo', 'obj.foo', 'obj.xyz'); }, 'One property does not exist.');
    test.throws(function() { libgrunt_gruntjs.config.requires('foo', ['obj', 'foo'], ['obj', 'xyz']); }, 'One property does not exist.');
    libgrunt_gruntjs.log.muted = false;
    test.done();
  },
};
