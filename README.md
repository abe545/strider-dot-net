strider-dot-net
===============

.NET build actions for strider.

Currently can simply call msbuild on a project or solution file. 

There is configuration in the plugin to select the version of .NET to use to build the project. It also supports just using the msbuild that is already in the path.

You can specify a CPU architecure, and one or more targets to execute (most of the time this is Build or Rebuild).

You can pass as many custom parameters to msbuild as you need to.

You can follow its progress at http://gettinggui.com

