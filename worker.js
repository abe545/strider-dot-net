var path = require('path')
  , fs = require('fs-extra')
  , childProc = require('child_process')
  , async = require('async')
  , _ = require('lodash');

function build(context, config, done) {
  var screen = 'msbuild';
  var args = [];
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
  
  if (config.netVersion && config.netVersion != 'whatever') {
    findmsbuild(config.netVersion, 'Framework64', function (err, fullpath) {
      if (err || !fullpath) {
        findmsbuild(config.netVersion, 'Framework', function (err, fullpath) {
          if (err) {
            var time = new Date();
            context.status('command.start', { command: screen, started: time, time: time, plugin: 'dotnet' });
            context.status('stderr', '\u001b[31;1m' + err + '\u001b[0m');
            context.status('command.done', { exitCode: 404, time: time, elapsed: 0 });
            return done(404, err);
          } else {
            msbuild(context, fullpath, args, screen, done);
          }
        });
      } else {
        msbuild(context, fullpath, args, screen, done);
      }
    });
  } else {
    msbuild(context, 'msbuild', args, screen, done);
  }
}

function findmsbuild(version, framework, callback) {
  var root = process.env.windir + '\\Microsoft.NET\\' + framework;
  async.waterfall([
    function (next) {
      fs.readdir(root, next);
    },
    function (files, next) {
      var dir = _.find(files, function(f) {
        return f.indexOf('v' + version) >= 0;
      });
      
      if (dir) {
        next(null, root + '\\' + dir);
      } else {
        next('msbuild could not be found for .NET ' + version);
      }
    },
    function (dir, next) {
      var msbuild = dir + '\\msbuild.exe';
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
  
module.exports = {
  init: function (config, job, context, cb) {
    config = config || {}
    var ret = {
      prepare: function (context, done) {   
        build(context, config, done);
      }
    };
    
    cb(null, ret);
  }
}