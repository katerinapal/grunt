import { grunt as grunt_gruntjs } from "../grunt";
'use strict';

var encapsulated_fail;

// The module to be exported.
var fail = encapsulated_fail = {};

// Error codes.
fail.code = {
  FATAL_ERROR: 1,
  MISSING_GRUNTFILE: 2,
  TASK_FAILURE: 3,
  TEMPLATE_ERROR: 4,
  INVALID_AUTOCOMPLETE: 5,
  WARNING: 6,
};

// DRY it up!
function writeln(e, mode) {
  grunt_gruntjs.log.muted = false;
  var msg = String(e.message || e);
  if (!grunt_gruntjs.option('no-color')) { msg += '\x07'; } // Beep!
  if (mode === 'warn') {
    msg = 'Warning: ' + msg + ' ';
    msg += (grunt_gruntjs.option('force') ? 'Used --force, continuing.'.underline : 'Use --force to continue.');
    msg = msg.yellow;
  } else {
    msg = ('Fatal error: ' + msg).red;
  }
  grunt_gruntjs.log.writeln(msg);
}

// If --stack is enabled, log the appropriate error stack (if it exists).
function dumpStack(e) {
  if (grunt_gruntjs.option('stack')) {
    if (e.origError && e.origError.stack) {
      console.log(e.origError.stack);
    } else if (e.stack) {
      console.log(e.stack);
    }
  }
}

// A fatal error occurred. Abort immediately.
fail.fatal = function(e, errcode) {
  writeln(e, 'fatal');
  dumpStack(e);
  grunt_gruntjs.util.exit(typeof errcode === 'number' ? errcode : fail.code.FATAL_ERROR);
};

// Keep track of error and warning counts.
fail.errorcount = 0;
fail.warncount = 0;

// A warning occurred. Abort immediately unless -f or --force was used.
fail.warn = function(e, errcode) {
  var message = typeof e === 'string' ? e : e.message;
  fail.warncount++;
  writeln(message, 'warn');
  // If -f or --force aren't used, stop script processing.
  if (!grunt_gruntjs.option('force')) {
    dumpStack(e);
    grunt_gruntjs.log.writeln().fail('Aborted due to warnings.');
    grunt_gruntjs.util.exit(typeof errcode === 'number' ? errcode : fail.code.WARNING);
  }
};

// This gets called at the very end.
fail.report = function() {
  if (fail.warncount > 0) {
    grunt_gruntjs.log.writeln().fail('Done, but with warnings.');
  } else {
    grunt_gruntjs.log.writeln().success('Done.');
  }
};
