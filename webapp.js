
module.exports = {
  // an object that defines the schema for configuration
  config: {
    projectFile: { type: String, default: '' },
    netVersion:  { type: String, default: 'whatever', enum: ['1.0', '1.1', '2.0', '3.0', '3.5', '4.0', 'whatever'] },
    platform:       { type: String, default: 'Any CPU', enum: ['Default', 'Any CPU', 'x86', 'x64', 'ARM', 'custom'] },
    customPlatform: { type: String, default: '' },
    targets:    [{ type: String }]
  }
}
