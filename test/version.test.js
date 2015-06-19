var expect = require('chai').expect
  , expectRequire = require('a').expectRequire
  , fs = expectRequire('fs-extra').return(new Fs())
  , version = require('../lib/version');
  
describe('version', function() {
  describe('#patchFiles', function() {
    it('will recursively find AssemblyInfo.cs or AssemblyInfo.vb if nothing is specified', function(done) {
      expectRequire('glob').return(function(file, opt, cb) {
        expect(['**/AssemblyInfo.cs', '**/AssemblyInfo.vb']).to.include(file);
        cb(null, [ 'test.' + file.substring(file.length - 2) ]);
      });
      Fs.prototype.readFile = function(file, cb) {
        expect(file).to.contain('test.');
        cb(null, 'empty file');
      };
      Fs.prototype.writeFile = function(file, content, cb) {
        expect(file).to.contain('test.');
        expect(content).to.be.equal('empty file');
        cb();
      };
      version.patchFiles(new Context(), { }, function(err, didRun) {
        expect(err).to.be.not.be.ok;
        expect(didRun).to.be.ok;
        done();
      });
    });
    it('will recursively find AssemblyInfo.cs or AssemblyInfo.vb if a blank array is specified', function(done) {
      expectRequire('glob').return(function(file, opt, cb) {
        expect(['**/AssemblyInfo.cs', '**/AssemblyInfo.vb']).to.include(file);
        cb(null, [ 'test.' + file.substring(file.length - 2) ]);
      });
      Fs.prototype.readFile = function(file, cb) {
        expect(file).to.contain('test.');
        cb(null, 'empty file');
      };
      Fs.prototype.writeFile = function(file, content, cb) {
        expect(file).to.contain('test.');
        expect(content).to.be.equal('empty file');
        cb();
      };
      version.patchFiles(new Context(), { assemblyVersionFiles: [ ] }, function(err, didRun) {
        expect(err).to.be.not.be.ok;
        expect(didRun).to.be.ok;
        done();
      });
    });
    it('will pass specified assembly search paths to glob', function(done) {
      expectRequire('glob').return(function(file, opt, cb) {
        expect(file).to.be.equal('test path');
        cb(null, [ 'test.ing' ]);
      });
      Fs.prototype.readFile = function(file, cb) {
        expect(file).to.equal('test.ing');
        cb(null, 'empty file');
      };
      Fs.prototype.writeFile = function(file, content, cb) {
        expect(file).to.equal('test.ing');
        expect(content).to.be.equal('empty file');
        cb();
      };
      version.patchFiles(new Context(), { assemblyVersionFiles: [ 'test path' ] }, function(err, didRun) {
        expect(err).to.be.not.be.ok;
        expect(didRun).to.be.ok;
        done();
      });
    });
    it('will handle glob errors gracefully', function(done) {
      expectRequire('glob').return(function(file, opt, cb) {
        cb('test error');
      });
      version.patchFiles(new Context(), { }, function(err, didRun) {
        expect(err).to.be.equal('test error');
        expect(didRun).to.not.be.ok;
        done();
      });
    });
    it('will do nothing if no files found to patch', function(done) {
      expectRequire('glob').return(function(file, opt, cb) {
        cb(null, [ ]);
      });
      version.patchFiles(new Context(), { }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.not.be.ok;
        done();
      });
    });
    it('will not crash if glob returns null', function(done) {
      expectRequire('glob').return(function(file, opt, cb) {
        cb();
      });
      version.patchFiles(new Context(), { }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.not.be.ok;
        done();
      });
    });
    it('will gracefully handle file read errors', function(done) {
      expectRequire('glob').return(function(file, opt, cb) {
        expect(file).to.be.equal('test path');
        cb(null, [ 'test.ing' ]);
      });
      Fs.prototype.readFile = function(file, cb) {
        expect(file).to.equal('test.ing');
        cb('test error');
      };
      version.patchFiles(new Context(), { assemblyVersionFiles: [ 'test path' ] }, function(err, didRun) {
        expect(err).to.be.equal('test error');
        expect(didRun).to.not.be.ok;
        done();
      });
    });
    it('will gracefully handle file write errors', function(done) {
      expectRequire('glob').return(function(file, opt, cb) {
        expect(file).to.be.equal('test path');
        cb(null, [ 'test.ing' ]);
      });
      Fs.prototype.readFile = function(file, cb) {
        expect(file).to.equal('test.ing');
        cb(null, 'test file');
      };
      Fs.prototype.writeFile = function(file, content, cb) {
        expect(file).to.equal('test.ing');
        expect(content).to.be.equal('test file');
        cb('test error');
      };
      version.patchFiles(new Context(), { assemblyVersionFiles: [ 'test path' ] }, function(err, didRun) {
        expect(err).to.be.equal('test error');
        expect(didRun).to.not.be.ok;
        done();
      });
    });
    it('will set AssemblyVersion for a c# file without assembly prefix', function(done) {
      expectRequire('glob').return(function(file, opt, cb) {
        cb(null, [ 'ai.cs' ]);
      });
      Fs.prototype.readFile = function(file, cb) {
        cb(null, '[AssemblyVersion("0.0.0.0")]');
      };
      Fs.prototype.writeFile = function(file, content, cb) {
        expect(content).to.be.equal('[AssemblyVersion("1.2.3.4")]');
        cb(null);
      };
      version.patchFiles(new Context(), { assemblyVersion: '1.2.3.4' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.ok;
        done();
      });
    });
    it('will set AssemblyVersionAttribute for a c# file with assembly prefix', function(done) {
      expectRequire('glob').return(function(file, opt, cb) {
        cb(null, [ 'ai.cs' ]);
      });
      Fs.prototype.readFile = function(file, cb) {
        cb(null, '[assembly:AssemblyVersionAttribute("0.0.0.0")]');
      };
      Fs.prototype.writeFile = function(file, content, cb) {
        expect(content).to.be.equal('[assembly:AssemblyVersionAttribute("1.2.3.4")]');
        cb(null);
      };
      version.patchFiles(new Context(), { assemblyVersion: '1.2.3.4' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.ok;
        done();
      });
    });
    it('will set AssemblyVersionAttribute for a VB file without assembly prefix', function(done) {
      expectRequire('glob').return(function(file, opt, cb) {
        cb(null, [ 'ai.vb' ]);
      });
      Fs.prototype.readFile = function(file, cb) {
        cb(null, '<AssemblyVersionAttribute("2.2.2.2")>');
      };
      Fs.prototype.writeFile = function(file, content, cb) {
        expect(content).to.be.equal('<AssemblyVersionAttribute("1.2.3.4")>');
        cb(null);
      };
      version.patchFiles(new Context(), { assemblyVersion: '1.2.3.4' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.ok;
        done();
      });
    });
    it('will set AssemblyVersion for a VB file with assembly prefix', function(done) {
      expectRequire('glob').return(function(file, opt, cb) {
        cb(null, [ 'ai.vb' ]);
      });
      Fs.prototype.readFile = function(file, cb) {
        cb(null, '<Assembly:AssemblyVersion("2.2.2.2")>');
      };
      Fs.prototype.writeFile = function(file, content, cb) {
        expect(content).to.be.equal('<Assembly:AssemblyVersion("1.2.3.4")>');
        cb(null);
      };
      version.patchFiles(new Context(), { assemblyVersion: '1.2.3.4' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.ok;
        done();
      });
    });
    it('will set AssemblyFileVersion for a c# file', function(done) {
      expectRequire('glob').return(function(file, opt, cb) {
        cb(null, [ 'ai.cs' ]);
      });
      Fs.prototype.readFile = function(file, cb) {
        cb(null, '[assembly: AssemblyFileVersion("")]');
      };
      Fs.prototype.writeFile = function(file, content, cb) {
        expect(content).to.be.equal('[assembly: AssemblyFileVersion("1.2.3.4")]');
        cb(null);
      };
      version.patchFiles(new Context(), { assemblyFileVersion: '1.2.3.4' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.ok;
        done();
      });
    });
    it('will set AssemblyInformationalVersion for a c# file', function(done) {
      expectRequire('glob').return(function(file, opt, cb) {
        cb(null, [ 'ai.cs' ]);
      });
      Fs.prototype.readFile = function(file, cb) {
        cb(null, '[assembly: AssemblyInformationalVersion("foo bar")]');
      };
      Fs.prototype.writeFile = function(file, content, cb) {
        expect(content).to.be.equal('[assembly: AssemblyInformationalVersion("baz")]');
        cb(null);
      };
      version.patchFiles(new Context(), { assemblyInformationalVersion: 'baz' }, function(err, didRun) {
        expect(err).to.not.be.ok;
        expect(didRun).to.be.ok;
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
function Fs() { }