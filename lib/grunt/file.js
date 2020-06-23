import { grunt as grunt_gruntjs } from "../grunt";
import ext_fs_fs from "fs";
import ext_path_path from "path";
import ext_glob_glob from "glob";
import ext_minimatch_minimatch from "minimatch";
import ext_findupsync_findupsync from "findup-sync";
import ext_jsyaml_YAML from "js-yaml";
import ext_rimraf_rimraf from "rimraf";
import ext_iconvlite_iconv from "iconv-lite";
import ext_pathisabsolute_pathIsAbsolute from "path-is-absolute";
import ext_mkdirp_mkdirp from "mkdirp";
'use strict';

var encapsulated_file;

// The module to be exported.
var file = encapsulated_file = {};

// External libs.
file.glob = ext_glob_glob;
file.minimatch = ext_minimatch_minimatch;
file.findup = ext_findupsync_findupsync;
var mkdirp = ext_mkdirp_mkdirp.sync;

// Windows?
var win32 = process.platform === 'win32';

// Normalize \\ paths to / paths.
var unixifyPath = function(filepath) {
  if (win32) {
    return filepath.replace(/\\/g, '/');
  } else {
    return filepath;
  }
};

// Change the current base path (ie, CWD) to the specified path.
file.setBase = function() {
  var dirpath = ext_path_path.join.apply(ext_path_path, arguments);
  process.chdir(dirpath);
};

// Process specified wildcard glob patterns or filenames against a
// callback, excluding and uniquing files in the result set.
var processPatterns = function(patterns, fn) {
  // Filepaths to return.
  var result = [];
  // Iterate over flattened patterns array.
  grunt_gruntjs.util._.flattenDeep(patterns).forEach(function(pattern) {
    // If the first character is ! it should be omitted
    var exclusion = pattern.indexOf('!') === 0;
    // If the pattern is an exclusion, remove the !
    if (exclusion) { pattern = pattern.slice(1); }
    // Find all matching files for this pattern.
    var matches = fn(pattern);
    if (exclusion) {
      // If an exclusion, remove matching files.
      result = grunt_gruntjs.util._.difference(result, matches);
    } else {
      // Otherwise add matching files.
      result = grunt_gruntjs.util._.union(result, matches);
    }
  });
  return result;
};

// Match a filepath or filepaths against one or more wildcard patterns. Returns
// all matching filepaths.
file.match = function(options, patterns, filepaths) {
  if (grunt_gruntjs.util.kindOf(options) !== 'object') {
    filepaths = patterns;
    patterns = options;
    options = {};
  }
  // Return empty set if either patterns or filepaths was omitted.
  if (patterns == null || filepaths == null) { return []; }
  // Normalize patterns and filepaths to arrays.
  if (!Array.isArray(patterns)) { patterns = [patterns]; }
  if (!Array.isArray(filepaths)) { filepaths = [filepaths]; }
  // Return empty set if there are no patterns or filepaths.
  if (patterns.length === 0 || filepaths.length === 0) { return []; }
  // Return all matching filepaths.
  return processPatterns(patterns, function(pattern) {
    return file.minimatch.match(filepaths, pattern, options);
  });
};

// Match a filepath or filepaths against one or more wildcard patterns. Returns
// true if any of the patterns match.
file.isMatch = function() {
  return file.match.apply(file, arguments).length > 0;
};

// Return an array of all file paths that match the given wildcard patterns.
file.expand = function() {
  var args = grunt_gruntjs.util.toArray(arguments);
  // If the first argument is an options object, save those options to pass
  // into the file.glob.sync method.
  var options = grunt_gruntjs.util.kindOf(args[0]) === 'object' ? args.shift() : {};
  // Use the first argument if it's an Array, otherwise convert the arguments
  // object to an array and use that.
  var patterns = Array.isArray(args[0]) ? args[0] : args;
  // Return empty set if there are no patterns or filepaths.
  if (patterns.length === 0) { return []; }
  // Return all matching filepaths.
  var matches = processPatterns(patterns, function(pattern) {
    // Find all matching files for this pattern.
    return file.glob.sync(pattern, options);
  });
  // Filter result set?
  if (options.filter) {
    matches = matches.filter(function(filepath) {
      filepath = ext_path_path.join(options.cwd || '', filepath);
      try {
        if (typeof options.filter === 'function') {
          return options.filter(filepath);
        } else {
          // If the file is of the right type and exists, this should work.
          return ext_fs_fs.statSync(filepath)[options.filter]();
        }
      } catch (e) {
        // Otherwise, it's probably not the right type.
        return false;
      }
    });
  }
  return matches;
};

