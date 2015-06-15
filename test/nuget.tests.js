var gently = global.GENTLY = new (require('gently'))
  , expect = require('chai').expect
  , path = require('path')
  , blanket = require('blanket')
  , nuget = require('../lib/nuget');

describe('nuget', function() {
  describe('#ensureNuGet', function() {
    it('should update nuget.exe when it is already downloaded', function() {
      var ctx = new Context();
      gently.expect(gently.hijacked['fs-extra'], 'exists', function(nugetPath, cb) {
        expect(nugetPath).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        cb(true);
      });
      gently.expect(gently.hijacked.child_process, 'spawn', function(nugetPath, args) {
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
      });
      nuget.ensureNuGet(ctx, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        gently.verify();
      });
    });
    it('should download nuget.exe when it does not already exist', function() {
      var ctx = new Context();
      gently.expect(gently.hijacked['fs-extra'], 'exists', function(nugetPath, cb) {
        expect(nugetPath).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        cb(false);
      });
      gently.expect(gently.hijacked['fs-extra'], 'ensureFile', function(nugetPath, cb) {
        expect(nugetPath).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        cb();
      });
      gently.expect(gently.hijacked['fs-extra'], 'createWriteStream', function(nugetPath) {
        expect(nugetPath).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        return new NuGetDownloadBuffer();
      });
      gently.expect(gently.hijacked.request, 'get', function(uri) {
        expect(uri).to.be.equal('http://www.nuget.org/nuget.exe');
        return {
          pipe: function(file) {
            file.doClose();
          }
        };
      });
      nuget.ensureNuGet(ctx, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        gently.verify();
      });
    });
    it('should report an error if downloading nuget.exe fails (when it does not already exist)', function() {
      var ctx = new Context();
      gently.expect(gently.hijacked['fs-extra'], 'exists', function(nugetPath, cb) {
        expect(nugetPath).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        cb(false);
      });
      gently.expect(gently.hijacked['fs-extra'], 'ensureFile', function(nugetPath, cb) {
        expect(nugetPath).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        cb();
      });
      gently.expect(gently.hijacked['fs-extra'], 'createWriteStream', function(nugetPath) {
        expect(nugetPath).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        var buffer = new NuGetDownloadBuffer();
        buffer.testError = 'test error';
        return buffer;
      });
      gently.expect(gently.hijacked.request, 'get', function(uri) {
        expect(uri).to.be.equal('http://www.nuget.org/nuget.exe');
        return {
          pipe: function(file) {
            file.doClose();
          }
        };
      });
      nuget.ensureNuGet(ctx, function(err, didRun) {
        expect(err).to.be.equal(1);
        expect(didRun).to.be.true;
        gently.verify();
      });
    });
  });
  describe('#restore', function() {
    it('should hide full path to nuget.exe', function() {
      var ctx = new Context();
      nuget.restorePackages(ctx, {}, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;        
        expect(ctx.runCmd.screen).to.be.equal('nuget restore');
        expect(ctx.runCmd.command).to.be.equal(path.join(ctx.baseDir, 'nuget', 'nuget.exe'));
        expect(ctx.runCmd.args).to.deep.equal(['restore', '-NonInteractive']);
      });
    });
    it('should return error when restore method is Project and no project specified', function() {
      nuget.restorePackages(new Context(), { restoreMethod: 'Project', projectFile: '' }, function(err, didRun) {
        expect(err).to.be.ok;
        expect(err).to.equal(1);
        expect(didRun).to.be.false;
      });
    });
    it('should add Project to command when restore method is Project', function() {
      var ctx = new Context();
      nuget.restorePackages(ctx, { restoreMethod: 'Project', projectFile: 'Test.proj' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;        
        expect(ctx.runCmd.screen).to.equal('nuget restore Test.proj');
        expect(ctx.runCmd.args).to.deep.equal(['restore', 'Test.proj', '-NonInteractive']);
      });
    });
    it('should return error when restore method is Custom and no file specified', function() {
      nuget.restorePackages(new Context(), { restoreMethod: 'Custom', customRestoreFile: '' }, function(err, didRun) {
        expect(err).to.be.ok;
        expect(err).to.equal(1);
        expect(didRun).to.be.false;
      });
    });
    it('should add Custom File to command when restore method is Custom', function() {
      var ctx = new Context();
      nuget.restorePackages(ctx, { restoreMethod: 'Custom', customRestoreFile: 'Custom' }, function(err, didRun) {
        expect(err).to.not.be.ok; 
        expect(didRun).to.be.true;       
        expect(ctx.runCmd.screen).to.equal('nuget restore Custom');
        expect(ctx.runCmd.args).to.deep.equal(['restore', 'Custom', '-NonInteractive']);
      });
    });
    it('should not add custom package source when value is empty array', function() {
      var ctx = new Context();
      nuget.restorePackages(ctx, { packageSources: [] }, function(err, didRun) {
        expect(err).to.not.be.ok; 
        expect(didRun).to.be.true;       
        expect(ctx.runCmd.screen).to.equal('nuget restore');
        expect(ctx.runCmd.args).to.deep.equal(['restore', '-NonInteractive']);
      });
    });
    it('should add single custom package source', function() {
      var ctx = new Context();
      nuget.restorePackages(ctx, { packageSources: [ 'customSource' ] }, function(err, didRun) {
        expect(err).to.not.be.ok; 
        expect(didRun).to.be.true;       
        expect(ctx.runCmd.screen).to.equal('nuget restore -source "customSource"');
        expect(ctx.runCmd.args).to.deep.equal(['restore', '-source', 'customSource', '-NonInteractive']);
      });
    });
    it('should add multiple custom package sources', function() {
      var ctx = new Context();
      nuget.restorePackages(ctx, { packageSources: [ 'customSource1', 'foo', 'bar' ] }, function(err, didRun) {
        expect(err).to.not.be.ok; 
        expect(didRun).to.be.true;       
        expect(ctx.runCmd.screen).to.equal('nuget restore -source "customSource1;foo;bar"');
        expect(ctx.runCmd.args).to.deep.equal(['restore', '-source', 'customSource1;foo;bar', '-NonInteractive']);
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