function getCursorPos (input) {
  //http://stackoverflow.com/questions/7745867/how-do-you-get-the-cursor-position-in-a-textarea
  if ( ('selectionStart' in input) && document.activeElement === input) {
    return {
      start: input.selectionStart,
      end: input.selectionEnd
    };
  } else if (input.createTextRange) {
    var sel = document.selection.createRange();
    if (sel.parentElement() === input) {
      var rng = input.createTextRange();
      rng.moveToBookmark(sel.getBookmark());
      for (var len = 0; rng.compareEndPoints('EndToStart', rng) > 0; rng.moveEnd('character', -1)) {
        len++;
      }
      rng.setEndPoint('StartToStart', input.createTextRange());
      for (var pos = { start: 0, end: len }; rng.compareEndPoints('EndToStart', rng) > 0; rng.moveEnd('character', -1)) {
        pos.start++;
        pos.end++;
      }
      return pos;
    }
  }
  return -1;
}


function setSelectionRange(input, selectionStart, selectionEnd) {
  //http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
  if (input.setSelectionRange) {
    input.focus();
    input.setSelectionRange(selectionStart, selectionEnd);
  } else if (input.createTextRange) {
    var range = input.createTextRange();
    range.collapse(true);
    range.moveEnd('character', selectionEnd);
    range.moveStart('character', selectionStart);
    range.select();
  }
}

function setCaretToPos (input, pos) {
  //http://stackoverflow.com/questions/499126/jquery-set-cursor-position-in-text-area
  setSelectionRange(input, pos, pos);
}

// http://davidwalsh.name/detect-scrollbar-width
function scrollMeasure() {
    // Create the measurement node
    var scrollDiv = document.createElement('div');
    //scrollDiv.className = 'scrollbar-measure';
    scrollDiv.style.width = '100px';
    scrollDiv.style.height = '100px';
    scrollDiv.style.overflow = 'scroll';
    scrollDiv.style.position = 'absolute';
    scrollDiv.style.top = '-9999px';
    document.body.appendChild(scrollDiv);
    // Get the scrollbar width
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    // Delete the DIV
    document.body.removeChild(scrollDiv);
    return scrollbarWidth;
}

function wordWrap(oContext, text, maxWidth) {
    var textLines = text.split('\n');
    var mockText = [];

    var padText = function (str) {
      return str + ' ';
    };

    //http://stackoverflow.com/a/9847580/
    var isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
    var isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6

    var measure = function (str) {
      // Firefox (and I think IE) seems to believe it can fit more characters
      // on the canvas than it can in the textarea. So, we add one space, when
      // measuring if the text will fit.
      if (isFirefox || isIE) {
        str = padText(str);
      }
      return oContext.measureText(str).width;
    };

    textLines.forEach(function(line, i) {
        while (measure(line) > maxWidth) {
          var fragLine = line;
          while (measure(fragLine) > maxWidth) {
            var stop = (fragLine.indexOf(' ') !== -1) ? fragLine.lastIndexOf(' ') : fragLine.length - 1;
            fragLine = fragLine.substring(0, stop);
          }
          mockText.push(padText(fragLine));
          line = line.slice(fragLine.length);
        }
        mockText.push(padText(line));
    });

    return mockText;
}


var at_mention = angular.module('angular-mention', []);

var TOKEN = '@';

at_mention.service('mention_input', function () {
  return {
    userlist: [
      {name: 'AAA Alpha Smith 235', nickname: 'Alpha', nid: 1007},
      {name: 'BBB Bravo Smith 245', nickname: 'Beta', nid: 1008},
      {name: 'CCC Charlie Smith 246', nickname: 'Gamma', nid: 1009},
      {name: 'DDD Delta Smith 346', nickname: 'Delta', nid: 1010},
      {name: 'EEE Echo Smith 356', nickname: 'Echo', nid: 1011}
    ]
  };
});

var CSS_CONSTANTS = {
  container: '-mention-list-container',
  list: '-mention-list',
  listItem: '-mention-list-item',
  selected: '-mention-selected'
};

var LIST_DATA = {
  token: 'nickname',
  longform: 'name',
  id: 'nid'
};

// var LIST_DATA = {
//   token: 'field_email',
//   longform: 'node_title',
//   id: 'nid'
// };


