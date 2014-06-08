var path = require('path')
  , fs = require('fs-extra')
  , childProc = require('child_process')
  , async = require('async')
  , _ = require('lodash');

function parseBuild(context, config, done) {
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
  var platform = config.customPlatform || config.platform;
  if (platform && platform != 'Default') {
    platform = '/p:Platform=' + platform; 
    args.push(platform);
    screen += ' ' + platform;
  }
  
  if (config.netVersion && config.netVersion != 'whatever') {
    findmsbuild(config.netVersion, 'Framework64', function (err, fullpath) {
      if (err || !fullpath) {
        findmsbuild(config.netVersion, 'Framework', function (err, fullpath) {
          if (err) {
            done(err);
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
        parseBuild(context, config, done);
      }
    };
    
    cb(null, ret);
  }
}