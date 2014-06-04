
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
}]);