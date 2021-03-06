var fs = require('fs-extra')
  , async = require('async')
  , path = require('path')
  , childProc = require('child_process')
  , _ = require('lodash')
  , vsVersionMapping = {
    'Visual Studio 2013' : '12.0'
  };

module.exports = {
    build: build,
    ensurePathToExecutable: ensurePathToExecutable
}

function build(context, config, done) {
  var screen = 'msbuild';
  var args = [];
  
  try {
    var logger = require('strider-msbuild-logger')();
  } catch (err) {
    logger = null;
  }

  if (logger) {
    // shut off the standard console logger, otherwise the output will be logged twice
    args.push('/noconsolelogger', '/logger:' + logger);
  } 
  
  if (config.projectFile) {
    args.push(config.projectFile);
    screen += ' ' + config.projectFile;
  }
  
  if (config.targets && config.targets.length) {
    var targets = '/t:';
    targets += _.reduce(config.targets, function (a, t) { return a + ';' + t; });
    args.push(targets);
    screen += ' ' + targets;
  }
  var configuration = config.customConfiguration || config.configuration;
  if (configuration && configuration !== 'Default') {
    configuration = '/p:Configuration=' + configuration; 
    args.push(configuration);
    screen += ' ' + configuration;
  }
  
  var platform = config.customPlatform || config.platform;
  if (platform && platform !== 'Default') {
    platform = '/p:Platform=' + platform; 
    args.push(platform);
    screen += ' ' + platform;
  }
  if (config.customProperties && config.customProperties.length) {
    _.each(config.customProperties, function (p) {
      var prop = '/p:' + p.name + '=' + p.value;
      args.push(prop);
      screen += ' ' + prop;
    });
  }
  
  var start = new Date();
  context.status('command.start', { command: screen, started: start, time: start, plugin: context.plugin });
  
  var proc = childProc.spawn(config.msbuildPath, args, {
    env: process.env,
    cwd: context.dataDir
  });
  
  var errorFound = false;
  proc.on('error', function(err) {
    errorFound = true;
    var msg = 'msbuild.exe not found. Is it in the path?';
    if (err.code === 'ENOENT') {
      if (config.msbuildVersion && config.msbuildVersion !== 'Whatever') {
        msg = 'msbuild.exe not found. It was expected at ' + config.msbuildPath; 
      }
    } else {
      msg = 'Unexpected error while calling msbuild: ' + err;  
    }
    
    context.out(msg, 'error');
    var end = new Date();
    context.status('command.done', { exitCode: 404, time: end, elapsed: end.getTime() - start.getTime() });
    done(404, false);
  });
  
  proc.stdout.setEncoding('utf8')
  proc.stderr.setEncoding('utf8')
  proc.stdout.on('data', function(data) { context.out(data); });
  proc.stderr.on('data', function(data) { context.out(data, 'stderr'); });
  proc.on('close', function(exit) {
    if (!errorFound) {
      var end = new Date();
      context.status('command.done', { exitCode: exit, time: end, elapsed: end.getTime() - start.getTime() });
      done(exit, true);
    }
  });
}

function ensurePathToExecutable(context, config, done) {
  var start = new Date();
  context.status('command.start', { command: 'Finding msbuild.exe', started: start, time: start, plugin: context.plugin });
  
  var failToFindMsbuild = function(err) {
    var end = new Date();
    context.out(err, 'error');
    context.status('command.done', { time: end, elapsed: end.getTime() - start.getTime() });
    done(404);
  }
  
  if (!config.msbuildVersion || config.msbuildVersion === 'Whatever') {
    config.msbuildPath = 'msbuild.exe';
    context.out('Using msbuild.exe from path. The build will fail if it is not in the path!', 'message');
    done();
  } else if (config.msbuildVersion === 'Custom') {
    if (config.customMsbuildPath && config.customMsbuildPath.length) {
      fs.stat(config.customMsbuildPath, function(err, stats) {
        if (err) {
          failToFindMsbuild(err);
        } else if (stats.isDirectory()) {
          failToFindMsbuild('Directory passed in as custom msbuild path. It should include msbuild.exe');
        } else if (stats.isFile()) {
          msbuildFound(context, config, config.customMsbuildPath, start, done);
        } else {
          failToFindMsbuild('No file found at custom msbuild path ' + config.customMsbuildPath + '. This should point to the fully qualified path to msbuild.exe');
        }
      });
    } else {
      failToFindMsbuild('You must specify the custom msbuild path when selecting custom msbuild version.');
    }
  } else {
    var searchMethod = findMsBuildInNetPath;  
    if (vsVersionMapping[config.msbuildVersion]) {
      searchMethod = findMsBuildInProgramFiles;
    }
  
    searchMethod(config.msbuildVersion, true, function (err, fullpath) {
      if (err || !fullpath) {
        searchMethod(config.msbuildVersion, false, function (err, fullpath) {
          if (err) {
            failToFindMsbuild(err);
          } else {
            msbuildFound(context, config, fullpath, start, done);
          }
        });
      } else {
        msbuildFound(context, config, fullpath, start, done);
      }
    });
  }
}

function msbuildFound(context, config, fullpath, start, done) {
  config.msbuildPath = fullpath;
  
  var end = new Date();
  context.out(fullpath, 'message');
  context.status('command.done', { exitCode: 0, time: end, elapsed: end.getTime() - start.getTime() });
  done();
}

function findMsBuildInNetPath(version, isSixtyFourBit, callback) {
  var root = path.join(process.env.windir, 'Microsoft.NET');
  if (isSixtyFourBit) {
    root = path.join(root, 'Framework64');
  } else {
    root = path.join(root, 'Framework');
  }
  async.waterfall([
    function (next) {
      fs.readdir(root, next);
    },
    function (files, next) {
      var dir = _.find(files, function(f) {
        return f.indexOf('v' + version) >= 0;
      });
      
      if (dir) {
        next(null, path.join(root, dir));
      } else {
        next('msbuild could not be found for .NET ' + version);
      }
    },
    function (dir, next) {
      findMsBuildInDirectory(dir, '.NET ' + version, next);
    }
  ], callback);
}

function findMsBuildInProgramFiles(version, isSixtyFourBit, callback) {  
  var dir;
  var dirVersion = vsVersionMapping[version];  
  if (isSixtyFourBit) {
    dir = path.join(process.env['ProgramFiles(x86)'], 'MSBuild', dirVersion, 'bin', 'amd64');
  } else{
    dir = path.join(process.env['ProgramFiles(x86)'], 'MSBuild', dirVersion, 'bin');
    var origCallback = callback;
    callback = function(err, found) {
      if (!err && found) {
        origCallback(err, found);
      } else {
        findMsBuildInDirectory(path.join(process.env.ProgramFiles, 'MSBuild', dirVersion, 'bin'), version, origCallback);
      }
    };
  }
  
  findMsBuildInDirectory(dir, version, callback);
}

function findMsBuildInDirectory(dir, version, callback) {
  var msbuild = path.join(dir, 'msbuild.exe');
  fs.exists(msbuild, function(exists) {
    if (exists) {
      callback(null, msbuild);
    } else {
      callback('msbuild could not be found for ' + version);
    }
  });
}