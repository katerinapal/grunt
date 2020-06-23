import ext_gruntlegacylog_gruntlegacylog from "grunt-legacy-log";
import ext_assert_assert from "assert";
import ext_through2_through from "through2";
'use strict';

var Log = ext_gruntlegacylog_gruntlegacylog.Log;
var encapsulated_anonymus;

encapsulated_anonymus = function(grunt) {
  grunt.file.setBase('../fixtures/load-npm-tasks');

  // Create a custom log to assert output
  var stdout = [];
  var oldlog = grunt.log;
  var stream = ext_through2_through(function(data, enc, next) {
    stdout.push(data.toString());
    next(null, data);
  });
  stream.pipe(process.stdout);
  var log = new Log({
    grunt: grunt,
    outStream: stream,
  });
  grunt.log = log;

  // Load a npm task
  grunt.loadNpmTasks('grunt-foo-plugin');

  // Run them
  grunt.registerTask('default', ['foo', 'done']);

  // Assert they loaded and ran correctly
  grunt.registerTask('done', function() {
    grunt.log = oldlog;
    stdout = stdout.join('\n');
    try {
      ext_assert_assert.ok(stdout.indexOf('foo has ran.') !== -1, 'oh-four task should have ran.');
    } catch (err) {
      grunt.log.subhead(err.message);
      grunt.log.error('Expected ' + err.expected + ' but actually: ' + err.actual);
      throw err;
    }
  });
};
