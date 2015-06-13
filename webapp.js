
module.exports = {
  // an object that defines the schema for configuration
  config: {
    restorePackages:     { type: Boolean, default: true },
    restoreMethod:       { type: String, default: 'Whatever', enum: ['Whatever', 'Project', 'Custom'] },
    customRestoreFile:   { type: String, default: '' },
    packageSources:     [{ type: String }],
    projectFile:         { type: String, default: '' },
    msbuildVersion:      { type: String, default: 'Whatever', enum: ['2.0', '3.5', '4.0', 'Visual Studio 2013', 'Whatever', 'Custom'] },
    customMsbuildPath:   { type: String, default: '' },
    platform:            { type: String, default: 'Default', enum: ['Default', 'Any CPU', 'x86', 'x64', 'ARM', 'Custom'] },
    customPlatform:      { type: String, default: '' },
    configuration:       { type: String, default: 'Default', enum: ['Default', 'Debug', 'Release', 'Custom'] },
    customConfiguration: { type: String, default: '' },
    targets:            [{ type: String }],
    customProperties:   [{ name:  String,
                           value: String
                         }],
    patchAssemblyVersions:        { type: Boolean, default: false },
    assemblyVersion:              { type: String, default: '' },
    assemblyFileVersion:          { type: String, default: '' },
    assemblyInformationalVersion: { type: String, default: '' },
    assemblyVersionFiles:        [{ name: String, recursive: Boolean }] 
  }
}
