var path = require('path')
  , fs = require('fs-extra')
  , childProc = require('child_process')
  , async = require('async')
  , _ = require('lodash')
  , request = require('request');

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
  if (configuration && configuration != 'Default') {
    configuration = '/p:Configuration=' + configuration; 
    args.push(configuration);
    screen += ' ' + configuration;
  }
  
  var platform = config.customPlatform || config.platform;
  if (platform && platform != 'Default') {
    platform = '/p:Platform=' + platform; 
    args.push(platform);
    screen += ' ' + platform;
  }
  if (config.customProperties && config.customProperties.length) {
    _.each(config.customProperties, function (prop) {
      var prop = '/p:' + prop.name + '=' + prop.value;
      args.push(prop);
      screen += ' ' + prop;
    });
  }
  
  msbuild(context, config.msbuildPath, args, screen, done);
}

function configureMsBuildPath(context, config, done) {
  if (!config.netVersion || config.netVersion == 'Whatever') {
    config.msbuildPath = 'msbuild';
    return done();
  }
  
  var start = new Date();
  context.status('command.start', { command: 'Finding msbuild', started: start, time: start, plugin: context.plugin });
  findmsbuild(config.netVersion, 'Framework64', function (err, fullpath) {
    if (err || !fullpath) {
      findmsbuild(config.netVersion, 'Framework', function (err, fullpath) {
        var end = new Date();
        if (err) {
          context.status('stderr', '\u001b[31;1m' + err + '\u001b[0m');
          context.status('command.done', { exitCode: 404, time: end, elapsed: end.getTime() - start.getTime() });
          return done(404, err);
        } else {
          config.msbuildPath = fullpath;
          context.status('stdout', '\u001b[32;1m' + fullpath + '\u001b[0m');
          context.status('command.done', { exitCode: 0, time: end, elapsed: end.getTime() - start.getTime() });
          done();
        }
      });
    } else {
      var end = new Date();
      config.msbuildPath = fullpath;
      context.status('stdout', '\u001b[32;1m' + fullpath + '\u001b[0m');
      context.status('command.done', { exitCode: 0, time: end, elapsed: end.getTime() - start.getTime() });
      done();
    }
  });
}

function findmsbuild(version, framework, callback) {
  var root = path.join(process.env.windir, 'Microsoft.NET', framework);
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
      var msbuild = path.join(dir, 'msbuild.exe');
      fs.exists(msbuild, function(exists) {
        if (exists) {
          next(null, msbuild);
        } else {
          next('msbuild could not be found for .NET ' + version);
        }
      });      
    }
  ], callback);
}

function msbuild(context, path, args, screen, done) {
  context.cmd({
    cmd: {
      command: path,
      args: args,
      screen: screen
    }
  }, done);
}

function ensureNuGet(context, config, done) {
  var start = new Date();
  context.status('command.start', { command: 'Downloading latest Nuget.exe', started: start, time: start, plugin: context.plugin });
  var nugetPath = path.join(context.baseDir, 'nuget', 'nuget.exe');
  fs.exists(nugetPath, function(exists) {
    if (exists) {
      var proc = childProc.spawn(nugetPath, [ 'update', '-Self' ]);
      proc.stdout.setEncoding('utf8')
      proc.stderr.setEncoding('utf8')
      proc.stdout.on('data', function(data) { context.status('stdout', data); });
      proc.stderr.on('data', function(data) { context.status('stderr', '\u001b[31;1m' + data + '\u001b[0m'); });
      proc.on('close', function(exit) {
        var end = new Date();
        context.status('command.done', { exitCode: exit, time: end, elapsed: end.getTime() - start.getTime() });
        done(exit);
      });
    } else {
      fs.ensureFile(nugetPath, function() {
        var file = fs.createWriteStream(nugetPath);
        context.status('stdout', 'Downloading https://www.nuget.org/nuget.exe');
        file.on('finish', function() {
          file.close(function(err, data) {
            var end = new Date();
            var exit = 0;
            
            if (err) exit = -1;
            if (data) context.status('stdout', data);
            
            context.status('command.done', { exitCode: exit, time: end, elapsed: end.getTime() - start.getTime() });
            done(err, data);
          });
        });
        request.get('http://www.nuget.org/nuget.exe').pipe(file);
      });
    }
  });
}

function restorePackages(context, config, done) {
  var nugetPath = path.join(context.baseDir, 'nuget', 'nuget.exe');
  var args = [ 'restore' ];
  var screen = 'nuget restore';
  
  if (config.packageSources && config.packageSources.length > 0) {
    // strider will escape this for us
    var allSources = config.packageSources.join(';');
    args.push('-source');
    args.push(allSources);
    screen += ' -source "' + allSources + '"';
  }
  
  if (config.restoreMethod == 'Project') {
    args.push(config.projectFile);
    screen += ' ' + config.projectFile;
  } else if (config.restoreMethod == 'Custom') {
    args.push(config.customRestoreFile);
    screen += ' ' + config.customRestoreFile;
  }
  args.push('-NonInteractive');
  context.cmd({
    cmd: {
      command: nugetPath,
      args: args,
      screen: screen
    }
  }, done);
}
  
module.exports = {
  init: function (config, job, context, cb) {
    config = config || {};
    var ret = {
      environment: function (context, done) {
        if (config.restorePackages) {
          configureMsBuildPath(context, config, ensureNuGet.bind(this, context, config, done));
        } else { 
          configureMsBuildPath(context, config, done);
        }
      },
      prepare: function (context, done) {   
        if (config.restorePackages) {
          restorePackages(context, config, function(err, res) {
            if (err) {
              done(err);
            } else {
              build(context, config, done);
            }
          });
        } else {
          build(context, config, done);
        }
      }
    };
    
    if (config.restorePackages) {
      ret.cleanup = function (context, done) {      
        fs.remove(path.join(context.dataDir, 'packages'), done);
      };
    }
    
    cb(null, ret);
  }
}
