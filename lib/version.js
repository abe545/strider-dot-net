var fs = require('fs-extra')
  , glob = require('glob')
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
        // on Windows, glob returns a full path, including drive letter.
        // strider just uses a relative path (unix style), so we have to 
        // resolve the path in order to hide the data directory from the output.
        var subStr = path.resolve(context.dataDir).length;
        async.each(files, function(f, cb) {
          context.out('Patching .' + f.substring(subStr) + '\r\n');
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
  var filePatterns = ['**/AssemblyInfo.cs'];
  if (config.assemblyVersionFiles && config.assemblyVersionFiles.length) {
    filePatterns = config.assemblyVersionFiles;
  }
  
  if (!filePatterns || !filePatterns.length) {
    return done();
  } 
  
  async.map(filePatterns, 
    function(file, cb) {
      glob(path.join(context.dataDir, file), cb);
    },
    function (err, files) {
      if (err) {
        done(err);
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
  fs.readFile(file, function(err, data) {
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
    
    fs.writeFile(file, content, cb);
  });
}

function setVersionAttribute(content, attrName, attrValue) {
  var regEx = new RegExp('(' + attrName + '(?:Attribute)*[\\s]*\\([\\s]*\\")(\\S+)(\\"[\\s]*\\))', 'gm');
  return content.replace(regEx, '$1' + attrValue + '$3');
}