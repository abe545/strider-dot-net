
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
}]);