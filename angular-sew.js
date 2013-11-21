var sew = angular.module('angular-sew', []);

sew.service('sew_input', function () {
  return {
    userlist: [
      'alpha',
      'bravo',
      'charlie'
    ]
  };
});

sew.directive('typeahead', function () {
  return {
    restrict: 'A',
    scope: {
      typeahead: '@',
    },
    controller: function ($scope, sew_input, $parse) {
      var customItemTemplate = "<div><span />&nbsp;<small /></div>";

      var values = sew_input[$scope.typeahead];

      console.log('values', values);

      var MENU_TEMPLATE = "<div class='-sew-list-container' style='display: none; position: absolute;'><ul class='-sew-list'></ul></div>";
      var ITEM_TEMPLATE = '<li class="-sew-list-item"></li>';
      var KEYS = [
        40, // (
        38, // &
        13, // \r
        27, // ESC
        9 // Tab
      ];

      function elementFactory(element, e) {
        var template = angular.element(customItemTemplate);
        template.find('span');
        template.text('@' + e.val).end();
        template.find('small');
        template.text("(" + (e.meta || e.val) + ")").end();
        element.append(template);
      };

        // here is how we use it
        $('textarea').sew({values: values, elementFactory: elementFactory});

//      console.log('controller');
      //console.log($scope[$scope.typeahead]);
    },
    link: function ($scope, $element, $attrs) {
//      console.log('Link');
//      console.log($scope[$scope.typeahead]);
    }
  };
});
