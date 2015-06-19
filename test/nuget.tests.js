var expect = require('chai').expect
  , path = require('path')
  , expectRequire = require('a').expectRequire
  , fs = expectRequire('fs-extra').return(new Fs())
  , childProc = expectRequire('child_process').return(new ChildProc())
  , request = expectRequire('request').return(new Request())   
  , nuget = require('../lib/nuget');

describe('nuget', function() {
  describe('#ensureNuGet', function() {
    it('should update nuget.exe when it is already downloaded', function(done) {
      var ctx = new Context();
      Fs.prototype.exists = function(nugetPath, cb) {
        expect(nugetPath).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        cb(true);
      };
      ChildProc.prototype.spawn = function(nugetPath, args) {
        expect(nugetPath).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        expect(args).to.deep.equal([ 'update', '-Self' ]);
        return {
          stdout: new Emitter(),
          stderr: new Emitter(),
          on: function(name, cb) {
            if (name == 'close') {
              cb();
            }
          }  
        };
      };
      nuget.ensureNuGet(ctx, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
    it('should download nuget.exe when it does not already exist', function(done) {
      var ctx = new Context();
      Fs.prototype.exists = function(nugetPath, cb) {
        expect(nugetPath).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        cb(false);
      };
      Fs.prototype.ensureFile = function(nugetPath, cb) {
        expect(nugetPath).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        cb();
      };
      Fs.prototype.createWriteStream = function(nugetPath) {
        expect(nugetPath).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        return new NuGetDownloadBuffer();
      };
      Request.prototype.get = function(uri) {
        expect(uri).to.be.equal('http://www.nuget.org/nuget.exe');
        return {
          pipe: function(file) {
            file.doClose();
          }
        };
      };
      var nuget = require('../lib/nuget');
      nuget.ensureNuGet(ctx, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
    it('should report an error if downloading nuget.exe fails (when it does not already exist)', function(done) {
      var ctx = new Context();
      Fs.prototype.exists =  function(nugetPath, cb) {
        expect(nugetPath).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        cb(false);
      };
      Fs.prototype.ensureFile = function(nugetPath, cb) {
        expect(nugetPath).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        cb();
      };
      Fs.prototype.createWriteStream = function(nugetPath) {
        expect(nugetPath).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        var buffer = new NuGetDownloadBuffer();
        buffer.testError = 'test error';
        return buffer;
      };
      Request.prototype.get = function(uri) {
        expect(uri).to.be.equal('http://www.nuget.org/nuget.exe');
        return {
          pipe: function(file) {
            file.doClose();
          }
        };
      };
      var nuget = require('../lib/nuget');
      nuget.ensureNuGet(ctx, function(err, didRun) {
        expect(err).to.be.equal(1);
        expect(didRun).to.be.true;
        done();
      });
    });
  });
  describe('#restore', function() {
    it('should hide full path to nuget.exe', function(done) {
      var ctx = new Context();
      nuget.restorePackages(ctx, {}, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;        
        expect(ctx.runCmd.screen).to.be.equal('nuget restore');
        expect(ctx.runCmd.command).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        expect(ctx.runCmd.args).to.deep.equal(['restore', '-NonInteractive']);
        done();
      });
    });
    it('should return error when restore method is Project and no project specified', function(done) {
      nuget.restorePackages(new Context(), { restoreMethod: 'Project', projectFile: '' }, function(err, didRun) {
        expect(err).to.be.ok;
        expect(err).to.equal(1);
        expect(didRun).to.be.false;
        done();
      });
    });
    it('should add Project to command when restore method is Project', function(done) {
      var ctx = new Context();
      nuget.restorePackages(ctx, { restoreMethod: 'Project', projectFile: 'Test.proj' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;        
        expect(ctx.runCmd.screen).to.equal('nuget restore Test.proj');
        expect(ctx.runCmd.args).to.deep.equal(['restore', 'Test.proj', '-NonInteractive']);
        done();
      });
    });
    it('should return error when restore method is Custom and no file specified', function(done) {
      nuget.restorePackages(new Context(), { restoreMethod: 'Custom', customRestoreFile: '' }, function(err, didRun) {
        expect(err).to.be.ok;
        expect(err).to.equal(1);
        expect(didRun).to.be.false;
        done();
      });
    });
    it('should add Custom File to command when restore method is Custom', function(done) {
      var ctx = new Context();
      nuget.restorePackages(ctx, { restoreMethod: 'Custom', customRestoreFile: 'Custom' }, function(err, didRun) {
        expect(err).to.not.be.ok; 
        expect(didRun).to.be.true;       
        expect(ctx.runCmd.screen).to.equal('nuget restore Custom');
        expect(ctx.runCmd.args).to.deep.equal(['restore', 'Custom', '-NonInteractive']);
        done();
      });
    });
    it('should not add custom package source when value is empty array', function(done) {
      var ctx = new Context();
      nuget.restorePackages(ctx, { packageSources: [] }, function(err, didRun) {
        expect(err).to.not.be.ok; 
        expect(didRun).to.be.true;       
        expect(ctx.runCmd.screen).to.equal('nuget restore');
        expect(ctx.runCmd.args).to.deep.equal(['restore', '-NonInteractive']);
        done();
      });
    });
    it('should add single custom package source', function(done) {
      var ctx = new Context();
      nuget.restorePackages(ctx, { packageSources: [ 'customSource' ] }, function(err, didRun) {
        expect(err).to.not.be.ok; 
        expect(didRun).to.be.true;       
        expect(ctx.runCmd.screen).to.equal('nuget restore -source "customSource"');
        expect(ctx.runCmd.args).to.deep.equal(['restore', '-source', 'customSource', '-NonInteractive']);
        done();
      });
    });
    it('should add multiple custom package sources', function(done) {
      var ctx = new Context();
      nuget.restorePackages(ctx, { packageSources: [ 'customSource1', 'foo', 'bar' ] }, function(err, didRun) {
        expect(err).to.not.be.ok; 
        expect(didRun).to.be.true;       
        expect(ctx.runCmd.screen).to.equal('nuget restore -source "customSource1;foo;bar"');
        expect(ctx.runCmd.args).to.deep.equal(['restore', '-source', 'customSource1;foo;bar', '-NonInteractive']);
        done();
      });
    });
  }); 
});

function Context() {
  var self = this;
  this.baseDir = 'testDir';
  this.status = function() { };
  this.out = function() { };
  this.cmd = function(options, cb) {
    self.runCmd = options.cmd;
    cb(null);
  }
}

function Emitter() {
  this.setEncoding = function(encoding) { };
  this.on = function(name, cb) {
    if (name === 'data') {
      cb('test data');
    }
  };
}

function NuGetDownloadBuffer() {
  var self = this;
  this.testError = null;
  this.hasClosed = false;
  this.closer = null;
  this.on = function(name, cb) {
    if (self.testError) {
      if (name === 'error') {
        self.closer = cb;
      }
    } else if (name === 'finish') {
      self.closer = cb;
    }
  };
  this.close = function(cb) {
    self.hasClosed = true;
    cb();
  };
  this.doClose = function() {
    if (self.closer) {
      self.closer(self.testError);
    }
  };
}

function Fs() { }
function ChildProc() { }
function Request() { }