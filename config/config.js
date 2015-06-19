
app.controller('DotNetController', ['$scope', function ($scope) {
  $scope.$watch('configs[branch.name].dotnet.config', function (value) {
    $scope.config = value;
  });
  $scope.saving = false;
  $scope.save = function () {
    $scope.saving = true;
    $scope.pluginConfig('dotnet', $scope.config, function () {
      $scope.saving = false;
    });
  };
  $scope.removeTarget = function (index) {
    $scope.config.targets.splice(index, 1);
    $scope.save();
  };
  $scope.addTarget = function () {
    if (!$scope.config.targets) $scope.config.targets = [];
    $scope.config.targets.push($scope.new_target);
    $scope.new_target = '';
    $scope.save();
  };
  $scope.removeCustomProperty = function (index) {
    $scope.config.customProperties.splice(index, 1);
    $scope.save();
  };
  $scope.addCustomProperty = function () {
    if (!$scope.config.customProperties) $scope.config.customProperties = [];
    $scope.config.customProperties.push({ name: $scope.new_property_name, value: $scope.new_property_value });
    $scope.new_property_name = '';
    $scope.new_property_value = '';
    $scope.save();
  };
  $scope.removePackageSource = function(index) {
    $scope.config.packageSources.splice(index, 1);
    $scope.save();
  };
  $scope.addPackageSource = function() {
    if (!$scope.config.packageSources) $scope.config.packageSources = [];
    $scope.config.packageSources.push($scope.new_package_source);
    $scope.new_package_source = '';
    $scope.save();
  };
  $scope.removeAssemblyVersionFile = function(index) {
    $scope.config.assemblyVersionFiles.splice(index, 1);
    $scope.save(); 
  };
  $scope.addAssemblyVersionFile = function() {
    if (!$scope.config.assemblyVersionFiles) $scope.config.assemblyVersionFiles = [];
    $scope.config.assemblyVersionFiles.push($scope.new_assembly_version_file);
    $scope.new_assembly_version_file = '';
    $scope.save();
  };
}]);