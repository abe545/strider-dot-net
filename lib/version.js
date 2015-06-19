var fs = require('fs-extra')
  , async = require('async')
  , path = require('path');

module.exports = {
  patchFiles: patchFiles
}

function patchFiles(context, config, done) {
  
  var start = new Date();
  context.status('command.start', { command: 'Patching .NET version attributes', started: start, time: start, plugin: context.plugin });
  
  async.waterfall([
    function(next) { findFiles(context, config, next); },
    function(files, next) {
      if (!files || !files.length) {
        context.out('No files found to patch', 'message');
        next();
      } else {
        async.each(files, function(f, cb) {
          context.out('Patching ' + f + '\r\n');
          patchAssemblyVersions(f, context, config, cb);
        }, function(err) {
          if (err) {
            next(err);
          } else {
            next(null, files);
          }
        });
      }
    }
  ], function(err, didRun) {
    var end = new Date();
    context.status('command.done', { exitCode: err ? 1 : 0, time: end, elapsed: end.getTime() - start.getTime() });
    done(err, didRun);
  });
}

function findFiles(context, config, done) {
  var filePatterns = [ '**/AssemblyInfo.cs', '**/AssemblyInfo.vb' ];
  if (config.assemblyVersionFiles && config.assemblyVersionFiles.length) {
    filePatterns = config.assemblyVersionFiles;
  }
  
  async.map(filePatterns, 
    function(file, cb) {
      require('glob')(file, { cwd: context.dataDir, nodir: true, nonull: false }, cb);
    },
    function (err, files) {
      if (err) {
        done(err);
      //} else if (!files || !files.length) {
      } else {
        // because glob returns an array of results for each file pattern,
        // we have to flatten them into one list of files to be patched.
        done(null, files.reduce(function(a, b) {
          if (!b) {
            return a;
          }
          return a.concat(b);
        }, []));
      }
    });
}

function patchAssemblyVersions(file, context, config, cb) {
  var fullPath = path.join(context.dataDir, file);
  fs.readFile(fullPath, function(err, data) {
    if (err) {
      return cb(err);
    }
    
    var content = data.toString();
    
    if (config.assemblyVersion) {
      content = setVersionAttribute(content, 'AssemblyVersion', config.assemblyVersion);
    }
    
    if (config.assemblyFileVersion) {
      content = setVersionAttribute(content, 'AssemblyFileVersion', config.assemblyFileVersion);      
    }
    
    if (config.assemblyInformationalVersion) {
      content = setVersionAttribute(content, 'AssemblyInformationalVersion', config.assemblyInformationalVersion);      
    }
    
    fs.writeFile(fullPath, content, cb);
  });
}

function setVersionAttribute(content, attrName, attrValue) {
  var regEx = new RegExp('(' + attrName + '(?:Attribute)*[\\s]*\\([\\s]*)(\\"[^\\n\\r\\f]*\\")([\\s]*\\))', 'gm');
  return content.replace(regEx, '$1"' + attrValue + '"$3');
}