var LIST_ITEM_TEMPLATE = '<div><span>@{{v.' + LIST_DATA.token + '}}</span>&nbsp;<small>({{v.' + LIST_DATA.longform + '}})</small></div>';

var LIST_TEMPLATE = '<div><canvas style="display: none;"></canvas><div class="' + CSS_CONSTANTS.container + '" style="display: none; position: absolute;"><ul class="' + CSS_CONSTANTS.list + '"><li ng-repeat="v in values | filter:mention" ng-click="choose(v)" ng-Mouseover="onhover($event)" class="' + CSS_CONSTANTS.listItem + '">' + LIST_ITEM_TEMPLATE + '</li></ul></div><div ng-transclude></div></div>';

at_mention.directive('atMention', function () {
  return {
    restrict: 'A',
    replace: true,
    transclude: true,
    template: LIST_TEMPLATE,//'<div><div class="-mention-list-container" style="display: none; position: absolute;"><ul class="-mention-list"><li ng-repeat="v in values | filter:mention track by v.nid" token="{{v.nickname}}" ng-click="choose(v)" ng-Mouseover="onhover($event)" class="-mention-list-item"><div><span>@{{v.nickname}}</span>&nbsp;<small>({{v.name}})</small></div></li></ul></div><div ng-transclude></div></div>',
    scope: {
      typeahead: '@',
      mentionModel: '@',
      mentionList: '@',
      mentionDataMap: '@'
    },
    controller: function ($scope, mention_input, $log, $http) {
      $scope.focusIndex = false;
      $scope.listVisible = false;

      if (typeof $scope.mentionList !== 'undefined') {
        $http.get($scope.mentionList).success(function(userlist){
          $scope.values = userlist;
        }).error(function () {
          $scope.values = mention_input.userlist;
        });
      } else {
        $scope.values = mention_input.userlist;
      }

      $scope.matched = false;


      // if (typeof $scope.mentionDataMap !== 'undefined') {
      //   LIST_DATA = $scope.mentionDataMap;
      // }

      var padSelection = function (selection) {
        if (selection.substr(-1) !== ' ') {
          return selection + ' ';
        }
      };

      var setText = function (element, newText) {
        element.value = newText;
      };

      $scope.getChoices = function () {
        return angular.element($scope.element).find('ul').find('li');
      };

      $scope.onhover = function (obj) {
        if ('originalEvent' in obj) {
          obj = obj.originalEvent;
        }

        var source = angular.element(obj.target);
        if (!source.hasClass(CSS_CONSTANTS.listItem)) {
          return;
        }
        
        // $log.debug('[Event] mouseover: ', obj);

        var lis = $scope.getChoices();
        lis.removeClass(CSS_CONSTANTS.selected);
        source.addClass(CSS_CONSTANTS.selected);

        angular.forEach(lis, function (li, i) {
          if (angular.element(li).hasClass(CSS_CONSTANTS.selected)) {
            $scope.focusIndex = i;
          }
        });
        //source[0].scrollIntoView();
      };

      $scope.choose = function (v) {
        var regex = new RegExp('([^' + TOKEN + ']*)' + TOKEN + '[^$]*');
        var selection = v[LIST_DATA.token];
        if (selection.indexOf(TOKEN) >= 0) {
          selection = selection.replace(regex, '$1');
        }
        selection = padSelection(selection);

        var $textElement = $scope.textElement;
        var $textValue = $textElement.value;


        var replacementStart = $scope.cursorPos - $scope.find.length;
        var replacementEnd = $scope.cursorPos;

        var before = $textValue.slice(0, replacementStart);
        var replace = $textValue.slice(replacementStart, replacementEnd);
        var after = $textValue.slice(replacementEnd);

        var newText = before + TOKEN + selection + after;

        setText($textElement, newText);
        setCaretToPos($textElement, $scope.cursorPos + selection.length);
        $scope.$$nextSibling.$eval($scope.mentionModel + '="' + newText.replace('"','\\"') + '"');
        $scope.hideList();
      };


      $scope.reset = function () {
        $scope.focusIndex = -1;
        $scope.listVisible = false;
        $scope.matched = false;
      };

      $scope.hideList = function () {
        $scope.$itemList.style.display = 'none';
        var lis = $scope.getChoices();
        lis.removeClass(CSS_CONSTANTS.selected);
        $scope.reset();
      };

      $scope.displayList = function () {
        $scope.listVisible = true;
        $scope.$itemList.style.display = 'block';
        $scope.focusIndex = false;

        if ($scope.multiLine) {
          var cursorXY = angular.extend({left: 0, top: 0}, $scope.getCursorXY());
          var offset = {
            left: cursorXY.left + 5 + window.scrollX,
            top: cursorXY.top + 20 + window.scrollY
          };
          $scope.$itemList.style.left = offset.left + 'px';
          $scope.$itemList.style.top = offset.top + 'px';
        } else {
          $scope.$itemList.style.left = $scope.textElement.offsetLeft + 'px';
          $scope.$itemList.style.top = ($scope.textElement.offsetTop + $scope.textElement.offsetHeight) + 'px';
        }

        var lis = $scope.getChoices();
        lis.removeClass(CSS_CONSTANTS.selected);
      };


      $scope.iScrollWidth = scrollMeasure();


      $scope.getCursorXY = function () {
        var oTextArea = $scope.textElement;
        var oCanvas = $scope.canvas;

        var oPosition  = oTextArea.getBoundingClientRect();
        var sContent   = oTextArea.value;

        var styles = getComputedStyle(oTextArea);

        var textAreaHeight = parseFloat(styles.height.replace(/[^0-9.]/g, ''));
        var textAreaWidth = parseFloat(styles.width.replace(/[^0-9.]/g, ''));
        if (styles.boxSizing === 'border-box') {
          var topPadding = parseFloat(styles.paddingTop.replace(/[^0-9.]/g, ''));
          var bottomPadding = parseFloat(styles.paddingBottom.replace(/[^0-9.]/g, ''));
          var topBorder = parseFloat(styles.borderTopWidth.replace(/[^0-9.]/g, ''));
          var bottomBorder = parseFloat(styles.borderBottomWidth.replace(/[^0-9.]/g, ''));
          textAreaHeight = textAreaHeight - topPadding - bottomPadding - topBorder - bottomBorder;

          var leftPadding = parseFloat(styles.paddingLeft.replace(/[^0-9.]/g, ''));
          var rightPadding = parseFloat(styles.paddingRight.replace(/[^0-9.]/g, ''));
          var leftBorder = parseFloat(styles.borderLeftWidth.replace(/[^0-9.]/g, ''));
          var rightBorder = parseFloat(styles.borderRightWidth.replace(/[^0-9.]/g, ''));
          textAreaWidth = textAreaWidth - leftPadding - rightPadding - leftBorder - rightBorder;
        }


        oCanvas.width  = textAreaWidth;
        oCanvas.height = textAreaHeight;

        var oContext    = oCanvas.getContext('2d');
        var sFontSize   = styles.fontSize;
        var sLineHeight = styles.lineHeight;

        var sFontWeight = (styles.fontWeight === 'normal') ? 400 : styles.fontWeight;
        var sFontFamily = styles.fontFamily;
        var sFont       = [sFontWeight, sFontSize + '/' + sLineHeight, sFontFamily].join(' ');

        var iSubtractScrollWidth = (textAreaHeight < oTextArea.scrollHeight) ? $scope.iScrollWidth : 0;

        var fontSize    = parseFloat(sFontSize.replace(/[^0-9.]/g, ''));
        var lineHeight  = parseFloat(sLineHeight.replace(/[^0-9.]/g, ''));

        if (isNaN(lineHeight)) {
          if (oTextArea.rows) {
            lineHeight = textAreaHeight / oTextArea.rows;
          } else {
            // This is an approximation
            lineHeight = Math.floor(fontSize * 1.2);
          }
        }

        oContext.save();
        oContext.clearRect(0, 0, oCanvas.width, oCanvas.height);
        oContext.font = sFont;

        var lines = wordWrap(oContext, sContent.substring(0, oTextArea.selectionEnd), textAreaWidth - iSubtractScrollWidth);
        var y = (lines.length - 1) * lineHeight - oTextArea.scrollTop;
        var x = oContext.measureText(lines.pop()).width;
        return {left: oPosition.left + x, top: oPosition.top + y};
      };


      var eventHandlers = {};
      eventHandlers.tab = function ($event) {
        // $log.debug('[Event] KeyDown: tab');
        var lis = $scope.getChoices();
        angular.element(lis[$scope.focusIndex]).triggerHandler('click');
      };

      eventHandlers.enter = function ($event) {
        // $log.debug('[Event] KeyDown: return');
        var lis = $scope.getChoices();
        angular.element(lis[$scope.focusIndex]).triggerHandler('click');
      };

      eventHandlers.escape = function ($event) {
        // $log.debug('[Event] KeyDown: escape');
        $scope.hideList();
      };

      eventHandlers.upArrow = function ($event) {
        // $log.debug('[Event] KeyDown: upArrow');
        var lis = $scope.getChoices();
        if ($scope.focusIndex === false) {
          $scope.focusIndex = 0;
        }
        $scope.focusIndex = ($scope.focusIndex + lis.length - 1) % lis.length;
        lis.removeClass(CSS_CONSTANTS.selected);
        angular.element(lis[$scope.focusIndex]).addClass(CSS_CONSTANTS.selected);
        lis[$scope.focusIndex].scrollIntoView();
      };

      eventHandlers.downArrow = function ($event) {
        // $log.debug('[Event] KeyDown: downArrow');
        var lis = $scope.getChoices();
        if ($scope.focusIndex === false) {
          $scope.focusIndex = -1;
        }
        $scope.focusIndex = ($scope.focusIndex + 1) % lis.length;
        lis.removeClass(CSS_CONSTANTS.selected);
        angular.element(lis[$scope.focusIndex]).addClass(CSS_CONSTANTS.selected);
        lis[$scope.focusIndex].scrollIntoView();
      };



      //http://unixpapa.com/js/key.html
      //http://stackoverflow.com/questions/17388021/navigate-the-ui-using-only-keyboard
      //http://plnkr.co/edit/XRGPYCk6auOxmylMe0Uu?p=preview
      $scope.keys = [];
      $scope.keys.push({ code: 9, action: eventHandlers.tab });
      $scope.keys.push({ code: 13, action: eventHandlers.enter });
      $scope.keys.push({ code: 27, action: eventHandlers.escape });
      $scope.keys.push({ code: 38, action: eventHandlers.upArrow });
      $scope.keys.push({ code: 40, action: eventHandlers.downArrow });
      $scope.$on('keydown', function( $event, code ) {
        angular.forEach($scope.keys, function(o) {
          if ( o.code !== code ) {
            return;
          }
          o.action($event);
          $scope.$apply();
        });
      });
    },
    link: function ($scope, $element, $attrs) {
      $element.bind('keydown', function( event ) {
        if (!$scope.listVisible) {
          return;
        }

        angular.forEach($scope.keys, function (key) {
          if (event.keyCode === key.code) {
            event.preventDefault();
            event.stopPropagation();
            $scope.$broadcast('keydown', event.keyCode);
            return;
          }
        });
      });

      if (typeof $scope.mentionModel === 'undefined') {
        $scope.mentionModel = 'input';
      }

      $scope.$itemList = angular.element($element[0].querySelector('.' + CSS_CONSTANTS.container))[0];

      $scope.canvas = $element.children()[0];
      $scope.textElement = $element.children()[2].children[0];
      $scope.multiLine = ($scope.textElement.nodeName.toUpperCase() === 'TEXTAREA') ? true : false;
      $scope.$$nextSibling.$watch($scope.mentionModel, function (newVal, oldVal) {
        if (typeof newVal === 'undefined') {
          return;
        }

        var cursorPos = getCursorPos($scope.textElement).start;
        var text = newVal.substring(0, cursorPos);
        var regex = new RegExp('(^|\\b|\\s)' + TOKEN + '([\\w]*)$');
        var matches = text.match(regex);

        var lis = $scope.getChoices();
        lis.removeClass(CSS_CONSTANTS.selected);
        $scope.focusIndex = false;


        if (!matches && $scope.matched) {
          $scope.matched = false;
          $scope.hideList();
          return;
        }

        if (matches && !$scope.matched) {
          $scope.matched = true;
          $scope.displayList();
        }

        if (matches) {
          // Filter List
          $scope.mention = matches[2];
          $scope.find = TOKEN + matches[2];
          $scope.cursorPos = cursorPos;
        }

      }, true);

      $scope.element = $element[0];

      $scope.reset();
    }
  };
});