var pathSeparatorRe = /[\/\\]/g;

// The "ext" option refers to either everything after the first dot (default)
// or everything after the last dot.
var extDotRe = {
  first: /(\.[^\/]*)?$/,
  last: /(\.[^\/\.]*)?$/,
};

// Build a multi task "files" object dynamically.
file.expandMapping = function(patterns, destBase, options) {
  options = grunt_gruntjs.util._.defaults({}, options, {
    extDot: 'first',
    rename: function(destBase, destPath) {
      return ext_path_path.join(destBase || '', destPath);
    }
  });
  var files = [];
  var fileByDest = {};
  // Find all files matching pattern, using passed-in options.
  file.expand(options, patterns).forEach(function(src) {
    var destPath = src;
    // Flatten?
    if (options.flatten) {
      destPath = ext_path_path.basename(destPath);
    }
    // Change the extension?
    if ('ext' in options) {
      destPath = destPath.replace(extDotRe[options.extDot], options.ext);
    }
    // Generate destination filename.
    var dest = options.rename(destBase, destPath, options);
    // Prepend cwd to src path if necessary.
    if (options.cwd) { src = ext_path_path.join(options.cwd, src); }
    // Normalize filepaths to be unix-style.
    dest = dest.replace(pathSeparatorRe, '/');
    src = src.replace(pathSeparatorRe, '/');
    // Map correct src path to dest path.
    if (fileByDest[dest]) {
      // If dest already exists, push this src onto that dest's src array.
      fileByDest[dest].src.push(src);
    } else {
      // Otherwise create a new src-dest file mapping object.
      files.push({
        src: [src],
        dest: dest,
      });
      // And store a reference for later use.
      fileByDest[dest] = files[files.length - 1];
    }
  });
  return files;
};

// Like mkdir -p. Create a directory and any intermediary directories.
file.mkdir = function(dirpath, mode) {
  if (grunt_gruntjs.option('no-write')) { return; }
  try {
    mkdirp(dirpath, { mode: mode });
  } catch (e) {
    throw grunt_gruntjs.util.error('Unable to create directory "' + dirpath + '" (Error code: ' + e.code + ').', e);
  }
};

// Recurse into a directory, executing callback for each file.
file.recurse = function recurse(rootdir, callback, subdir) {
  var abspath = subdir ? ext_path_path.join(rootdir, subdir) : rootdir;
  ext_fs_fs.readdirSync(abspath).forEach(function(filename) {
    var filepath = ext_path_path.join(abspath, filename);
    if (ext_fs_fs.statSync(filepath).isDirectory()) {
      recurse(rootdir, callback, unixifyPath(ext_path_path.join(subdir || '', filename || '')));
    } else {
      callback(unixifyPath(filepath), rootdir, subdir, filename);
    }
  });
};

// The default file encoding to use.
file.defaultEncoding = 'utf8';
// Whether to preserve the BOM on file.read rather than strip it.
file.preserveBOM = false;

// Read a file, return its contents.
file.read = function(filepath, options) {
  if (!options) { options = {}; }
  var contents;
  grunt_gruntjs.verbose.write('Reading ' + filepath + '...');
  try {
    contents = ext_fs_fs.readFileSync(String(filepath));
    // If encoding is not explicitly null, convert from encoded buffer to a
    // string. If no encoding was specified, use the default.
    if (options.encoding !== null) {
      contents = ext_iconvlite_iconv.decode(contents, options.encoding || file.defaultEncoding, {stripBOM: !file.preserveBOM});
    }
    grunt_gruntjs.verbose.ok();
    return contents;
  } catch (e) {
    grunt_gruntjs.verbose.error();
    throw grunt_gruntjs.util.error('Unable to read "' + filepath + '" file (Error code: ' + e.code + ').', e);
  }
};

