var expect = require('chai').expect
  , path = require('path')
  , expectRequire = require('a').expectRequire
  , fs = expectRequire('fs-extra').return(new Fs())
  , childProc = expectRequire('child_process').return(new ChildProc())
  , msbuild = require('../lib/msbuild');
    
describe('msbuild', function() {
  describe('#build', function() {
    it('should report error if msbuild spawn has error', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { return null; });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ ]);
        return {
          stdout: new Emitter(),
          stderr: new Emitter(),
          on: function(name, cb) {
            if (name == 'error') {
              cb({ code: 'ENOENT' });
            }
          }  
        };
      };
      
      msbuild.build(ctx, { msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.be.equal(404);
        expect(didRun).to.be.false;
        done();
      });
    });
    it('should report error if msbuild returns error', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { return null; });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ ]);
        return {
          stdout: new Emitter(),
          stderr: new Emitter(),
          on: function(name, cb) {
            if (name == 'error') {
              cb('some error');
            }
          }  
        };
      };
      
      msbuild.build(ctx, { msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.be.equal(404);
        expect(didRun).to.be.false;
        done();
      });
    });
    it('should use custom logger if it is available', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { return 'test-logger'; });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ '/noconsolelogger', '/logger:test-logger' ]);
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
      
      msbuild.build(ctx, { msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
    it('should not use custom logger if it returns null', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { return null; });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ ]);
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
      
      msbuild.build(ctx, { msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
    it('should not use custom logger if it is unavailable', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { throw new Error('test error'); });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ ]);
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
      
      msbuild.build(ctx, { msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
    it('should pass a project file if specified in configuration', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { return null; });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ 'foo.proj' ]);
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
      
      msbuild.build(ctx, { projectFile: 'foo.proj', msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
    it('should pass single custom target if specified in configuration', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { return null; });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ '/t:strider' ]);
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
      
      msbuild.build(ctx, { targets: [ 'strider' ], msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
    it('should pass multiple custom targets if specified in configuration', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { return null; });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ '/t:strider;test' ]);
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
      
      msbuild.build(ctx, { targets: [ 'strider', 'test' ], msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
    it('should not pass configuration flag when it is set to default', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { return null; });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ ]);
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
      
      msbuild.build(ctx, { configuration: 'Default', msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
    it('should pass configuration flag when it is not set to default', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { return null; });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ '/p:Configuration=test' ]);
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
      
      msbuild.build(ctx, { configuration: 'test', msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
    it('should pass customConfiguration flag when it is not set to default', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { return null; });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ '/p:Configuration=test' ]);
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
      
      msbuild.build(ctx, { customConfiguration: 'test', msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
    it('should not pass platform flag when it is set to default', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { return null; });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ ]);
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
      
      msbuild.build(ctx, { platform: 'Default', msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
    it('should pass platform flag when it is not set to default', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { return null; });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ '/p:Platform=test' ]);
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
      
      msbuild.build(ctx, { platform: 'test', msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
    it('should pass customPlatform flag when it is not set to default', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { return null; });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ '/p:Platform=test' ]);
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
      
      msbuild.build(ctx, { customPlatform: 'test', msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
    it('should pass single custom property', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { return null; });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ '/p:test=foo' ]);
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
      
      msbuild.build(ctx, { customProperties: [ { name: 'test', value: 'foo' } ], msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
    it('should pass multiple custom properties', function(done) {
      var ctx = new Context();
      expectRequire('strider-msbuild-logger').return(function() { return null; });
      ChildProc.prototype.spawn = function(msbuildPath, args) {
        expect(msbuildPath).to.be.equal('test.exe');
        expect(args).to.deep.equal([ '/p:test=foo', '/p:bar=baz' ]);
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
      
      msbuild.build(ctx, { customProperties: [ { name: 'test', value: 'foo' }, { name: 'bar', value: 'baz' } ], msbuildPath: 'test.exe' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.true;
        done();
      });
    });
  });
  describe('#ensurePathToExecutable', function() {
    it('should set config.msbuildPath to msbuild.exe when no version set', function(done) {
      var ctx = new Context();
      var config = { };
      msbuild.ensurePathToExecutable(ctx, config, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.not.be.ok;
        expect(config.msbuildPath).to.be.equal('msbuild.exe');
        done();
      });
    });
    it('should set config.msbuildPath to msbuild.exe when version set to whatever', function(done) {
      var ctx = new Context();
      var config = { msbuildVersion: 'Whatever' };
      msbuild.ensurePathToExecutable(ctx, config, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.not.be.ok;
        expect(config.msbuildPath).to.be.equal('msbuild.exe');
        done();
      });
    });
    it('should set config.msbuildPath to custom path that points to a file when version set to custom', function(done) {
      var ctx = new Context();
      var config = { msbuildVersion: 'Custom', customMsbuildPath: '/test/path' };
      
      Fs.prototype.stat = function(path, cb) {
        expect(path).to.be.equal('/test/path');
        cb(null, {
          isDirectory: function() { return false; },
          isFile: function() { return true; }
        });
      };
      
      msbuild.ensurePathToExecutable(ctx, config, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.not.be.ok;
        expect(config.msbuildPath).to.be.equal('/test/path');
        done();
      });
    });
    it('should return an error when version set to custom and no path specified', function(done) {
      var ctx = new Context();
      var config = { msbuildVersion: 'Custom' };
      
      msbuild.ensurePathToExecutable(ctx, config, function(err, didRun) {
        expect(err).to.be.equal(404);
        expect(didRun).to.not.be.ok;
        expect(config.msbuildPath).to.not.be.ok;
        done();
      });
    });
    it('should return an error when version set to custom and fs.stat returns an error', function(done) {
      var ctx = new Context();
      var config = { msbuildVersion: 'Custom', customMsbuildPath: '/test/path' };
      
      Fs.prototype.stat = function(path, cb) {
        expect(path).to.be.equal('/test/path');
        cb('test error', { });
      };
      
      msbuild.ensurePathToExecutable(ctx, config, function(err, didRun) {
        expect(err).to.be.equal(404);
        expect(didRun).to.not.be.ok;
        expect(config.msbuildPath).to.not.be.ok;
        done();
      });
    });
    it('should return an error when version set to custom and fs.stat returns a directory', function(done) {
      var ctx = new Context();
      var config = { msbuildVersion: 'Custom', customMsbuildPath: '/test/path' };
      
      Fs.prototype.stat = function(path, cb) {
        expect(path).to.be.equal('/test/path');
        cb(null, {
          isDirectory: function() { return true; }
        });
      };
      
      msbuild.ensurePathToExecutable(ctx, config, function(err, didRun) {
        expect(err).to.be.equal(404);
        expect(didRun).to.not.be.ok;
        expect(config.msbuildPath).to.not.be.ok;
        done();
      });
    });
    it('should return an error when version set to custom and fs.stat returns neither a file or a directory', function(done) {
      var ctx = new Context();
      var config = { msbuildVersion: 'Custom', customMsbuildPath: '/test/path' };
      
      Fs.prototype.stat = function(path, cb) {
        expect(path).to.be.equal('/test/path');
        cb(null, {
          isDirectory: function() { return false; },
          isFile: function() { return false; }
        });
      };
      
      msbuild.ensurePathToExecutable(ctx, config, function(err, didRun) {
        expect(err).to.be.equal(404);
        expect(didRun).to.not.be.ok;
        expect(config.msbuildPath).to.not.be.ok;
        done();
      });
    });
    it('should search the .net directory for versions where msbuild was deployed with the framework, and get it from Framework64 first', function(done) {
      var ctx = new Context();
      var config = { msbuildVersion: '2.0' };
      var root = path.join(process.env.windir, 'Microsoft.NET', 'Framework64');
      Fs.prototype.exists = function(path, cb) { cb(true); };
      Fs.prototype.readdir = function(path, cb) {
        expect(path).to.be.equal(root);
        cb(null, [ 'v2.0.3' ]);
      };
      
      msbuild.ensurePathToExecutable(ctx, config, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.not.be.ok;
        expect(config.msbuildPath).to.be.equal(path.join(root, 'v2.0.3', 'msbuild.exe'));
        done();
      });
    });
    it('should search the .net directory for versions where msbuild was deployed with the framework, and get it from Framework if it does not exist in the 64-bit directory', function(done) {
      var ctx = new Context();
      var config = { msbuildVersion: '4.0' };
      var root = path.join(process.env.windir, 'Microsoft.NET', 'Framework');
      var count = 0;
      Fs.prototype.exists = function(path, cb) { cb(true); };
      Fs.prototype.readdir = function(path, cb) {
        if (!count) {
          ++count;
          cb(null, []);
        } else {
          expect(path).to.be.equal(root);
          cb(null, [ 'v4.0.31' ]);
        }
      };
      
      msbuild.ensurePathToExecutable(ctx, config, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.not.be.ok;
        expect(config.msbuildPath).to.be.equal(path.join(root, 'v4.0.31', 'msbuild.exe'));
        done();
      });
    });
    it('should fail gracefully if no msbuild was found for framework deployed msbuild', function(done) {
      var ctx = new Context();
      var config = { msbuildVersion: '4.0' };
      Fs.prototype.exists = function(path, cb) { cb(false); };
      Fs.prototype.readdir = function(path, cb) {
        cb(null, [ 'v4.0' ]);
      };
      
      msbuild.ensurePathToExecutable(ctx, config, function(err, didRun) {
        expect(err).to.be.equal(404);
        expect(didRun).to.not.be.ok;
        expect(config.msbuildPath).to.not.be.ok;
        done();
      });
    });
    
    it('should search the Program Files(x86) for versions where msbuild was deployed with Visual Studio, and get it from Framework64 first', function(done) {
      var ctx = new Context();
      var config = { msbuildVersion: 'Visual Studio 2013' };
      var expectedPath = path.join(process.env['ProgramFiles(x86)'], 'MSBuild', '12.0', 'bin', 'amd64', 'msbuild.exe');
      Fs.prototype.exists = function(p, cb) {
        expect(p).to.be.equal(expectedPath);
        cb(true); 
      };
      
      msbuild.ensurePathToExecutable(ctx, config, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.not.be.ok;
        expect(config.msbuildPath).to.be.equal(expectedPath);
        done();
      });
    });
    it('should search Program Files for versions where msbuild was deployed with Visual Studio, and get it from Framework if it does not exist in the 64-bit directory', function(done) {
      var ctx = new Context();
      var config = { msbuildVersion: 'Visual Studio 2013' };
      var expectedPath = path.join(process.env.ProgramFiles, 'MSBuild', '12.0', 'bin', 'msbuild.exe');
      Fs.prototype.exists = function(p, cb) { cb(p === expectedPath); };
      
      msbuild.ensurePathToExecutable(ctx, config, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.not.be.ok;
        expect(config.msbuildPath).to.be.equal(expectedPath);
        done();
      });
    });
    it('should find x86 version of msbuild on 64-bit machines if only x86 msbuild is installed for versions deployed with Visual Studio', function(done) {
      var ctx = new Context();
      var config = { msbuildVersion: 'Visual Studio 2013' };
      var expectedPath = path.join(process.env['ProgramFiles(x86)'], 'MSBuild', '12.0', 'bin', 'msbuild.exe');
      Fs.prototype.exists = function(p, cb) { cb(p === expectedPath); };
      
      msbuild.ensurePathToExecutable(ctx, config, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.not.be.ok;
        expect(config.msbuildPath).to.be.equal(expectedPath);
        done();
      });
    });
    it('should fail gracefully if no msbuild was found for versions deployed with Visual Studio', function(done) {
      var ctx = new Context();
      var config = { msbuildVersion: 'Visual Studio 2013' };
      Fs.prototype.exists = function(path, cb) { cb(false); };
      
      msbuild.ensurePathToExecutable(ctx, config, function(err, didRun) {
        expect(err).to.be.equal(404);
        expect(didRun).to.not.be.ok;
        expect(config.msbuildPath).to.not.be.ok;
        done();
      });
    });
  });
});

function Context() {
  var self = this;
  this.dataDir = 'testDir';
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

function Fs() { }
function ChildProc() { }