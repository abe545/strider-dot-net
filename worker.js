var nuGet = require('./lib/nuget')
  , msbuild = require('./lib/msbuild');
  
module.exports = {
  init: function (config, job, context, cb) {
    config = config || {};
    cb(null, {
      environment: function (context, done) {
        msbuild.ensurePathToExecutable(context, config, function(err) {
          if (err) {
            done(err, true);
          } else if (config.restorePackages) {
            nuGet.ensureNuGet(context, done)
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
    });
  }
}
