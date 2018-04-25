var splitskies = angular.module('myApp', ['ngRoute', 'mobile-angular-ui']);

// splitskies.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
//     $routeProvider
//         .when('/', {
//             templateUrl: 'index.html',
//             controller: 'testController'
//         })
// }]);

var r;
var previewImage;
var img_height, img_width;
var takeImage;


splitskies.controller("testController", function($scope, $http) {
    $scope.receipt_img = "";
    $scope.lineItems = [];
    $scope.img_width = 0;
    $scope.img_height = 0;

    takeImage = function() {
        alert("Uhhh ....");
        document.getElementById("cameraButton").click();
        alert("hmmmm....");
    };
    previewImage = function(elem) {
        var reader = new FileReader();
        reader.readAsDataURL(elem.files[0]);
        reader.onloadend = function(e) {
            $scope.receipt_img = reader.result;
            $scope.$apply();
            var img = new Image();
            img.onload = function() {
                $scope.img_width = img.width;
                $scope.img_height = img.height;
            };
            img.src = reader.result;
        };
    };


    $scope.uploadFile = function() {
        $http.post("/analyze", { "img": $scope.receipt_img, "width": $scope.img_width, "height": $scope.img_height })
            .then(function(response) {
                r = response.data;
                $scope.lineItems = response.data;
            }, function(err) {
                console.log(err);
            })
    }
});
