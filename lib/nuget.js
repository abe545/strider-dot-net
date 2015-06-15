if (global.GENTLY) require = GENTLY.hijack(require);

var request = require('request')
  , childProc = require('child_process')
  , fs = require('fs-extra')
  , path = require('path');

module.exports = {
  ensureNuGet: ensureNuGet,
  restorePackages: restorePackages
}

function ensureNuGet(context, done) {
  var start = new Date();
  context.status('command.start', { command: 'Downloading latest Nuget.exe', started: start, time: start, plugin: context.plugin });
  var nugetPath = path.join(context.baseDir, 'nuget', 'nuget.exe');
    
  var callDone = function(exitCode) {
    var end = new Date();
    context.status('command.done', { exitCode: exitCode, time: end, elapsed: end.getTime() - start.getTime() });
    done(exitCode, true);
  }
  
  fs.exists(nugetPath, function(exists) {
    if (exists) {
      var proc = childProc.spawn(nugetPath, [ 'update', '-Self' ]);
      proc.stdout.setEncoding('utf8')
      proc.stderr.setEncoding('utf8')
      proc.stdout.on('data', context.out);
      proc.stderr.on('data', function(data) { context.out(data, 'stderr'); });
      proc.on('close', callDone);
    } else {
      fs.ensureFile(nugetPath, function() {
        var file = fs.createWriteStream(nugetPath);
        context.out('Downloading https://www.nuget.org/nuget.exe');
        file.on('error', function(err) {
          context.out(err, 'stderr');
          callDone(1);
        });
        file.on('finish', function() {
          file.close(callDone);
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
  
  if (config.restoreMethod === 'Project') {
    var start = new Date();
    if (!config.projectFile) {
      context.status('command.start', { command: screen, started: start, time: start, plugin: context.plugin });
      context.out('You must specify a project file when setting the restore method to project!', 'error');
      context.status('command.done', { exitCode: 1, time: start, elapsed: 0 });
      return done(1, false); 
    }
    args.push(config.projectFile);
    screen += ' ' + config.projectFile;
  } else if (config.restoreMethod === 'Custom') {
    if (!config.customRestoreFile) {
      context.status('command.start', { command: screen, started: start, time: start, plugin: context.plugin });
      context.out('You must specify a file when setting the nuget restore method to custom!', 'error');
      context.status('command.done', { exitCode: 1, time: start, elapsed: 0 });
      return done(1, false); 
    }
    args.push(config.customRestoreFile);
    screen += ' ' + config.customRestoreFile;
  }
  
  if (config.packageSources && config.packageSources.length) {
    // strider will escape this for us
    var allSources = config.packageSources.join(';');
    args.push('-source');
    args.push(allSources);
    screen += ' -source "' + allSources + '"';
  }
  
  // restore has to be first, so we can't add this in the args declaration
  args.push('-NonInteractive');
  
  context.cmd({
    cmd: {
      command: nugetPath,
      args: args,
      screen: screen
    }
  }, function(err) { done(err, true); });
}