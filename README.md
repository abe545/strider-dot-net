strider-dot-net
===============

[![NPM][npm-badge-img]][npm-badge-link]
[![Dependency Status][david-badge-img]][david-badge-link]

##.NET build actions for strider.

Calls `msbuild` on a project or solution file. If none is specified in configuration, `msbuild` will attempt to build a file ending in "proj". If none (or more than one) exists in the root directory, the build will fail.

There is configuration in the plugin to select the version of `msbuild` to use to build the project. Prior to Visual Studio 2013, `msbuild` was bundled with certain versions of .NET. Going forward, [Microsoft says that it will be bundled with Visual Studio](http://blogs.msdn.com/b/visualstudio/archive/2013/07/24/msbuild-is-now-part-of-visual-studio.aspx). It also supports just using the `msbuild` that is already in the path. The build will fail if the selected version of .NET is not installed on the build agent.

You can specify a CPU architecure (Any CPU, x86, x64, ARM), and one or more targets to execute (most of the time this is Build or Rebuild).

You can pass as many custom parameters to `msbuild` as you need to.

### NuGet packages
It will get the latest version of nuget.exe from [nuget.org](http://nuget.org) in order to restore nuget packages. This means that your solution doesn't need NuGet Package Restore, but if it does, disable this feature of the plugin for your project. You can also specify custom package sources to pull from, in case you use a private nuget feed (or want to consume packages from a network share drive).

### Colorized output
Since there is no way to force `msbuild` to colorize its output, I've written an [msbuild logger for strider](https://github.com/abe545/strider-msbuild-logger). This is included in this project as an optional dependency. That way, if your strider instance can't build this file for some strange reason, `strider-dot-net will` fallback to black and white output.

You can follow its progress at [gettinggui.com](http://gettinggui.com)

[npm-badge-img]: https://nodei.co/npm/strider-dot-net.png
[npm-badge-link]: https://nodei.co/npm/strider-dot-net/
[david-badge-img]: https://david-dm.org/abe545/strider-dot-net.svg
[david-badge-link]: https://david-dm.org/abe545/strider-dot-net/