// Read a file, parse its contents, return an object.
file.readJSON = function(filepath, options) {
  var src = file.read(filepath, options);
  var result;
  grunt_gruntjs.verbose.write('Parsing ' + filepath + '...');
  try {
    result = JSON.parse(src);
    grunt_gruntjs.verbose.ok();
    return result;
  } catch (e) {
    grunt_gruntjs.verbose.error();
    throw grunt_gruntjs.util.error('Unable to parse "' + filepath + '" file (' + e.message + ').', e);
  }
};

// Read a YAML file, parse its contents, return an object.
file.readYAML = function(filepath, options) {
  var src = file.read(filepath, options);
  var result;
  grunt_gruntjs.verbose.write('Parsing ' + filepath + '...');
  try {
    result = ext_jsyaml_YAML.load(src);
    grunt_gruntjs.verbose.ok();
    return result;
  } catch (e) {
    grunt_gruntjs.verbose.error();
    throw grunt_gruntjs.util.error('Unable to parse "' + filepath + '" file (' + e.message + ').', e);
  }
};

// Write a file.
file.write = function(filepath, contents, options) {
  if (!options) { options = {}; }
  var nowrite = grunt_gruntjs.option('no-write');
  grunt_gruntjs.verbose.write((nowrite ? 'Not actually writing ' : 'Writing ') + filepath + '...');
  // Create path, if necessary.
  file.mkdir(ext_path_path.dirname(filepath));
  try {
    // If contents is already a Buffer, don't try to encode it. If no encoding
    // was specified, use the default.
    if (!Buffer.isBuffer(contents)) {
      contents = ext_iconvlite_iconv.encode(contents, options.encoding || file.defaultEncoding);
    }
    // Actually write file.
    if (!nowrite) {
      ext_fs_fs.writeFileSync(filepath, contents, 'mode' in options ? {mode: options.mode} : {});
    }
    grunt_gruntjs.verbose.ok();
    return true;
  } catch (e) {
    grunt_gruntjs.verbose.error();
    throw grunt_gruntjs.util.error('Unable to write "' + filepath + '" file (Error code: ' + e.code + ').', e);
  }
};

// Read a file, optionally processing its content, then write the output.
// Or read a directory, recursively creating directories, reading files,
// processing content, writing output.
file.copy = function copy(srcpath, destpath, options) {
  if (file.isDir(srcpath)) {
    // Copy a directory, recursively.
    // Explicitly create new dest directory.
    file.mkdir(destpath);
    // Iterate over all sub-files/dirs, recursing.
    ext_fs_fs.readdirSync(srcpath).forEach(function(filepath) {
      copy(ext_path_path.join(srcpath, filepath), ext_path_path.join(destpath, filepath), options);
    });
  } else {
    // Copy a single file.
    file._copy(srcpath, destpath, options);
  }
};

// Read a file, optionally processing its content, then write the output.
file._copy = function(srcpath, destpath, options) {
  if (!options) { options = {}; }
  // If a process function was specified, and noProcess isn't true or doesn't
  // match the srcpath, process the file's source.
  var process = options.process && options.noProcess !== true &&
    !(options.noProcess && file.isMatch(options.noProcess, srcpath));
  // If the file will be processed, use the encoding as-specified. Otherwise,
  // use an encoding of null to force the file to be read/written as a Buffer.
  var readWriteOptions = process ? options : {encoding: null};
  // Actually read the file.
  var contents = file.read(srcpath, readWriteOptions);
  if (process) {
    grunt_gruntjs.verbose.write('Processing source...');
    try {
      contents = options.process(contents, srcpath, destpath);
      grunt_gruntjs.verbose.ok();
    } catch (e) {
      grunt_gruntjs.verbose.error();
      throw grunt_gruntjs.util.error('Error while processing "' + srcpath + '" file.', e);
    }
  }
  // Abort copy if the process function returns false.
  if (contents === false) {
    grunt_gruntjs.verbose.writeln('Write aborted.');
  } else {
    file.write(destpath, contents, readWriteOptions);
  }
};

