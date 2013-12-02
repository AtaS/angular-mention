var sew = angular.module('angular-sew', []);

var TOKEN = '@';
var REGEX = new RegExp('(^|\\b|\\s)' + TOKEN + '([\\w.]*)$');


var KEYS = [
  40, // down arrow
  38, // up arrow
  13, // \r
  27, // ESC
  9 // Tab
];


sew.service('sew_input', function () {
  return {
    userlist: [
      {name: 'AAA Alpha Smith', nickname: 'Alpha'},
      {name: 'BBB Bravo Smith', nickname: 'Beta'},
      {name: 'CCC Charlie Smith', nickname: 'Gamma'}
    ]
  };
});

sew.directive('typeahead', function () {
  return {
    restrict: 'A',
    replace: true,
    transclude: true,
    template: "<div><div class='-sew-list-container' style='display: none; position: absolute;'><ul class='-sew-list'><li ng-repeat='v in values | filter:mention' ng-click='choose(\"{{v.nickname}}\")' class='-sew-list-item'><div><span>@{{v.nickname}}</span>&nbsp;<small>({{v.name}})</small></div></li></ul></div><div ng-transclude></div></div>",
    scope: {
      typeahead: '@'
    },
    controller: function ($scope, sew_input, $parse) {
      $scope.options = {};

      $scope.focusIndex = false;
      $scope.listVisible = false;

      $scope.values = sew_input[$scope.typeahead];
      $scope.options.values = $scope.values;

      $scope.matched = false;
      $scope.dontFilter = false;
      $scope.lastFilter = undefined;

      $scope.choose = function (selection) {
        //alert(selection);
        console.log('textElement', $scope.textElement);
        var before = $scope.textElement.value.slice(0, $scope.cursorPos - $scope.find.length);
        var replace = $scope.textElement.value.slice($scope.cursorPos - $scope.find.length, $scope.cursorPos);
        var after = $scope.textElement.value.slice($scope.cursorPos);

        //console.log(before + '|' + replace + '|' + after);

        $scope.textElement.value = before + '@' + selection + ' ' + after;
        $scope.hideList();

        //console.log('textElement contents', $scope.textElement.value);
        //$scope.textElement.value.replace()
      };


      $scope.reset = function () {
        $scope.options.values = $scope.getUniqueElements($scope.options.values);

        $scope.focusIndex = false;
        $scope.index = 0;
        $scope.listVisible = false;
        $scope.matched = false;
        $scope.dontFilter = false;
        $scope.lastFilter = undefined;
        $scope.filtered = $scope.options.values.slice(0);
      };

      $scope.tab = function () {

      };

      $scope.enter = function () {
        var ul = angular.element($scope.element).find('ul')[0];
        var lis = angular.element(ul).find('li');

        var index = $scope.focusIndex;

        console.log(angular.element(lis[index]));
        //angular.element(lis[index])[0].onclick();
      };

      $scope.escape = function () {
        if (!$scope.listVisible) {
          return;
        }

        $scope.hideList();
      };

      $scope.upArrow = function () {
        if (!$scope.listVisible) {
          return;
        }
        var ul = angular.element($scope.element).find('ul')[0];
        var lis = angular.element(ul).find('li');

        console.log('UP ARROW');
        if ($scope.focusIndex === false) {
           $scope.focusIndex = 0;
        }

        $scope.focusIndex = ($scope.focusIndex + lis.length - 1) % lis.length;

        // $scope.focusIndex--;

        console.log('focusIndex', $scope.focusIndex);
        console.log('_element', angular.element($scope.element).find('ul')[0]);
        console.log('lis', lis);
        // angular.forEach(lis, function (li) {
        //   console.log();
        //   // angular.element(li).removeClass('selected');
        // });

        // var index = Math.abs($scope.focusIndex % lis.length);

        var index = $scope.focusIndex;
        lis.removeClass('selected');
        console.log('focusIndex', $scope.focusIndex);
        console.log('length', lis.length);
        console.log('mod', index);
        angular.element(lis[index]).addClass('selected');

        // angular.element(lis[$scope.focusIndex])[0].addClass('selected');
      };

      $scope.downArrow = function () {
        if (!$scope.listVisible) {
          return;
        }
        var ul = angular.element($scope.element).find('ul')[0];
        var lis = angular.element(ul).find('li');

        console.log('DOWN ARROW');
        if ($scope.focusIndex === false) {
           $scope.focusIndex = -1;
        }

        $scope.focusIndex = ($scope.focusIndex + 1) % lis.length;

        // if ($scope.focusIndex === false) {
        //   $scope.focusIndex = -1;
        // }
        // $scope.focusIndex++;



        // var index = Math.abs($scope.focusIndex % lis.length);
        var index = $scope.focusIndex;
        lis.removeClass('selected');
        console.log('focusIndex', $scope.focusIndex);
        console.log('length', lis.length);
        console.log('mod', index);
        angular.element(lis[index]).addClass('selected');
      };

      //http://unixpapa.com/js/key.html
      //http://stackoverflow.com/questions/17388021/navigate-the-ui-using-only-keyboard
      //http://plnkr.co/edit/XRGPYCk6auOxmylMe0Uu?p=preview
      $scope.keys = [];
      //$scope.keys.push({ code: 13, action: function() { $scope.open( $scope.focusIndex ); }});


      $scope.keys.push({ code: 9, action: $scope.tab });
      $scope.keys.push({ code: 13, action: $scope.enter });
      $scope.keys.push({ code: 27, action: $scope.escape });
      $scope.keys.push({ code: 38, action: $scope.upArrow });
      $scope.keys.push({ code: 40, action: $scope.downArrow });
      
      $scope.$on('keydown', function( vent, code ) {
        //console.log('event', vent);
        //console.log('keycode', code);

        $scope.keys.forEach(function(o) {
          if ( o.code !== code ) { return; }
          o.action();
          $scope.$apply();
        });
      });
/*
      $scope.$on('keydown', function (a,b) {
        console.log('a', a);
        console.log('b', b);
      });
*/
      $scope.getUniqueElements = function (elements) {
        var target = [];

        angular.forEach(elements, function (e) {
          var hasElement = target.map(function (j) { return j.val; }).indexOf(e.val) >= 0;
          if (hasElement) {
            return;
          }
          target.push(e);
        });

        return target;
      }

    },
    link: function ($scope, $element, $attrs) {
      //console.log("$element", $element);

      $element.bind('keydown', function( event ) {
        $scope.$broadcast('keydown', event.keyCode );
      });


      $scope.$itemList = angular.element($element[0].querySelector('.-sew-list-container'))[0];

      var nextSibling = $element[0].children[1].children[0];
      $scope.textElement = nextSibling;

      $scope.$$nextSibling.$watch('input', function (newVal, oldVal) {
        if (typeof newVal != 'undefined') {
          //console.log('$element', );
          console.log('newVal: ', newVal, '|', 'oldVal: ', oldVal);
          //console.log('Cursor Position:', getCursorPos($scope.element));
          //console.log('Element: ', $scope.element);
          var cursorPos = getCursorPos(nextSibling).start;

          var text = newVal.substring(0, cursorPos);
          var matches = text.match(REGEX);

          if(!matches && $scope.matched) {
            $scope.matched = false;
            $scope.dontFilter = false;
            $scope.hideList();
            return;
          }

          if(matches && !$scope.matched) {
            $scope.displayList();
            $scope.lastFilter = "\n";
            $scope.matched = true;
          }

          if(matches && !$scope.dontFilter) {
            // Filter List
            $scope.mention = matches[2];
            $scope.find = '@' + matches[2]
            $scope.cursorPos = cursorPos;
            console.log('find', $scope.find);
            console.log('curPos', $scope.cursorPos);
          }
        }
      }, true);

      $scope.element = $element[0];
      console.log('$element', $element[0]);

      //console.log('$$nextSibling', $scope.$$nextSibling);

      //$scope.$$nextSibling.input = '';

      $scope.hideList = function () {
        console.log('Hide List.');
        $scope.$itemList.style.display = 'none';
        $scope.reset();
      };

      $scope.displayList = function () {
        console.log('Display List.');
        
        $scope.listVisible = true;

        $scope.$itemList.style.display = 'block';
        var offset = $scope.element.getBoundingClientRect();
        //var pos = getCursorPos($scope.element);
        //console.log('pos', pos);

        console.log('left: ', offset.left);//, '+', pos.left);
        console.log('top: ', offset.top);//, '+', pos.top);
        console.log('bottom: ', offset.bottom);//, '+', pos.top);

        $scope.$itemList.style.left = offset.left + 'px';// + pos.left;
        $scope.$itemList.style.top = offset.bottom + 'px';// + pos.top;

      };

//       $scope.renderElements = function (values) {
//         angular.element("body").append($scope.$itemList);

//         var container = $scope.$itemList.find('ul').children().remove();
//         angular.forEach(values, function (e, i) {
//           var $item = angular.element(ITEM_TEMPLATE);

//           $scope.elementFactory($item, e);

// //        e.element = $item.appendTo(container).bind('click', $.proxy(this.onItemClick, this, e)).bind('mouseover', $.proxy(this.onItemHover, this, i));}, this));

// //        this.index = 0;
// //        this.hightlightItem();
//       };

      // $scope.filterList = function (val) {
      //   console.log('Filter List.');
      //   console.log('val', val);
      //   $scope.mention = val;
      // };

      $scope.reset();
//      console.log('Link');
//      console.log($scope[$scope.typeahead]);
    }
  };
});


function getCursorPos(input) {
  //input = input.find('textarea')
  console.log('input', input);
  //http://stackoverflow.com/questions/7745867/how-do-you-get-the-cursor-position-in-a-textarea
    if (input.hasOwnProperty('selectionStart') && document.activeElement == input) {
        return {
            start: input.selectionStart,
            end: input.selectionEnd
        };
    }
    else if (input.createTextRange) {
        var sel = document.selection.createRange();
        if (sel.parentElement() === input) {
            var rng = input.createTextRange();
            rng.moveToBookmark(sel.getBookmark());
            for (var len = 0;
                     rng.compareEndPoints("EndToStart", rng) > 0;
                     rng.moveEnd("character", -1)) {
                len++;
            }
            rng.setEndPoint("StartToStart", input.createTextRange());
            for (var pos = { start: 0, end: len };
                     rng.compareEndPoints("EndToStart", rng) > 0;
                     rng.moveEnd("character", -1)) {
                pos.start++;
                pos.end++;
            }
            return pos;
        }
    }
    return -1;
}