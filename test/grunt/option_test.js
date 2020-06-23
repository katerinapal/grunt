import { grunt as libgrunt_gruntjs } from "../../lib/grunt";
'use strict';

var option;

option = {
  setUp: function(done) {
    libgrunt_gruntjs.option.init();
    done();
  },
  tearDown: function(done) {
    libgrunt_gruntjs.option.init();
    done();
  },
  'option.init': function(test) {
    test.expect(1);
    var expected = {foo: 'bar', bool: true, 'bar': {foo: 'bar'}};
    test.deepEqual(libgrunt_gruntjs.option.init(expected), expected);
    test.done();
  },
  'option': function(test) {
    test.expect(4);
    test.equal(libgrunt_gruntjs.option('foo', 'bar'), libgrunt_gruntjs.option('foo'));
    libgrunt_gruntjs.option('foo', {foo: 'bar'});
    test.deepEqual(libgrunt_gruntjs.option('foo'), {foo: 'bar'});
    test.equal(libgrunt_gruntjs.option('no-there'), false);
    libgrunt_gruntjs.option('there', false);
    test.equal(libgrunt_gruntjs.option('no-there'), true);
    test.done();
  },
  'option.flags': function(test) {
    test.expect(1);
    libgrunt_gruntjs.option.init({
      foo: 'bar',
      there: true,
      obj: {foo: 'bar'},
      arr: []
    });
    test.deepEqual(libgrunt_gruntjs.option.flags(), ['--foo=bar', '--there', '--obj=[object Object]']);
    test.done();
  },
};