// Delete folders and files recursively
file.delete = function(filepath, options) {
  filepath = String(filepath);

  var nowrite = grunt_gruntjs.option('no-write');
  if (!options) {
    options = {force: grunt_gruntjs.option('force') || false};
  }

  grunt_gruntjs.verbose.write((nowrite ? 'Not actually deleting ' : 'Deleting ') + filepath + '...');

  if (!file.exists(filepath)) {
    grunt_gruntjs.verbose.error();
    grunt_gruntjs.log.warn('Cannot delete nonexistent file.');
    return false;
  }

  // Only delete cwd or outside cwd if --force enabled. Be careful, people!
  if (!options.force) {
    if (file.isPathCwd(filepath)) {
      grunt_gruntjs.verbose.error();
      grunt_gruntjs.fail.warn('Cannot delete the current working directory.');
      return false;
    } else if (!file.isPathInCwd(filepath)) {
      grunt_gruntjs.verbose.error();
      grunt_gruntjs.fail.warn('Cannot delete files outside the current working directory.');
      return false;
    }
  }

  try {
    // Actually delete. Or not.
    if (!nowrite) {
      ext_rimraf_rimraf.sync(filepath);
    }
    grunt_gruntjs.verbose.ok();
    return true;
  } catch (e) {
    grunt_gruntjs.verbose.error();
    throw grunt_gruntjs.util.error('Unable to delete "' + filepath + '" file (' + e.message + ').', e);
  }
};

// True if the file path exists.
file.exists = function() {
  var filepath = ext_path_path.join.apply(ext_path_path, arguments);
  return ext_fs_fs.existsSync(filepath);
};

// True if the file is a symbolic link.
file.isLink = function() {
  var filepath = ext_path_path.join.apply(ext_path_path, arguments);
  return file.exists(filepath) && ext_fs_fs.lstatSync(filepath).isSymbolicLink();
};

// True if the path is a directory.
file.isDir = function() {
  var filepath = ext_path_path.join.apply(ext_path_path, arguments);
  return file.exists(filepath) && ext_fs_fs.statSync(filepath).isDirectory();
};

// True if the path is a file.
file.isFile = function() {
  var filepath = ext_path_path.join.apply(ext_path_path, arguments);
  return file.exists(filepath) && ext_fs_fs.statSync(filepath).isFile();
};

// Is a given file path absolute?
file.isPathAbsolute = function() {
  var filepath = ext_path_path.join.apply(ext_path_path, arguments);
  return ext_pathisabsolute_pathIsAbsolute(filepath);
};

// Do all the specified paths refer to the same path?
file.arePathsEquivalent = function(first) {
  first = ext_path_path.resolve(first);
  for (var i = 1; i < arguments.length; i++) {
    if (first !== ext_path_path.resolve(arguments[i])) { return false; }
  }
  return true;
};

// Are descendant path(s) contained within ancestor path? Note: does not test
// if paths actually exist.
file.doesPathContain = function(ancestor) {
  ancestor = ext_path_path.resolve(ancestor);
  var relative;
  for (var i = 1; i < arguments.length; i++) {
    relative = ext_path_path.relative(ext_path_path.resolve(arguments[i]), ancestor);
    if (relative === '' || /\w+/.test(relative)) { return false; }
  }
  return true;
};

// Test to see if a filepath is the CWD.
file.isPathCwd = function() {
  var filepath = ext_path_path.join.apply(ext_path_path, arguments);
  try {
    return file.arePathsEquivalent(ext_fs_fs.realpathSync(process.cwd()), ext_fs_fs.realpathSync(filepath));
  } catch (e) {
    return false;
  }
};

// Test to see if a filepath is contained within the CWD.
file.isPathInCwd = function() {
  var filepath = ext_path_path.join.apply(ext_path_path, arguments);
  try {
    return file.doesPathContain(ext_fs_fs.realpathSync(process.cwd()), ext_fs_fs.realpathSync(filepath));
  } catch (e) {
    return false;
  }
};
