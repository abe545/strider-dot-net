var async = require('async')
  , _ = require('lodash')
  , nuGet = require('./lib/nuget')
  , msbuild = require('./lib/msbuild')
  , version = require('./lib/version');
  
module.exports = {
  init: function (config, job, context, cb) {
    config = config || {};
    cb(null, {
      environment: function (context, done) {
        var tasks = [];
        tasks.push(function(next) {
          msbuild.ensurePathToExecutable(context, config, next);  
        });
        if (config.restorePackages) {
          tasks.push(function(next) {
            nuGet.ensureNuGet(context, next);
          });
        }
        
        run(tasks, done);
      },
      prepare: function (context, done) {   
        var tasks = [];
        if (config.restorePackages) {
          tasks.push(function(next) {
            nuGet.restorePackages(context, config, next);
          });
        }
          
        if (config.patchAssemblyVersions) {
          tasks.push(function(next) {
            version.patchFiles(context, config, next);
          });
        }
        
        tasks.push(function(next) {
          msbuild.build(context, config, next);
        });
        
        run(tasks, done);
      }
    });
  }
}

var run = function(tasks, done) {
  async.series(tasks, function(err, results) {
    console.log(err);
    done(err, _.any(results, true));
  });
}