
module.exports = {
  // an object that defines the schema for configuration
  config: {
    restorePackages:     { type: Boolean, default: true },
    restoreMethod:       { type: String, default: 'Whatever', enum: ['Whatever', 'Project', 'Custom'] },
    customRestoreFile:   { type: String, default: '' },
    projectFile:         { type: String, default: '' },
    netVersion:          { type: String, default: 'Whatever', enum: ['1.0', '1.1', '2.0', '3.0', '3.5', '4.0', 'Whatever'] },
    platform:            { type: String, default: 'Default', enum: ['Default', 'Any CPU', 'x86', 'x64', 'ARM', 'Custom'] },
    customPlatform:      { type: String, default: '' },
    configuration:       { type: String, default: 'Default', enum: ['Default', 'Debug', 'Release', 'Custom'] },
    customConfiguration: { type: String, default: '' },
    targets:            [{ type: String }],
    customProperties:   [{ name:  String,
                           value: String
                         }]
  }
}
