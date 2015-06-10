var path = require('path')
  , fs = require('fs-extra')
  , nuGet = require('./lib/nuget')
  , msbuild = require('./lib/msbuild');
  
module.exports = {
  init: function (config, job, context, cb) {
    config = config || {};
    var ret = {
      environment: function (context, done) {
        msbuild.ensurePathToExecutable(context, config, function(err) {
          if (err) {
            done(err, true);
          } else if (config.restorePackages) {
            nuGet.ensureNuGet(context, config, done)
          } else {
            done(null, true);
          }
        });
      },
      prepare: function (context, done) {   
        if (config.restorePackages) {
          nuGet.restorePackages(context, config, function(err, res) {
            if (err) {
              done(err, true);
            } else {
              msbuild.build(context, config, done);
            }
          });
        } else {
          msbuild.build(context, config, done);
        }
      }
    };
    
    if (config.restorePackages) {
      ret.cleanup = function (context, done) {      
        fs.remove(path.join(context.dataDir, 'packages'), function(err) { done(err, true); });
      };
    }
    
    cb(null, ret);
  }
}
