strider-dot-net
===============

[![NPM][npm-badge-img]][npm-badge-link]

.NET build actions for strider.

Calls msbuild on a project or solution file. If none is specified, msbuild will attempt to build a file ending in "proj". If none exists in the root directory, the build will fail.

There is configuration in the plugin to select the version of .NET to use to build the project. It also supports just using the msbuild that is already in the path. The build will fail if the selected version of .NET is not installed on the build agent.

You can specify a CPU architecure (Any CPU, x86, x64, ARM), and one or more targets to execute (most of the time this is Build or Rebuild).

You can pass as many custom parameters to msbuild as you need to.

It will restore NuGet packages. It will get the latest version of nuget.exe from http://nuget.org in order to do so. This means that your solution doesn't need NuGet Package Restore, but if it does, disable this feature of the plugin for your project. You can also specify custom package sources to pull from, in case you use a private nuget feed (or want to consume packages from a network share drive).

You can follow its progress at http://gettinggui.com

[npm-badge-img]: https://nodei.co/npm/strider-dot-net.svg
[npm-badge-link]: https://nodei.co/npm/strider-dot-net/
