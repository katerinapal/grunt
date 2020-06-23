import { grunt as grunt_gruntjs } from "../grunt";
import ext_path_path from "path";
'use strict';

// Set column widths.
var col1len = 0;
var initCol1;
initCol1 = function(str) {
  col1len = Math.max(col1len, str.length);
};
var initWidths;
initWidths = function() {
  var widths;
  // Widths for options/tasks table output.
  widths = [1, col1len, 2, 76 - col1len];
};

var table;

// Render an array in table form.
table = function(arr) {
  arr.forEach(function(item) {
    grunt_gruntjs.log.writetableln(widths, ['', grunt_gruntjs.util._.pad(item[0], col1len), '', item[1]]);
  });
};

var queue;

// Methods to run, in-order.
queue = [
  'initOptions',
  'initTasks',
  'initWidths',
  'header',
  'usage',
  'options',
  'optionsFooter',
  'tasks',
  'footer',
];

var display;

// Actually display stuff.
display = function() {
  queue.forEach(function(name) { exports[name](); });
};

var header;

// Header.
header = function() {
  grunt_gruntjs.log.writeln('Grunt: The JavaScript Task Runner (v' + grunt_gruntjs.version + ')');
};

var usage;

// Usage info.
usage = function() {
  grunt_gruntjs.log.header('Usage');
  grunt_gruntjs.log.writeln(' ' + ext_path_path.basename(process.argv[1]) + ' [options] [task [task ...]]');
};

var initOptions;

// Options.
initOptions = function() {
  var _options;
  // Build 2-column array for table view.
  _options = Object.keys(grunt_gruntjs.cli.optlist).map(function(long) {
    var o = grunt_gruntjs.cli.optlist[long];
    var col1 = '--' + (o.negate ? 'no-' : '') + long + (o.short ? ', -' + o.short : '');
    initCol1(col1);
    return [col1, o.info];
  });
};

var options;

options = function() {
  grunt_gruntjs.log.header('Options');
  table(_options);
};

var optionsFooter;

optionsFooter = function() {
  grunt_gruntjs.log.writeln().writelns(
    'Options marked with * have methods exposed via the grunt API and should ' +
    'instead be specified inside the Gruntfile wherever possible.'
  );
};

var initTasks;

// Tasks.
initTasks = function() {
  // Initialize task system so that the tasks can be listed.
  grunt_gruntjs.task.init([], {help: true});

  var _tasks;

  // Build object of tasks by info (where they were loaded from).
  _tasks = [];
  Object.keys(grunt_gruntjs.task._tasks).forEach(function(name) {
    initCol1(name);
    var task = grunt_gruntjs.task._tasks[name];
    _tasks.push(task);
  });
};

var tasks;

tasks = function() {
  grunt_gruntjs.log.header('Available tasks');
  if (_tasks.length === 0) {
    grunt_gruntjs.log.writeln('(no tasks found)');
  } else {
    table(_tasks.map(function(task) {
      var info = task.info;
      if (task.multi) { info += ' *'; }
      return [task.name, info];
    }));

    grunt_gruntjs.log.writeln().writelns(
      'Tasks run in the order specified. Arguments may be passed to tasks that ' +
      'accept them by using colons, like "lint:files". Tasks marked with * are ' +
      '"multi tasks" and will iterate over all sub-targets if no argument is ' +
      'specified.'
    );
  }

  grunt_gruntjs.log.writeln().writelns(
    'The list of available tasks may change based on tasks directories or ' +
    'grunt plugins specified in the Gruntfile or via command-line options.'
  );
};

var footer;

// Footer.
footer = function() {
  grunt_gruntjs.log.writeln().writeln('For more information, see http://gruntjs.com/');
};
