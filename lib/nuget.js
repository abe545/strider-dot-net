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
  fs.exists(nugetPath, function(exists) {
    if (exists) {
      var proc = childProc.spawn(nugetPath, [ 'update', '-Self' ]);
      proc.stdout.setEncoding('utf8')
      proc.stderr.setEncoding('utf8')
      proc.stdout.on('data', function(data) { context.out(data); });
      proc.stderr.on('data', function(data) { context.out(data, 'stderr'); });
      proc.on('close', function(exit) {
        var end = new Date();
        context.status('command.done', { exitCode: exit, time: end, elapsed: end.getTime() - start.getTime() });
        done(exit, true);
      });
    } else {
      fs.ensureFile(nugetPath, function() {
        var file = fs.createWriteStream(nugetPath);
        context.out('Downloading https://www.nuget.org/nuget.exe');
        file.on('finish', function() {
          file.close(function(err, data) {
            var end = new Date();
            var exit = 0;
            
            if (err) exit = -1;
            if (data) context.out(data);
            
            context.status('command.done', { exitCode: exit, time: end, elapsed: end.getTime() - start.getTime() });
            done(err, true);
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
    if (!config.projectFile) {
      var start = new Date();
      context.status('command.start', { command: screen, started: start, time: start, plugin: context.plugin });
      context.out('You must specify a project file when setting the restore method to project!', 'error');
      context.status('command.done', { exitCode: 1, time: start, elapsed: 0 });
      return done(1, true); 
    }
    args.push(config.projectFile);
    screen += ' ' + config.projectFile;
  } else if (config.restoreMethod == 'Custom') {
    if (!config.customRestoreFile) {
      var start = new Date();
      context.status('command.start', { command: screen, started: start, time: start, plugin: context.plugin });
      context.out('You must specify a file when setting the nuget restore method to custom!', 'error');
      context.status('command.done', { exitCode: 1, time: start, elapsed: 0 });
      return done(1, true); 
    }
    args.push(config.customRestoreFile);
    screen += ' ' + config.customRestoreFile;
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