var path = require('path')
  , fs = require('fs-extra')
  , childProc = require('child_process')
  , _ = require('lodash');

function msbuild(context, config, vsvars, done) {
  if (vsvars) {
    var screen = 'msbuild ' + config.projectFile;
    var args = [
          '/c',
          vsvars,
          '&',
          'msbuild',
          config.projectFile
        ];
        
    if (config.targets && config.targets.length) {
      var targets = '/t:';
      targets += _.reduce(config.targets, function (a, t) { return a + ';' + t; });
      args.push(targets);
      screen += ' ' + targets;
    }
        
    context.cmd({
      cmd: {
        command: 'cmd',
        args: args,
        screen: screen
      }
    }, done);
  }
  else {
    context.cmd({ 
      cmd: { command: 'msbuild', args: [config.projectFile] }
    }, done);
  }
}
  
module.exports = {
  init: function (config, job, context, cb) {
    config = config || {}
    var ret = {
      env: {},
      vsvars: '',
      prepare: function (context, done) {   
        if (!config.projectFile) {
          done(null, false);
        } else {
          msbuild(context, config, ret.vsvars, done);
        }
      }
    };
      
    if (config.vsVersion && config.vsVersion !== 'custom') {
      var vcDir;          
      switch (config.vsVersion) {
        case '2013':
          vcDir = process.env.VS120COMNTOOLS;
          break;
            
        case '2012':
          vcDir = process.env.VS110COMNTOOLS;
          break;
            
        case '2010':
          vcDir = process.env.VS100COMNTOOLS;
          break;
      }
          
      if (!vcDir) {
        return cb('Visual Studio ' + config.vsVersion + ' specified, but it is not installed.');
      }
          
      ret.vsvars = path.join(vcDir, '..', '..', 'vc', 'vcvarsall.bat');
      cb(null, ret);
    } else if (config.vsPath) {
      ret.vsvars = path.join(config.vsPath, 'vc', 'vcvarsall.bat');
      cb(null, ret);
    } else {
      cb(null, ret);
    }
  }
}